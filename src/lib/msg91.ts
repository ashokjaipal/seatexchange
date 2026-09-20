/**
 * MSG91 OTP Widget (https://verify.msg91.com). The widget sends and verifies
 * the OTP in the browser; the server then confirms the resulting access token
 * with MSG91 before trusting the mobile number.
 *
 * Client (public) config: NEXT_PUBLIC_MSG91_WIDGET_ID, NEXT_PUBLIC_MSG91_TOKEN_AUTH
 * Server secret:          MSG91_AUTH_KEY (MSG91 dashboard -> Authkey)
 */
export const MSG91_WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || "366974674b4b343031343038";
export const MSG91_TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || "573164TMVdCX320G6aaf8d4dP1";
export const MSG91_WIDGET_SCRIPT = "https://verify.msg91.com/otp-provider.js";
export const hasMsg91Widget = !!(MSG91_WIDGET_ID && MSG91_TOKEN_AUTH);

export interface Msg91VerifyResult {
  ok: boolean;
  /** 10-digit Indian mobile confirmed by MSG91, when the response carries it */
  mobile?: string;
  error?: string;
  raw?: unknown;
}

/**
 * Server side: confirm an access token issued by the widget's verifyOtp.
 * MSG91: POST /api/v5/widget/verifyAccessToken { authkey, "access-token" }
 */
export async function verifyMsg91AccessToken(accessToken: string): Promise<Msg91VerifyResult> {
  const authkey = process.env.MSG91_AUTH_KEY;
  if (!authkey) return { ok: false, error: "MSG91_AUTH_KEY is not configured on the server." };
  const base = (process.env.MSG91_API_BASE_URL || "https://control.msg91.com").replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/v5/widget/verifyAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ authkey, "access-token": accessToken }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    const body = (await res.json().catch(() => ({}))) as { type?: string; message?: unknown; code?: string | number };
    if (!res.ok || body.type !== "success") {
      const msg = typeof body.message === "string" ? body.message : "Verification failed.";
      return { ok: false, error: msg, raw: body };
    }
    return { ok: true, mobile: extractMobile(body), raw: body };
  } catch (err) {
    console.error("[msg91] verifyAccessToken failed:", err);
    return { ok: false, error: "Could not reach the OTP service." };
  }
}

/** Find an Indian mobile number anywhere in MSG91's response (field names vary by widget version). */
export function extractMobile(value: unknown, depth = 0): string | undefined {
  if (depth > 5 || value === null || value === undefined) return undefined;
  if (typeof value === "string" || typeof value === "number") {
    const digits = String(value).replace(/\D/g, "");
    const m = /(?:^|91)([6-9]\d{9})$/.exec(digits);
    return m && digits.length <= 12 ? m[1] : undefined;
  }
  if (Array.isArray(value)) {
    for (const v of value) {
      const m = extractMobile(v, depth + 1);
      if (m) return m;
    }
    return undefined;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const preferred = ["mobile", "identifier", "phone", "phoneNumber", "mobileNumber", "number", "msisdn"];
    for (const k of preferred) if (k in obj) {
      const m = extractMobile(obj[k], depth + 1);
      if (m) return m;
    }
    for (const [k, v] of Object.entries(obj)) if (!preferred.includes(k)) {
      const m = extractMobile(v, depth + 1);
      if (m) return m;
    }
  }
  return undefined;
}
