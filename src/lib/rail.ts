import type { BerthType, TravelClass } from "./types";

export const CLASS_INFO: Record<
  TravelClass,
  { label: string; short: string; coachPrefix: string; sitting: boolean; maxSeat: number }
> = {
  SL: { label: "Sleeper", short: "SL", coachPrefix: "S", sitting: false, maxSeat: 80 },
  "3A": { label: "AC 3 Tier", short: "3A", coachPrefix: "B", sitting: false, maxSeat: 72 },
  "3E": { label: "AC 3 Economy", short: "3E", coachPrefix: "M", sitting: false, maxSeat: 83 },
  "2A": { label: "AC 2 Tier", short: "2A", coachPrefix: "A", sitting: false, maxSeat: 54 },
  "1A": { label: "AC First", short: "1A", coachPrefix: "H", sitting: false, maxSeat: 24 },
  CC: { label: "AC Chair Car", short: "CC", coachPrefix: "C", sitting: true, maxSeat: 78 },
  EC: { label: "Executive Chair", short: "EC", coachPrefix: "E", sitting: true, maxSeat: 56 },
  "2S": { label: "Second Sitting", short: "2S", coachPrefix: "D", sitting: true, maxSeat: 108 },
};

export const CLASS_ORDER: TravelClass[] = ["SL", "3A", "3E", "2A", "1A", "CC", "EC", "2S"];

export const BERTH_INFO: Record<BerthType, { label: string; short: string; tone: string }> = {
  LB: { label: "Lower berth", short: "Lower", tone: "green" },
  MB: { label: "Middle berth", short: "Middle", tone: "amber" },
  UB: { label: "Upper berth", short: "Upper", tone: "blue" },
  SL: { label: "Side lower", short: "Side lower", tone: "teal" },
  SM: { label: "Side middle", short: "Side middle", tone: "amber" },
  SU: { label: "Side upper", short: "Side upper", tone: "violet" },
  WS: { label: "Window seat", short: "Window", tone: "sky" },
  MS: { label: "Middle seat", short: "Middle", tone: "amber" },
  AS: { label: "Aisle seat", short: "Aisle", tone: "slate" },
};

/** Berth options that make sense for a given class */
export function berthOptionsFor(cls: TravelClass): BerthType[] {
  switch (cls) {
    case "SL":
    case "3A":
      return ["LB", "MB", "UB", "SL", "SU"];
    case "3E":
      return ["LB", "MB", "UB", "SL", "SM", "SU"];
    case "2A":
      return ["LB", "UB", "SL", "SU"];
    case "1A":
      return ["LB", "UB"];
    case "CC":
    case "EC":
    case "2S":
      return ["WS", "MS", "AS"];
  }
}

/**
 * Indian Railways numbers berths in a fixed repeating pattern per bay,
 * so the berth type can be derived from the seat number for sleeper classes.
 * Returns undefined for sitting classes (layouts vary by coach).
 */
const PATTERNS: Partial<Record<TravelClass, BerthType[]>> = {
  SL: ["LB", "MB", "UB", "LB", "MB", "UB", "SL", "SU"],
  "3A": ["LB", "MB", "UB", "LB", "MB", "UB", "SL", "SU"],
  "3E": ["LB", "MB", "UB", "LB", "MB", "UB", "SL", "SM", "SU"],
  "2A": ["LB", "UB", "LB", "UB", "SL", "SU"],
  "1A": ["LB", "UB"],
};

export function deriveBerthType(cls: TravelClass, seatNo: number): BerthType | undefined {
  const p = PATTERNS[cls];
  if (!p || !Number.isInteger(seatNo) || seatNo < 1) return undefined;
  return p[(seatNo - 1) % p.length];
}

/** Bay number (1-based) a berth belongs to, for "near seat" hints. */
export function bayOf(cls: TravelClass, seatNo: number): number | undefined {
  const p = PATTERNS[cls];
  if (!p || seatNo < 1) return undefined;
  return Math.floor((seatNo - 1) / p.length) + 1;
}

export function isSittingClass(cls: TravelClass) {
  return CLASS_INFO[cls].sitting;
}

export function normalizeCoach(coach: string) {
  return coach.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidCoach(coach: string) {
  return /^[A-Z]{1,2}[0-9]{1,2}$/.test(normalizeCoach(coach));
}

export function isValidPnr(pnr: string) {
  return /^\d{10}$/.test(pnr.trim());
}

export function isValidTrainNo(no: string) {
  return /^\d{5}$/.test(no.trim());
}

export function isValidMobile(m: string) {
  return /^[6-9]\d{9}$/.test(m.trim());
}
