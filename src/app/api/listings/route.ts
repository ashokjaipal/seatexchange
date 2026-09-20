import { handle, fail, json, readJson, requireUser, str, num } from "@/lib/api";
import { getDb, mutate, newId } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { activeListingsForTrain, myActiveListingsOnTrain, toPublicListing } from "@/lib/listings";
import { bestMatchAgainst, scoreMatch } from "@/lib/matching";
import { pushNotification } from "@/lib/notify";
import { hashPnr, lookupPnr } from "@/lib/pnr";
import { addDays, isValidYmd, todayYmd, formatDate } from "@/lib/format";
import {
  CLASS_INFO,
  BERTH_INFO,
  berthOptionsFor,
  deriveBerthType,
  isValidCoach,
  isValidPnr,
  isValidTrainNo,
  normalizeCoach,
} from "@/lib/rail";
import { getTrain } from "@/lib/trains";
import type { BerthType, Gender, Listing, TravelClass, Wants } from "@/lib/types";

export const GET = handle(async (req: Request) => {
  const url = new URL(req.url);
  const trainNo = str(url.searchParams.get("train"), 5);
  const date = str(url.searchParams.get("date"), 10);
  if (!isValidTrainNo(trainNo) || !isValidYmd(date)) return fail("train and date are required.");
  const viewer = await getSessionUser();
  const db = await getDb();
  const mine = viewer ? myActiveListingsOnTrain(db, viewer.id, trainNo, date) : [];
  const listings = activeListingsForTrain(db, trainNo, date).map((l) => ({
    ...toPublicListing(l, db, viewer?.id),
    match: mine.length ? bestMatchAgainst(mine, l) : null,
  }));
  return json({ listings, myListings: mine.map((l) => toPublicListing(l, db, viewer?.id)) });
});

interface CreateBody {
  trainNo?: string;
  trainName?: string;
  journeyDate?: string;
  from?: string;
  to?: string;
  travelClass?: string;
  coach?: string;
  seatNo?: number | string;
  berthType?: string;
  pnr?: string;
  passengerNumber?: number | string;
  passenger?: { name?: string; age?: number | string; gender?: string };
  wants?: { berthTypes?: string[]; coach?: string; nearSeat?: number | string; womenOnly?: boolean; note?: string };
}

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const b = await readJson<CreateBody>(req);

  const pnr = str(b.pnr, 10);
  if (!isValidPnr(pnr)) return fail("PNR must be exactly 10 digits.");

  // Manual values from the form (used only when the PNR can't be looked up)
  let trainNo = str(b.trainNo, 5);
  let trainName = "";
  let journeyDate = str(b.journeyDate, 10);
  let from = str(b.from, 60);
  let to = str(b.to, 60);
  let travelClass = str(b.travelClass, 2) as TravelClass;
  let coach = normalizeCoach(str(b.coach, 4));
  let seatNo = num(b.seatNo);
  let berthType = str(b.berthType, 2) as BerthType;
  let pnrVerified = false;

  // Live PNR status is the source of truth whenever it is available
  const lookup = await lookupPnr(pnr);
  if (lookup.ok) {
    const d = lookup.details;
    if (d.cancelled) return fail("IRCTC shows this train as cancelled.");
    const confirmed = d.passengers.filter((p) => p.status === "CNF" && p.coach && p.seatNo);
    if (!confirmed.length) return fail("No confirmed seat on this PNR yet. You can list once it is confirmed.");
    const wanted = num(b.passengerNumber);
    const pick =
      confirmed.find((p) => p.number === wanted) ??
      confirmed.find((p) => coach && seatNo && p.coach === coach && p.seatNo === seatNo) ??
      (confirmed.length === 1 ? confirmed[0] : undefined);
    if (!pick) return fail("Pick which passenger's seat to list.");
    trainNo = d.trainNo;
    trainName = d.trainName;
    journeyDate = d.journeyDate;
    from = d.from || from;
    to = d.to || to;
    travelClass = d.travelClass;
    coach = pick.coach!;
    seatNo = pick.seatNo!;
    berthType = pick.berthType ?? deriveBerthType(travelClass, seatNo) ?? berthType;
    pnrVerified = d.verified;
  } else if (lookup.reason === "not_found") {
    return fail(lookup.message, 404);
  }
  // reason "unavailable" / "not_configured": fall through to manual details

  if (!isValidTrainNo(trainNo)) return fail("Enter a valid 5-digit train number.");
  const known = getTrain(trainNo);
  trainName = trainName || known?.name || str(b.trainName, 60);
  if (!trainName) return fail("Enter the train name.");

  const today = todayYmd();
  if (!isValidYmd(journeyDate)) return fail("Pick a valid journey date.");
  if (journeyDate < today) return fail("Journey date can't be in the past.");
  if (journeyDate > addDays(today, 120)) return fail("Journey date is too far ahead (max 120 days).");

  from = from || known?.from.name || "";
  to = to || known?.to.name || "";
  if (!from || !to) return fail("Enter boarding and destination stations.");

  if (!(travelClass in CLASS_INFO)) return fail("Pick a travel class.");
  if (!isValidCoach(coach)) return fail("Coach looks wrong. Examples: S4, B2, A1, C3.");
  if (!seatNo || !Number.isInteger(seatNo) || seatNo < 1 || seatNo > CLASS_INFO[travelClass].maxSeat) {
    return fail(`Seat number must be between 1 and ${CLASS_INFO[travelClass].maxSeat} for ${CLASS_INFO[travelClass].label}.`);
  }
  if (!berthOptionsFor(travelClass).includes(berthType)) return fail("Pick your berth / seat type.");

  const pName = str(b.passenger?.name, 60) || user.name;
  const pAge = num(b.passenger?.age);
  if (pAge !== undefined && (pAge < 1 || pAge > 120)) return fail("Enter a valid age.");
  const gRaw = str(b.passenger?.gender, 1);
  const pGender = (["M", "F", "O"].includes(gRaw) ? gRaw : user.gender) as Gender | undefined;

  const allowed = berthOptionsFor(travelClass);
  const wantBerths = Array.isArray(b.wants?.berthTypes)
    ? (b.wants!.berthTypes!.map((x) => str(x, 2)).filter((x) => allowed.includes(x as BerthType)) as BerthType[])
    : [];
  const wantCoach = normalizeCoach(str(b.wants?.coach, 4));
  if (wantCoach && !isValidCoach(wantCoach)) return fail("Preferred coach looks wrong. Examples: S4, B2.");
  const nearSeat = num(b.wants?.nearSeat);
  if (nearSeat !== undefined && (nearSeat < 1 || nearSeat > 120)) return fail("Enter a valid seat number to be near.");
  const womenOnly = !!b.wants?.womenOnly && pGender === "F";
  const note = str(b.wants?.note, 280);

  if (wantBerths.length === 1 && wantBerths[0] === berthType && !wantCoach) {
    return fail(`You already have a ${BERTH_INFO[berthType].label.toLowerCase()}. Pick what you'd like instead.`);
  }

  const pnrHash = hashPnr(pnr);
  const db = await getDb();
  const dup = db.listings.find(
    (l) =>
      l.status === "active" &&
      l.trainNo === trainNo &&
      l.journeyDate === journeyDate &&
      normalizeCoach(l.coach) === coach &&
      l.seatNo === seatNo,
  );
  if (dup) {
    return fail(
      dup.userId === user.id ? "You've already listed this seat. Edit it from My seats." : "This seat is already listed by another passenger.",
      409,
    );
  }

  const wants: Wants = { berthTypes: [...new Set(wantBerths)] };
  if (wantCoach) wants.coach = wantCoach;
  if (wantCoach && nearSeat) wants.nearSeat = nearSeat;
  if (womenOnly) wants.womenOnly = true;
  if (note) wants.note = note;

  const nowIso = new Date().toISOString();
  const listing: Listing = {
    id: newId("l_"),
    userId: user.id,
    trainNo,
    trainName,
    journeyDate,
    from,
    to,
    travelClass,
    coach,
    seatNo,
    berthType,
    passenger: { name: pName, age: pAge, gender: pGender },
    pnrLast4: pnr.slice(-4),
    pnrHash,
    pnrVerified,
    wants,
    status: "active",
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const matches = await mutate((d) => {
    d.listings.push(listing);
    // Tell co-passengers whose wishes this seat fulfils
    const others = activeListingsForTrain(d, trainNo, journeyDate).filter((l) => l.id !== listing.id);
    let count = 0;
    for (const other of others) {
      const m = scoreMatch(other, listing);
      if (m && m.theyHaveWhatIWant) {
        pushNotification(
          d,
          other.userId,
          "A seat you might want just got listed",
          `${coach}-${seatNo} (${BERTH_INFO[berthType].label}) on ${trainNo} for ${formatDate(journeyDate)}.`,
          `/listing/${listing.id}`,
        );
      }
      if (m) count += 1;
    }
    return count;
  });

  return json({ listing: toPublicListing(listing, db, user.id), matchCount: matches }, 201);
});
