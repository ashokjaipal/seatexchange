import crypto from "node:crypto";
import { mutate, getDb } from "./db";

/**
 * Mobile OTP login.
 *
 * Providers are selected with SMS_PROVIDER:
 *   msg91    MSG91 OTP API        -> MSG91_AUTH_KEY, MSG91_TEMPLATE_ID
 *   twilio   Twilio Messages API  -> TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
 *   webhook  Any HTTP endpoint    -> SMS_WEBHOOK_URL (POST JSON {mobile, message, otp}), optional SMS_WEBHOOK_TOKEN
 *
 * With no provider configured the app runs in demo mode: the OTP is fixed to
 * 123456 and shown on screen. Set NEXT_PUBLIC_DEMO_MODE=true to force demo
 * mode even when a provider is configured (useful on staging).
 */
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_SENDS_PER_HOUR = 5;
const APP_NAME = "SeatBadlo";

export type SmsProvider = "msg91" | "twilio" | "webhook" | "none";

export function smsProvider(): SmsProvider {
  const p = (process.env.SMS_PROVIDER || "").toLowerCase();
  if (p === "msg91" && process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) return "msg91";
  if (p === "twilio" && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) return "twilio";
  if (p === "webhook" && process.env.SMS_WEBHOOK_URL) return "webhook";
  if (p && p !== "none") console.warn(`[otp] SMS_PROVIDER=${p} is set but its credentials are missing; falling back to demo mode.`);
  return "none";
}

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || smsProvider() === "none";
export const DEMO_OTP = "123456";

function hashCode(mobile: string, code: string): string {
  const salt = process.env.SESSION_SECRET || "seatbadlo-dev";
  return crypto.createHash("sha256").update(`${salt}:${mobile}:${code}`).digest("hex");
}

async function sendSms(mobile: string, code: string): Promise<void> {
  const message = `${code} is your ${APP_NAME} OTP. Valid for 10 minutes. Do not share it with anyone.`;
  const provider = smsProvider();
  switch (provider) {
    case "msg91": {
      const url = new URL("https://control.msg91.com/api/v5/otp");
      url.searchParams.set("template_id", process.env.MSG91_TEMPLATE_ID!);
      url.searchParams.set("mobile", `91${mobile}`);
      url.searchParams.set("otp", code);
      url.searchParams.set("otp_expiry", "10");
      const res = await fetch(url, { method: "POST", headers: { authkey: process.env.MSG91_AUTH_KEY!, "Content-Type": "application/json" }, body: "{}" });
      const body = (await res.json().catch(() => ({}))) as { type?: string; message?: string };
      if (!res.ok || body.type === "error") throw new Error(`MSG91: ${body.message || res.status}`);
      return;
    }
    case "twilio": {
      const sid = process.env.TWILIO_ACCOUNT_SID!;
      const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
      const form = new URLSearchParams({ To: `+91${mobile}`, From: process.env.TWILIO_FROM!, Body: message });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });
      if (!res.ok) throw new Error(`Twilio: ${res.status} ${(await res.text()).slice(0, 200)}`);
      return;
    }
    case "webhook": {
      const res = await fetch(process.env.SMS_WEBHOOK_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(process.env.SMS_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN}` } : {}) },
        body: JSON.stringify({ mobile: `91${mobile}`, message, otp: code }),
      });
      if (!res.ok) throw new Error(`SMS webhook: ${res.status}`);
      return;
    }
    case "none":
      return; // demo mode, nothing to send
  }
}

export type IssueResult = { ok: true; demoCode?: string; retryAfterSec?: number } | { ok: false; error: string; retryAfterSec?: number };

export async function issueOtp(mobile: string): Promise<IssueResult> {
  const now = Date.now();
  const db = await getDb();
  const existing = db.otps.find((o) => o.mobile === mobile);
  const recentSends = (existing?.sends ?? []).map((s) => new Date(s).getTime()).filter((t) => now - t < 3600 * 1000);
  const last = recentSends.length ? Math.max(...recentSends) : 0;
  if (last && now - last < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (now - last)) / 1000);
    return { ok: false, error: `Please wait ${wait}s before requesting another OTP.`, retryAfterSec: wait };
  }
  if (recentSends.length >= MAX_SENDS_PER_HOUR) {
    return { ok: false, error: "Too many OTP requests. Please try again after an hour." };
  }

  const code = DEMO_MODE ? DEMO_OTP : String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  try {
    await sendSms(mobile, code);
  } catch (err) {
    console.error("[otp] send failed:", err);
    return { ok: false, error: "We couldn't send the SMS right now. Please try again in a moment." };
  }
  await mutate((d) => {
    d.otps = d.otps.filter((o) => o.mobile !== mobile && new Date(o.expiresAt).getTime() > now - 3600 * 1000);
    d.otps.push({
      mobile,
      codeHash: hashCode(mobile, code),
      expiresAt: new Date(now + OTP_TTL_MS).toISOString(),
      attempts: 0,
      sends: [...recentSends.map((t) => new Date(t).toISOString()), new Date(now).toISOString()],
    });
  });
  return DEMO_MODE ? { ok: true, demoCode: code, retryAfterSec: RESEND_COOLDOWN_MS / 1000 } : { ok: true, retryAfterSec: RESEND_COOLDOWN_MS / 1000 };
}

export type VerifyResult = { ok: true } | { ok: false; error: string };

/** Check the code without consuming it (used to gate profile creation). */
export async function peekOtp(mobile: string, code: string): Promise<VerifyResult> {
  const entry = (await getDb()).otps.find((o) => o.mobile === mobile);
  if (!entry) return { ok: false, error: "Please request a new OTP." };
  if (new Date(entry.expiresAt).getTime() < Date.now()) return { ok: false, error: "OTP expired. Request a new one." };
  if (entry.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Too many attempts. Request a new OTP." };
  const ok = crypto.timingSafeEqual(Buffer.from(entry.codeHash), Buffer.from(hashCode(mobile, code)));
  if (!ok) {
    await mutate(() => {
      entry.attempts += 1;
    });
    return { ok: false, error: "Incorrect OTP. Please check and try again." };
  }
  return { ok: true };
}

/** Verify and consume the code. */
export async function verifyOtp(mobile: string, code: string): Promise<VerifyResult> {
  const r = await peekOtp(mobile, code);
  if (!r.ok) return r;
  await mutate((db) => {
    db.otps = db.otps.filter((o) => o.mobile !== mobile);
  });
  return { ok: true };
}
