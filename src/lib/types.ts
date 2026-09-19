export type TravelClass = "SL" | "3A" | "3E" | "2A" | "1A" | "CC" | "EC" | "2S";

/**
 * Berth / seat position codes.
 *  LB Lower berth, MB Middle berth, UB Upper berth,
 *  SL Side lower, SM Side middle (3E only), SU Side upper,
 *  WS Window seat, MS Middle seat, AS Aisle seat (chair car / sitting classes)
 */
export type BerthType = "LB" | "MB" | "UB" | "SL" | "SM" | "SU" | "WS" | "MS" | "AS";

export type Gender = "M" | "F" | "O";

export interface User {
  id: string;
  mobile: string; // 10 digit Indian mobile
  name: string;
  gender?: Gender;
  createdAt: string;
}

export interface Passenger {
  name: string;
  age?: number;
  gender?: Gender;
}

export interface Wants {
  /** Empty array = any berth is fine */
  berthTypes: BerthType[];
  /** Wants to be in / near this coach (e.g. family sits in S4) */
  coach?: string;
  /** Wants to be near this seat number in the coach above */
  nearSeat?: number;
  /** Only swap with women passengers (safety preference) */
  womenOnly?: boolean;
  /** Free text: "Travelling with my 70 year old mother" */
  note?: string;
}

export type ListingStatus = "active" | "swapped" | "withdrawn" | "expired";

export interface Listing {
  id: string;
  userId: string;
  trainNo: string;
  trainName: string;
  journeyDate: string; // YYYY-MM-DD, date of boarding
  from: string; // station name or code
  to: string;
  travelClass: TravelClass;
  coach: string; // S4, B2, A1 ...
  seatNo: number;
  berthType: BerthType;
  passenger: Passenger;
  pnrLast4: string;
  pnrHash: string;
  wants: Wants;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled" | "completed";

export interface SwapRequest {
  id: string;
  trainNo: string;
  journeyDate: string;
  fromListingId: string; // proposer's seat
  toListingId: string; // seat they want
  fromUserId: string;
  toUserId: string;
  message?: string;
  status: RequestStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

export interface OtpEntry {
  mobile: string;
  code: string;
  expiresAt: string;
  attempts: number;
}

export interface Database {
  users: User[];
  listings: Listing[];
  requests: SwapRequest[];
  notifications: Notification[];
  otps: OtpEntry[];
  seededAt?: string;
}

/** Public shape of a listing (never leaks PNR hash, exposes only first name) */
export interface PublicListing extends Omit<Listing, "pnrHash" | "passenger"> {
  passenger: { firstName: string; age?: number; gender?: Gender };
  ownerName: string;
  isMine: boolean;
}
