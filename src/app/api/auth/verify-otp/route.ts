import { NextResponse } from "next/server";
import { handle, fail, readJson, str } from "@/lib/api";
import { isValidMobile } from "@/lib/rail";
import { verifyOtp } from "@/lib/otp";
import { getDb, mutate, newId } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken, publicUser, sessionCookieOptions } from "@/lib/auth";
import type { Gender, User } from "@/lib/types";

export const POST = handle(async (req: Request) => {
  const body = await readJson(req);
  const mobile = str(body.mobile, 10).replace(/\D/g, "");
  const code = str(body.code, 6);
  const name = str(body.name, 60);
  const genderRaw = str(body.gender, 1);
  const gender = (["M", "F", "O"].includes(genderRaw) ? genderRaw : undefined) as Gender | undefined;

  if (!isValidMobile(mobile)) return fail("Enter a valid 10-digit mobile number.");
  if (!/^\d{6}$/.test(code)) return fail("Enter the 6-digit OTP.");

  const existing = (await getDb()).users.find((u) => u.mobile === mobile);
  if (!existing && !name) {
    // OTP is valid only once, so check without consuming it: we simply peek.
    const peek = (await getDb()).otps.find((o) => o.mobile === mobile);
    if (!peek || peek.code !== code) return fail("Incorrect OTP. Please check and try again.");
    return NextResponse.json({ needsProfile: true });
  }

  const v = await verifyOtp(mobile, code);
  if (!v.ok) return fail(v.error);

  let user: User;
  if (existing) {
    user = existing;
  } else {
    user = await mutate((db) => {
      const u: User = { id: newId("u_"), mobile, name, gender, createdAt: new Date().toISOString() };
      db.users.push(u);
      return u;
    });
  }

  const res = NextResponse.json({ ok: true, user: publicUser(user) });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions());
  return res;
});
