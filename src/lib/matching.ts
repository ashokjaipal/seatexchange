import type { Listing } from "./types";
import { BERTH_INFO, bayOf, normalizeCoach } from "./rail";

export type MatchLabel = "perfect" | "good" | "possible";

export interface MatchResult {
  score: number;
  label: MatchLabel;
  /** Short, human reasons ("They have the Lower berth you want") */
  reasons: string[];
  /** Whether what *they* have satisfies what *I* want */
  theyHaveWhatIWant: boolean;
  /** Whether what *I* have satisfies what *they* want */
  iHaveWhatTheyWant: boolean;
}

function berthOk(offered: Listing, wanter: Listing): boolean {
  const wanted = wanter.wants.berthTypes;
  return wanted.length === 0 || wanted.includes(offered.berthType);
}

function coachOk(offered: Listing, wanter: Listing): boolean {
  if (!wanter.wants.coach) return false;
  return normalizeCoach(offered.coach) === normalizeCoach(wanter.wants.coach);
}

function nearOk(offered: Listing, wanter: Listing): boolean {
  if (!wanter.wants.coach || !wanter.wants.nearSeat) return false;
  if (!coachOk(offered, wanter)) return false;
  const a = bayOf(offered.travelClass, offered.seatNo);
  const b = bayOf(offered.travelClass, wanter.wants.nearSeat);
  if (a === undefined || b === undefined) return Math.abs(offered.seatNo - wanter.wants.nearSeat) <= 4;
  return Math.abs(a - b) <= 1;
}

/**
 * Score how good a swap between `mine` and `theirs` would be.
 * Returns null when a swap is not possible (different train/date/class,
 * a women-only preference not met, or the same listing/user).
 */
export function scoreMatch(mine: Listing, theirs: Listing): MatchResult | null {
  if (mine.id === theirs.id || mine.userId === theirs.userId) return null;
  if (mine.trainNo !== theirs.trainNo || mine.journeyDate !== theirs.journeyDate) return null;
  if (mine.travelClass !== theirs.travelClass) return null;
  if (mine.status !== "active" || theirs.status !== "active") return null;
  if (mine.wants.womenOnly && theirs.passenger.gender !== "F") return null;
  if (theirs.wants.womenOnly && mine.passenger.gender !== "F") return null;

  let score = 0;
  const reasons: string[] = [];

  const theyHaveWhatIWant = berthOk(theirs, mine);
  const iHaveWhatTheyWant = berthOk(mine, theirs);

  if (theyHaveWhatIWant) {
    score += 2;
    if (mine.wants.berthTypes.length) reasons.push(`They have the ${BERTH_INFO[theirs.berthType].label.toLowerCase()} you want`);
  }
  if (iHaveWhatTheyWant) {
    score += 2;
    if (theirs.wants.berthTypes.length) reasons.push(`They want your ${BERTH_INFO[mine.berthType].label.toLowerCase()}`);
  }
  if (nearOk(theirs, mine)) {
    score += 2;
    reasons.push(`Their seat is right next to ${mine.wants.coach} ${mine.wants.nearSeat}`);
  } else if (coachOk(theirs, mine)) {
    score += 1;
    reasons.push(`Their seat is in coach ${normalizeCoach(mine.wants.coach!)}`);
  }
  if (nearOk(mine, theirs)) {
    score += 2;
    reasons.push(`Your seat is right next to where they want to be`);
  } else if (coachOk(mine, theirs)) {
    score += 1;
    reasons.push(`Your seat is in the coach they want`);
  }
  // Nothing substantive in common (no berth or coach fit either way): not a match
  if (score <= 0) return null;

  if (mine.from === theirs.from && mine.to === theirs.to) {
    score += 1;
  } else {
    reasons.push("Different boarding or destination - check the overlap");
  }

  const iGetWhatIWant = theyHaveWhatIWant && (mine.wants.berthTypes.length > 0 || !mine.wants.coach || coachOk(theirs, mine));
  const label: MatchLabel =
    theyHaveWhatIWant && iHaveWhatTheyWant && (!mine.wants.coach || coachOk(theirs, mine))
      ? "perfect"
      : iGetWhatIWant || (iHaveWhatTheyWant && nearOk(theirs, mine))
        ? "good"
        : "possible";
  return { score, label, reasons, theyHaveWhatIWant, iHaveWhatTheyWant };
}

export function bestMatchAgainst(myListings: Listing[], theirs: Listing): (MatchResult & { myListingId: string }) | null {
  let best: (MatchResult & { myListingId: string }) | null = null;
  for (const mine of myListings) {
    const r = scoreMatch(mine, theirs);
    if (r && (!best || r.score > best.score)) best = { ...r, myListingId: mine.id };
  }
  return best;
}
