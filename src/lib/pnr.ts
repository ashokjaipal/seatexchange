import crypto from "node:crypto";
import type { TravelClass, BerthType, Gender } from "./types";
import { addDays, todayYmd } from "./format";
import { getTrain } from "./trains";
import { CLASS_INFO, berthOptionsFor, deriveBerthType } from "./rail";

export function hashPnr(pnr: string): string {
  const salt = process.env.SESSION_SECRET || "seatbadlo-dev";
  return crypto.createHash("sha256").update(`${salt}:${pnr}`).digest("hex");
}

export type PassengerTicketStatus = "CNF" | "RAC" | "WL" | "CAN" | "OTHER";

export interface PnrPassenger {
  number: number;
  name?: string;
  age?: number;
  gender?: Gender;
  status: PassengerTicketStatus;
  /** Raw status text as IRCTC shows it, e.g. "CNF B2 49" or "RAC 12" */
  statusText: string;
  coach?: string;
  seatNo?: number;
  berthType?: BerthType;
}

export interface PnrDetails {
  pnr: string;
  trainNo: string;
  trainName: string;
  journeyDate: string; // YYYY-MM-DD boarding date
  from: string;
  to: string;
  travelClass: TravelClass;
  chartPrepared: boolean;
  cancelled: boolean;
  departureTime?: string;
  passengers: PnrPassenger[];
  /** true when it came from the live PNR API (vs demo data) */
  verified: boolean;
  source: "irctc" | "demo";
}

export type PnrLookupResult =
  | { ok: true; details: PnrDetails }
  | { ok: false; reason: "not_found" | "unavailable" | "not_configured"; message: string };

/* ---------------------------------------------------------------------- */
/* Live provider: RapidAPI "IRCTC" (irctc1.p.rapidapi.com)                  */
/* ---------------------------------------------------------------------- */

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_IRCTC_HOST || "irctc1.p.rapidapi.com";
const PNR_BASE_URL = process.env.PNR_API_BASE_URL || `https://${RAPIDAPI_HOST}`;
const CACHE_TTL_MS = 10 * 60 * 1000;

export const PNR_API_CONFIGURED = !!RAPIDAPI_KEY;

interface RapidPassenger {
  Number?: number;
  CurrentStatus?: string;
  CurrentStatusNew?: string;
  CurrentCoachId?: string;
  CurrentBerthNo?: string | number;
  CurrentBerthCode?: string;
  BookingStatus?: string;
  Coach?: string;
  Berth?: number;
  PassengerName?: string;
  PassengerAge?: number;
  PassengerGender?: string;
}
interface RapidResponse {
  status?: boolean;
  message?: string;
  data?: {
    Pnr?: string;
    TrainNo?: string;
    TrainName?: string;
    Doj?: string;
    SourceDoj?: string;
    Class?: string;
    ChartPrepared?: boolean;
    TrainCancelledFlag?: boolean;
    BoardingStationName?: string;
    SourceName?: string;
    ReservationUptoName?: string;
    DestinationName?: string;
    DepartureTime?: string;
    PassengerStatus?: RapidPassenger[];
  };
}

type G = typeof globalThis & { __sbPnrCache?: Map<string, { at: number; result: PnrLookupResult }> };
const g = globalThis as G;
const cache = (g.__sbPnrCache ??= new Map());

/** "20-09-2026" -> "2026-09-20" */
function ddmmyyyyToYmd(s?: string): string | undefined {
  const m = s?.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined;
}

/** "HOWRAH RAJDHANI" -> "Howrah Rajdhani", but keeps short codes like "MTJ BME SF" as is */
function titleCase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => (w.length <= 3 && /^[A-Z]+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

function mapStatus(statusNew?: string, text?: string): PassengerTicketStatus {
  const s = (statusNew || text || "").toUpperCase();
  if (s.startsWith("CNF")) return "CNF";
  if (s.startsWith("RAC")) return "RAC";
  if (s.includes("WL")) return "WL";
  if (s.startsWith("CAN")) return "CAN";
  return "OTHER";
}

function mapBerthCode(code: string | undefined, cls: TravelClass, seatNo?: number): BerthType | undefined {
  const c = (code || "").toUpperCase();
  const allowed = berthOptionsFor(cls);
  if (allowed.includes(c as BerthType)) return c as BerthType;
  // IRCTC sitting-class codes occasionally come as WS/MS/AS already; anything else: derive
  return seatNo ? deriveBerthType(cls, seatNo) : undefined;
}

export function mapIrctcResponse(pnr: string, body: RapidResponse): PnrDetails | null {
  const d = body.data;
  if (!body.status || !d || !d.TrainNo) return null;
  const cls = (d.Class || "").toUpperCase() as TravelClass;
  const travelClass: TravelClass = cls in CLASS_INFO ? cls : "SL";
  const known = getTrain(d.TrainNo);
  const journeyDate = ddmmyyyyToYmd(d.SourceDoj) || ddmmyyyyToYmd(d.Doj) || todayYmd();
  const passengers: PnrPassenger[] = (d.PassengerStatus || []).map((p, i) => {
    const status = mapStatus(p.CurrentStatusNew, p.CurrentStatus);
    const coach = (p.CurrentCoachId || p.Coach || "").toUpperCase().replace(/\s+/g, "") || undefined;
    const seatRaw = p.CurrentBerthNo ?? p.Berth;
    const seatNo = seatRaw !== undefined && seatRaw !== null && String(seatRaw) !== "" && Number(seatRaw) > 0 ? Number(seatRaw) : undefined;
    return {
      number: p.Number ?? i + 1,
      name: p.PassengerName ? titleCase(p.PassengerName) : undefined,
      age: p.PassengerAge,
      gender: p.PassengerGender === "M" || p.PassengerGender === "F" ? p.PassengerGender : undefined,
      status,
      statusText: p.CurrentStatus || p.BookingStatus || status,
      coach: status === "CNF" ? coach : undefined,
      seatNo: status === "CNF" ? seatNo : undefined,
      berthType: status === "CNF" ? mapBerthCode(p.CurrentBerthCode, travelClass, seatNo) : undefined,
    };
  });
  return {
    pnr,
    trainNo: d.TrainNo,
    trainName: known?.name || titleCase((d.TrainName || "").replace(/\s+/g, " ")) || `Train ${d.TrainNo}`,
    journeyDate,
    from: titleCase(d.BoardingStationName || d.SourceName || ""),
    to: titleCase(d.ReservationUptoName || d.DestinationName || ""),
    travelClass,
    chartPrepared: !!d.ChartPrepared,
    cancelled: !!d.TrainCancelledFlag,
    departureTime: d.DepartureTime || undefined,
    passengers,
    verified: true,
    source: "irctc",
  };
}

async function lookupLive(pnr: string): Promise<PnrLookupResult> {
  if (!RAPIDAPI_KEY) return { ok: false, reason: "not_configured", message: "Live PNR lookup is not configured." };
  const url = `${PNR_BASE_URL}/api/v3/getPNRStatus?pnrNumber=${encodeURIComponent(pnr)}`;
  try {
    const res = await fetch(url, {
      headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": RAPIDAPI_HOST },
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (res.status === 429) return { ok: false, reason: "unavailable", message: "PNR service is busy. Try again in a minute." };
    if (!res.ok) {
      console.error("[pnr] upstream", res.status, await res.text().catch(() => ""));
      return { ok: false, reason: "unavailable", message: "PNR service is temporarily unavailable." };
    }
    const body = (await res.json()) as RapidResponse;
    const details = mapIrctcResponse(pnr, body);
    if (!details) return { ok: false, reason: "not_found", message: body.message && !body.status ? `IRCTC says: ${body.message}` : "No booking found for this PNR." };
    return { ok: true, details };
  } catch (err) {
    console.error("[pnr] lookup failed", err);
    return { ok: false, reason: "unavailable", message: "Could not reach the PNR service." };
  }
}

/* ---------------------------------------------------------------------- */
/* Demo PNRs (available while no API key is set, or in demo mode)          */
/* ---------------------------------------------------------------------- */

export const DEMO_PNRS = ["4512345678", "2231456789", "8801234567"];

function demoLookup(pnr: string): PnrDetails | null {
  const t = todayYmd();
  const base = { chartPrepared: false, cancelled: false, verified: false, source: "demo" as const };
  const demo: Record<string, Omit<PnrDetails, "pnr" | "chartPrepared" | "cancelled" | "verified" | "source">> = {
    "4512345678": {
      trainNo: "12951",
      trainName: getTrain("12951")!.name,
      journeyDate: addDays(t, 1),
      from: "Mumbai Central",
      to: "New Delhi",
      travelClass: "3A",
      departureTime: "17:00",
      passengers: [{ number: 1, age: 34, gender: "M", status: "CNF", statusText: "CNF B2 42", coach: "B2", seatNo: 42, berthType: "MB" }],
    },
    "2231456789": {
      trainNo: "22435",
      trainName: getTrain("22435")!.name,
      journeyDate: addDays(t, 1),
      from: "New Delhi",
      to: "Varanasi",
      travelClass: "CC",
      departureTime: "06:00",
      passengers: [{ number: 1, age: 29, gender: "F", status: "CNF", statusText: "CNF C4 12", coach: "C4", seatNo: 12, berthType: "MS" }],
    },
    "8801234567": {
      trainNo: "12621",
      trainName: getTrain("12621")!.name,
      journeyDate: addDays(t, 1),
      from: "Chennai Central",
      to: "New Delhi",
      travelClass: "SL",
      departureTime: "22:00",
      passengers: [
        { number: 1, age: 41, gender: "M", status: "CNF", statusText: "CNF S6 25", coach: "S6", seatNo: 25, berthType: "LB" },
        { number: 2, age: 12, gender: "F", status: "CNF", statusText: "CNF S6 27", coach: "S6", seatNo: 27, berthType: "UB" },
        { number: 3, age: 38, gender: "F", status: "RAC", statusText: "RAC 14" },
      ],
    },
  };
  const hit = demo[pnr];
  return hit ? { pnr, ...hit, ...base } : null;
}

/**
 * PNR lookup with a 10 minute in-memory cache. Order: demo PNRs (so the
 * flow can always be tried), then the live IRCTC API when configured.
 */
export async function lookupPnr(pnr: string): Promise<PnrLookupResult> {
  const demo = demoLookup(pnr);
  if (demo) return { ok: true, details: demo };
  const hit = cache.get(pnr);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.result;
  const result = await lookupLive(pnr);
  if (result.ok || result.reason === "not_found") cache.set(pnr, { at: Date.now(), result });
  return result;
}
