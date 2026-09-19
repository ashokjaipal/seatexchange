import type { Database, Listing, User, BerthType, TravelClass, Gender, Wants } from "./types";
import { addDays, todayYmd } from "./format";
import { getTrain } from "./trains";
import { deriveBerthType } from "./rail";
import { hashPnr } from "./pnr";

/**
 * Demo data so the product is alive on first run. Dates are relative to
 * "today" so the boards are never empty. Demo accounts can be used to try
 * both sides of a swap (mobile 9000000001 ... 9000000010, OTP 123456).
 */
export const DEMO_USERS: { id: string; name: string; mobile: string; gender: Gender }[] = [
  { id: "u_priya", name: "Priya Sharma", mobile: "9000000001", gender: "F" },
  { id: "u_rahul", name: "Rahul Verma", mobile: "9000000002", gender: "M" },
  { id: "u_anjali", name: "Anjali Mehta", mobile: "9000000003", gender: "F" },
  { id: "u_suresh", name: "Suresh Iyer", mobile: "9000000004", gender: "M" },
  { id: "u_neha", name: "Neha Gupta", mobile: "9000000005", gender: "F" },
  { id: "u_arjun", name: "Arjun Singh", mobile: "9000000006", gender: "M" },
  { id: "u_meera", name: "Meera Nair", mobile: "9000000007", gender: "F" },
  { id: "u_vikram", name: "Vikram Rao", mobile: "9000000008", gender: "M" },
  { id: "u_kavita", name: "Kavita Joshi", mobile: "9000000009", gender: "F" },
  { id: "u_imran", name: "Imran Khan", mobile: "9000000010", gender: "M" },
];

interface SeedListing {
  id: string;
  user: string;
  trainNo: string;
  dayOffset: number;
  cls: TravelClass;
  coach: string;
  seat: number;
  berth?: BerthType;
  age: number;
  wants: Wants;
  hoursAgo: number;
}

const L: SeedListing[] = [
  // 12951 Mumbai Rajdhani, tomorrow
  { id: "l_s01", user: "u_priya", trainNo: "12951", dayOffset: 1, cls: "3A", coach: "B2", seat: 23, age: 33, hoursAgo: 5,
    wants: { berthTypes: ["LB", "MB"], coach: "B2", nearSeat: 17, note: "Travelling with my 6-year-old. My husband is on B2-17, would love to sit together." } },
  { id: "l_s02", user: "u_rahul", trainNo: "12951", dayOffset: 1, cls: "3A", coach: "B2", seat: 18, age: 29, hoursAgo: 9,
    wants: { berthTypes: ["SL", "SU"], note: "Prefer a side berth. Happy to give up my middle berth." } },
  { id: "l_s03", user: "u_suresh", trainNo: "12951", dayOffset: 1, cls: "3A", coach: "B1", seat: 1, age: 38, hoursAgo: 26,
    wants: { berthTypes: [], note: "Happy to give my lower berth to anyone who needs it, senior citizens first." } },
  { id: "l_s04", user: "u_neha", trainNo: "12951", dayOffset: 1, cls: "2A", coach: "A1", seat: 10, age: 27, hoursAgo: 3,
    wants: { berthTypes: ["LB"], womenOnly: true, note: "Travelling alone, would prefer to swap with a woman passenger." } },
  { id: "l_s05", user: "u_arjun", trainNo: "12951", dayOffset: 1, cls: "2A", coach: "A1", seat: 15, age: 24, hoursAgo: 14,
    wants: { berthTypes: ["UB", "SU"], note: "I'm fine with an upper. Lower berth to someone who needs it." } },
  { id: "l_s06", user: "u_meera", trainNo: "12951", dayOffset: 1, cls: "2A", coach: "A2", seat: 21, age: 45, hoursAgo: 7,
    wants: { berthTypes: [], note: "Would take an upper if it helps someone." } },
  { id: "l_s07", user: "u_vikram", trainNo: "12951", dayOffset: 1, cls: "3A", coach: "B4", seat: 40, age: 31, hoursAgo: 20,
    wants: { berthTypes: ["LB", "MB"], note: "Side upper is very cramped for me (6 ft 2). Any inside berth works." } },
  // 12951 today
  { id: "l_s08", user: "u_kavita", trainNo: "12951", dayOffset: 0, cls: "3A", coach: "B3", seat: 5, age: 52, hoursAgo: 30,
    wants: { berthTypes: ["LB"], note: "Knee surgery last year, climbing is hard." } },
  { id: "l_s09", user: "u_imran", trainNo: "12951", dayOffset: 0, cls: "3A", coach: "B3", seat: 4, age: 26, hoursAgo: 16,
    wants: { berthTypes: [], note: "Any berth works for me." } },
  // 12301 Howrah Rajdhani, day after tomorrow
  { id: "l_s10", user: "u_anjali", trainNo: "12301", dayOffset: 2, cls: "2A", coach: "A1", seat: 5, age: 36, hoursAgo: 2,
    wants: { berthTypes: ["LB", "UB"], coach: "A1", nearSeat: 1, note: "My parents are on A1-1 and A1-3. Want to be in the same bay." } },
  { id: "l_s11", user: "u_imran", trainNo: "12301", dayOffset: 2, cls: "2A", coach: "A1", seat: 2, age: 26, hoursAgo: 11,
    wants: { berthTypes: ["SL", "SU"], note: "Would like a side berth to work on my laptop." } },
  { id: "l_s12", user: "u_suresh", trainNo: "12301", dayOffset: 2, cls: "3A", coach: "B5", seat: 31, age: 38, hoursAgo: 40,
    wants: { berthTypes: ["UB"], note: "Side lower gets noisy, I'd rather have an upper." } },
  { id: "l_s13", user: "u_priya", trainNo: "12301", dayOffset: 2, cls: "3A", coach: "B5", seat: 56, age: 33, hoursAgo: 8,
    wants: { berthTypes: ["LB"], note: "Travelling with my mother (68), she cannot climb to side upper." } },
  // 22435 Vande Bharat, tomorrow
  { id: "l_s14", user: "u_rahul", trainNo: "22435", dayOffset: 1, cls: "CC", coach: "C4", seat: 45, berth: "WS", age: 29, hoursAgo: 6,
    wants: { berthTypes: ["AS"], note: "I keep getting up for calls, happy to give away the window." } },
  { id: "l_s15", user: "u_meera", trainNo: "22435", dayOffset: 1, cls: "CC", coach: "C4", seat: 44, berth: "AS", age: 45, hoursAgo: 4,
    wants: { berthTypes: ["WS"], note: "First Vande Bharat trip for my son, he wants the window!" } },
  { id: "l_s16", user: "u_neha", trainNo: "22435", dayOffset: 1, cls: "EC", coach: "E1", seat: 12, berth: "MS", age: 27, hoursAgo: 12,
    wants: { berthTypes: ["WS", "AS"], note: "Anything but the middle seat." } },
  // 12621 Tamil Nadu Express, tomorrow
  { id: "l_s17", user: "u_arjun", trainNo: "12621", dayOffset: 1, cls: "SL", coach: "S6", seat: 33, age: 24, hoursAgo: 18,
    wants: { berthTypes: [], note: "Giving my lower berth to anyone elderly or with kids." } },
  { id: "l_s18", user: "u_kavita", trainNo: "12621", dayOffset: 1, cls: "SL", coach: "S6", seat: 34, age: 52, hoursAgo: 10,
    wants: { berthTypes: ["LB"], note: "Travelling with my mother, 72. She needs a lower berth." } },
  { id: "l_s19", user: "u_vikram", trainNo: "12621", dayOffset: 1, cls: "3A", coach: "B1", seat: 8, age: 31, hoursAgo: 22,
    wants: { berthTypes: ["SL", "LB"], note: "Side upper is too tight for me." } },
  // 12009 Shatabdi, today
  { id: "l_s20", user: "u_anjali", trainNo: "12009", dayOffset: 0, cls: "CC", coach: "C2", seat: 27, berth: "WS", age: 36, hoursAgo: 15,
    wants: { berthTypes: ["AS"], note: "Need the aisle, I get off at Surat." } },
  // 12301, +5 days
  { id: "l_s21", user: "u_meera", trainNo: "12301", dayOffset: 5, cls: "3A", coach: "B2", seat: 3, age: 45, hoursAgo: 50,
    wants: { berthTypes: ["LB"], note: "Would love a lower berth for my mother-in-law." } },
];

export function seedDatabase(db: Database) {
  const now = Date.now();
  const today = todayYmd();
  const users: User[] = DEMO_USERS.map((u, i) => ({
    ...u,
    createdAt: new Date(now - (90 - i) * 86400000).toISOString(),
  }));
  const listings: Listing[] = L.map((s, i) => {
    const t = getTrain(s.trainNo)!;
    const u = DEMO_USERS.find((x) => x.id === s.user)!;
    const pnr = String(4000000000 + i * 7919 + 12345);
    const created = new Date(now - s.hoursAgo * 3600000).toISOString();
    return {
      id: s.id,
      userId: s.user,
      trainNo: s.trainNo,
      trainName: t.name,
      journeyDate: addDays(today, s.dayOffset),
      from: t.from.name,
      to: t.to.name,
      travelClass: s.cls,
      coach: s.coach,
      seatNo: s.seat,
      berthType: s.berth ?? deriveBerthType(s.cls, s.seat) ?? "LB",
      passenger: { name: u.name, age: s.age, gender: u.gender },
      pnrLast4: pnr.slice(-4),
      pnrHash: hashPnr(pnr),
      wants: s.wants,
      status: "active",
      createdAt: created,
      updatedAt: created,
    };
  });

  db.users.push(...users);
  db.listings.push(...listings);

  // A pending request Rahul has received on the Vande Bharat, and an accepted one on Tamil Nadu Express
  const t1 = new Date(now - 2 * 3600000).toISOString();
  db.requests.push({
    id: "r_s01",
    trainNo: "22435",
    journeyDate: addDays(today, 1),
    fromListingId: "l_s15",
    toListingId: "l_s14",
    fromUserId: "u_meera",
    toUserId: "u_rahul",
    message: "Hi Rahul! My son would be thrilled with the window. Happy to swap?",
    status: "pending",
    createdAt: t1,
  });
  const t2 = new Date(now - 8 * 3600000).toISOString();
  db.requests.push({
    id: "r_s02",
    trainNo: "12621",
    journeyDate: addDays(today, 1),
    fromListingId: "l_s18",
    toListingId: "l_s17",
    fromUserId: "u_kavita",
    toUserId: "u_arjun",
    message: "Thank you so much for offering, my mother will be very grateful.",
    status: "accepted",
    createdAt: t2,
    respondedAt: new Date(now - 6 * 3600000).toISOString(),
  });
  db.notifications.push(
    {
      id: "n_s01",
      userId: "u_rahul",
      title: "New swap request",
      body: "Meera wants to swap C4-44 (Aisle) for your C4-45 (Window) on 22435.",
      href: "/requests",
      read: false,
      createdAt: t1,
    },
    {
      id: "n_s02",
      userId: "u_kavita",
      title: "Swap accepted!",
      body: "Arjun accepted your request on 12621. Contact details are now visible.",
      href: "/requests",
      read: false,
      createdAt: new Date(now - 6 * 3600000).toISOString(),
    },
  );
  db.seededAt = new Date().toISOString();
}
