import { NextResponse } from "next/server";
import { handle, fail, readJson, str } from "@/lib/api";
import { getDb, mutate, newId } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken, publicUser, sessionCookieOptions } from "@/lib/auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-token";
import { isValidMobile } from "@/lib/rail";
import type { Gender, User } from "@/lib/types";

/**
 * Exchange a Firebase Phone Auth ID token for a SeatBadlo session.
 * The phone number comes from the verified token, never from the client body.
 */
export const POST = handle(async (req: Request) => {
  const body = await readJson(req);
  const idToken = str(body.idToken, 4096);
  const name = str(body.name, 60);
  const genderRaw = str(body.gender, 1);
  const gender = (["M", "F", "O"].includes(genderRaw) ? genderRaw : undefined) as Gender | undefined;
  if (!idToken) return fail("Missing token.");

  let identity;
  try {
    identity = await verifyFirebaseIdToken(idToken);
  } catch (err) {
    console.warn("[auth/firebase] token rejected:", (err as Error).message);
    return fail("Your sign-in could not be verified. Please try again.", 401);
  }
  const mobile = (identity.phoneNumber || "").replace(/^\+91/, "").replace(/\D/g, "");
  if (!isValidMobile(mobile)) return fail("Please sign in with an Indian mobile number (+91).", 400);

  const existing = (await getDb()).users.find((u) => u.mobile === mobile);
  if (!existing && !name) return NextResponse.json({ needsProfile: true });

  const user: User =
    existing ??
    (await mutate((db) => {
      const u: User = { id: newId("u_"), mobile, name, gender, createdAt: new Date().toISOString() };
      db.users.push(u);
      return u;
    }));

  const res = NextResponse.json({ ok: true, user: publicUser(user) });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions());
  return res;
});
