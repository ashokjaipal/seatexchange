import { handle, fail, json, readJson, str } from "@/lib/api";
import { isValidMobile } from "@/lib/rail";
import { issueOtp } from "@/lib/otp";

export const POST = handle(async (req: Request) => {
  const body = await readJson(req);
  const mobile = str(body.mobile, 10).replace(/\D/g, "");
  if (!isValidMobile(mobile)) return fail("Enter a valid 10-digit Indian mobile number.");
  const { demoCode } = await issueOtp(mobile);
  return json({ ok: true, demoCode });
});
