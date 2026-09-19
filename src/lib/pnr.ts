import crypto from "node:crypto";
import type { TravelClass, BerthType } from "./types";
import { addDays, todayYmd } from "./format";
import { getTrain } from "./trains";

export function hashPnr(pnr: string): string {
  const salt = process.env.SESSION_SECRET || "seatbadlo-dev";
  return crypto.createHash("sha256").update(`${salt}:${pnr}`).digest("hex");
}

export interface PnrDetails {
  pnr: string;
  trainNo: string;
  trainName: string;
  journeyDate: string;
  from: string;
  to: string;
  travelClass: TravelClass;
  passengers: { name: string; age?: number; gender?: "M" | "F" | "O"; coach: string; seatNo: number; berthType?: BerthType }[];
}

/**
 * PNR auto-fill. Real PNR status requires an official/partner rail API
 * (the IRCTC/NTES data is not openly licensed). Until that is wired in,
 * a handful of demo PNRs auto-fill so the flow can be experienced end to end;
 * every other PNR falls back to manual entry from the ticket.
 */
export async function lookupPnr(pnr: string): Promise<PnrDetails | null> {
  const t = todayYmd();
  const demo: Record<string, Omit<PnrDetails, "pnr">> = {
    "4512345678": {
      trainNo: "12951",
      trainName: getTrain("12951")!.name,
      journeyDate: addDays(t, 1),
      from: "Mumbai Central",
      to: "New Delhi",
      travelClass: "3A",
      passengers: [{ name: "Passenger 1", age: 34, gender: "M", coach: "B2", seatNo: 42, berthType: "MB" }],
    },
    "2231456789": {
      trainNo: "22435",
      trainName: getTrain("22435")!.name,
      journeyDate: addDays(t, 1),
      from: "New Delhi",
      to: "Varanasi",
      travelClass: "CC",
      passengers: [{ name: "Passenger 1", age: 29, gender: "F", coach: "C4", seatNo: 12, berthType: "MS" }],
    },
    "8801234567": {
      trainNo: "12621",
      trainName: getTrain("12621")!.name,
      journeyDate: addDays(t, 1),
      from: "Chennai Central",
      to: "New Delhi",
      travelClass: "SL",
      passengers: [
        { name: "Passenger 1", age: 41, gender: "M", coach: "S6", seatNo: 25, berthType: "LB" },
        { name: "Passenger 2", age: 12, gender: "F", coach: "S6", seatNo: 27, berthType: "UB" },
      ],
    },
  };
  const hit = demo[pnr];
  return hit ? { pnr, ...hit } : null;
}

export const DEMO_PNRS = ["4512345678", "2231456789", "8801234567"];
