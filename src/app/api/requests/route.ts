import { handle, fail, json, readJson, requireUser, str } from "@/lib/api";
import { getDb, mutate, newId } from "@/lib/db";
import { pendingRequestBetween, toPublicRequest } from "@/lib/listings";
import { scoreMatch } from "@/lib/matching";
import { pushNotification } from "@/lib/notify";
import { BERTH_INFO } from "@/lib/rail";
import { firstName } from "@/lib/format";
import type { SwapRequest } from "@/lib/types";

export const GET = handle(async () => {
  const user = await requireUser();
  const db = getDb();
  const requests = db.requests
    .filter((r) => r.fromUserId === user.id || r.toUserId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => toPublicRequest(r, db, user))
    .filter(Boolean);
  return json({ requests });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = await readJson(req);
  const toListingId = str(body.toListingId, 40);
  const fromListingId = str(body.fromListingId, 40);
  const message = str(body.message, 280);

  const db = getDb();
  const to = db.listings.find((l) => l.id === toListingId);
  const from = db.listings.find((l) => l.id === fromListingId);
  if (!to || !from) return fail("Listing not found.", 404);
  if (from.userId !== user.id) return fail("Pick one of your own seats to offer.", 403);
  if (to.userId === user.id) return fail("That's your own seat.");
  if (to.status !== "active" || from.status !== "active") return fail("One of these seats is no longer available.");
  if (to.trainNo !== from.trainNo || to.journeyDate !== from.journeyDate) return fail("Both seats must be on the same train and date.");
  if (to.travelClass !== from.travelClass) return fail("Swaps are only possible within the same class.");
  if (to.wants.womenOnly && from.passenger.gender !== "F") return fail("This passenger prefers to swap with women passengers only.", 403);
  if (from.wants.womenOnly && to.passenger.gender !== "F") return fail("Your listing is set to women-only swaps.", 403);
  if (pendingRequestBetween(db, from.id, to.id)) return fail("There's already a pending request between these seats.", 409);

  const match = scoreMatch(from, to);
  const r: SwapRequest = {
    id: newId("r_"),
    trainNo: to.trainNo,
    journeyDate: to.journeyDate,
    fromListingId: from.id,
    toListingId: to.id,
    fromUserId: user.id,
    toUserId: to.userId,
    message: message || undefined,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  mutate((d) => {
    d.requests.push(r);
    pushNotification(
      d,
      to.userId,
      "New swap request",
      `${firstName(user.name)} offers ${from.coach}-${from.seatNo} (${BERTH_INFO[from.berthType].short}) for your ${to.coach}-${to.seatNo} on ${to.trainNo}.`,
      "/requests",
    );
  });
  return json({ request: toPublicRequest(r, db, user), match }, 201);
});
