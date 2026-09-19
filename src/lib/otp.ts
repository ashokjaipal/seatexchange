import crypto from "node:crypto";
import { mutate, getDb } from "./db";

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * SMS delivery hook. Wire your provider here (MSG91, Twilio, Kaleyra, etc.).
 * In demo mode nothing is sent and the OTP is fixed to 123456.
 */
async function sendSms(mobile: string, code: string): Promise<void> {
  if (DEMO_MODE) return;
  // TODO: replace with a real provider call.
  console.log(`[otp] SMS to +91${mobile}: Your SeatBadlo OTP is ${code}. Valid for 10 minutes.`);
}

export async function issueOtp(mobile: string): Promise<{ demoCode?: string }> {
  const code = DEMO_MODE ? "123456" : String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  mutate((db) => {
    db.otps = db.otps.filter((o) => o.mobile !== mobile && new Date(o.expiresAt).getTime() > Date.now());
    db.otps.push({ mobile, code, expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(), attempts: 0 });
  });
  await sendSms(mobile, code);
  return DEMO_MODE ? { demoCode: code } : {};
}

export function verifyOtp(mobile: string, code: string): { ok: true } | { ok: false; error: string } {
  const entry = getDb().otps.find((o) => o.mobile === mobile);
  if (!entry) return { ok: false, error: "Please request a new OTP." };
  if (new Date(entry.expiresAt).getTime() < Date.now()) return { ok: false, error: "OTP expired. Request a new one." };
  if (entry.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Too many attempts. Request a new OTP." };
  if (entry.code !== code.trim()) {
    mutate(() => {
      entry.attempts += 1;
    });
    return { ok: false, error: "Incorrect OTP. Please check and try again." };
  }
  mutate((db) => {
    db.otps = db.otps.filter((o) => o.mobile !== mobile);
  });
  return { ok: true };
}
