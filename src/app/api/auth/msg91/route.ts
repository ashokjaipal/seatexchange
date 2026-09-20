import { NextResponse } from "next/server";
import { handle, fail, readJson, str } from "@/lib/api";
import { getDb, mutate, newId } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken, publicUser, sessionCookieOptions } from "@/lib/auth";
import { verifyMsg91AccessToken } from "@/lib/msg91";
import { isValidMobile } from "@/lib/rail";
import type { Gender, User } from "@/lib/types";

/**
 * Exchange an MSG91 OTP Widget access token for a SeatBadlo session.
 * The token is confirmed with MSG91 server-side; the mobile number is taken
 * from MSG91's answer and must match the number the user typed.
 */
export const POST = handle(async (req: Request) => {
  const body = await readJson(req);
  const accessToken = str(body.accessToken, 4096);
  const claimed = str(body.mobile, 10).replace(/\D/g, "");
  const name = str(body.name, 60);
  const genderRaw = str(body.gender, 1);
  const gender = (["M", "F", "O"].includes(genderRaw) ? genderRaw : undefined) as Gender | undefined;
  if (!accessToken) return fail("Missing verification token.");
  if (!isValidMobile(claimed)) return fail("Enter a valid 10-digit mobile number.");

  const v = await verifyMsg91AccessToken(accessToken);
  if (!v.ok) {
    console.warn("[auth/msg91] token rejected:", v.error);
    return fail(v.error?.includes("not configured") ? v.error : "Your OTP could not be verified. Please try again.", 401);
  }
  let mobile = v.mobile;
  if (!mobile) {
    if (process.env.MSG91_TRUST_CLIENT_MOBILE === "true") {
      mobile = claimed;
    } else {
      console.error("[auth/msg91] MSG91 response carried no mobile number; keys:", Object.keys((v.raw as object) ?? {}));
      return fail("Could not confirm your mobile number with the OTP service.", 502);
    }
  }
  if (mobile !== claimed) return fail("The verified number does not match the one you entered.", 400);

  const existing = (await getDb()).users.find((u) => u.mobile === mobile);
  if (!existing && !name) return NextResponse.json({ needsProfile: true });

  const user: User =
    existing ??
    (await mutate((db) => {
      const u: User = { id: newId("u_"), mobile: mobile!, name, gender, createdAt: new Date().toISOString() };
      db.users.push(u);
      return u;
    }));

  const res = NextResponse.json({ ok: true, user: publicUser(user) });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions());
  return res;
});
