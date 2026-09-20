import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import type { User } from "./types";

export const SESSION_COOKIE = "sb_session";
const SESSION_DAYS = 30;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    console.warn("[auth] SESSION_SECRET is not set. Set it in production.");
  }
  return "seatbadlo-dev-secret-change-me";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const exp = Date.now() + SESSION_DAYS * 86400 * 1000;
  const payload = Buffer.from(`${userId}|${exp}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    return null;
  }
  const [userId, expStr] = Buffer.from(payload, "base64url").toString().split("|");
  if (!userId || !expStr || Number(expStr) < Date.now()) return null;
  return userId;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  };
}

/** Read the logged-in user in Server Components / Route Handlers */
export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const userId = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return (await getDb()).users.find((u) => u.id === userId) ?? null;
}

export function publicUser(u: User) {
  return { id: u.id, name: u.name, mobile: u.mobile, gender: u.gender, createdAt: u.createdAt };
}
