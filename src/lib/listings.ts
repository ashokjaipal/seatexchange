import type { Database, Listing, PublicListing, SwapRequest, User } from "./types";
import { firstName } from "./format";

/** The exact berth number is private until a swap involving both parties is accepted. */
export function seatRevealedTo(l: Listing, db: Database, viewerId?: string | null): boolean {
  if (!viewerId) return false;
  if (l.userId === viewerId) return true;
  return db.requests.some(
    (r) =>
      (r.status === "accepted" || r.status === "completed") &&
      (r.fromListingId === l.id || r.toListingId === l.id) &&
      (r.fromUserId === viewerId || r.toUserId === viewerId),
  );
}

export function toPublicListing(l: Listing, db: Database, viewerId?: string | null): PublicListing {
  const owner = db.users.find((u) => u.id === l.userId);
  const { pnrHash: _pnrHash, passenger, seatNo, ...rest } = l;
  void _pnrHash;
  const revealed = seatRevealedTo(l, db, viewerId);
  return {
    ...rest,
    ...(revealed ? { seatNo } : {}),
    passenger: { firstName: firstName(passenger.name), age: passenger.age, gender: passenger.gender },
    ownerName: owner ? firstName(owner.name) : "Traveller",
    isMine: !!viewerId && l.userId === viewerId,
  };
}

export function activeListingsForTrain(db: Database, trainNo: string, journeyDate: string): Listing[] {
  return db.listings
    .filter((l) => l.trainNo === trainNo && l.journeyDate === journeyDate && l.status === "active")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function myActiveListingsOnTrain(db: Database, userId: string, trainNo: string, journeyDate: string): Listing[] {
  return db.listings.filter(
    (l) => l.userId === userId && l.trainNo === trainNo && l.journeyDate === journeyDate && l.status === "active",
  );
}

export interface PublicRequest {
  id: string;
  status: SwapRequest["status"];
  message?: string;
  createdAt: string;
  respondedAt?: string;
  direction: "received" | "sent";
  mine: PublicListing;
  theirs: PublicListing;
  /** Only present once the swap is accepted */
  contact?: { name: string; mobile: string };
}

export function toPublicRequest(r: SwapRequest, db: Database, viewer: User): PublicRequest | null {
  const from = db.listings.find((l) => l.id === r.fromListingId);
  const to = db.listings.find((l) => l.id === r.toListingId);
  if (!from || !to) return null;
  const direction: "received" | "sent" = r.toUserId === viewer.id ? "received" : "sent";
  const mineL = direction === "received" ? to : from;
  const theirsL = direction === "received" ? from : to;
  const other = db.users.find((u) => u.id === (direction === "received" ? r.fromUserId : r.toUserId));
  const revealed = r.status === "accepted" || r.status === "completed";
  return {
    id: r.id,
    status: r.status,
    message: r.message,
    createdAt: r.createdAt,
    respondedAt: r.respondedAt,
    direction,
    mine: toPublicListing(mineL, db, viewer.id),
    theirs: toPublicListing(theirsL, db, viewer.id),
    contact: revealed && other ? { name: other.name, mobile: other.mobile } : undefined,
  };
}

export function pendingRequestBetween(db: Database, a: string, b: string): SwapRequest | undefined {
  return db.requests.find(
    (r) =>
      r.status === "pending" &&
      ((r.fromListingId === a && r.toListingId === b) || (r.fromListingId === b && r.toListingId === a)),
  );
}
