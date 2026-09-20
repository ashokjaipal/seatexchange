import { handle, fail, json, readJson, str } from "@/lib/api";
import { isValidMobile } from "@/lib/rail";
import { authMode, issueOtp } from "@/lib/otp";

export const POST = handle(async (req: Request) => {
  const mode = authMode();
  if (mode === "firebase" || mode === "msg91") return fail("Login is handled in the browser on this deployment.", 400);
  const body = await readJson(req);
  const mobile = str(body.mobile, 10).replace(/\D/g, "");
  if (!isValidMobile(mobile)) return fail("Enter a valid 10-digit Indian mobile number.");
  const r = await issueOtp(mobile);
  if (!r.ok) return fail(r.error, 429, { retryAfterSec: r.retryAfterSec });
  return json({ ok: true, demoCode: r.demoCode, retryAfterSec: r.retryAfterSec });
});
