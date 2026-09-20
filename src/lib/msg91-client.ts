"use client";

import { MSG91_WIDGET_SCRIPT } from "./msg91";

/** Typed surface of the MSG91 OTP Widget when exposeMethods is true. */
type Cb = (data: unknown) => void;
declare global {
  interface Window {
    initSendOTP?: (config: Record<string, unknown>) => void;
    sendOtp?: (identifier: string, success?: Cb, failure?: Cb) => void;
    retryOtp?: (channel: string | null, success?: Cb, failure?: Cb, reqId?: string) => void;
    verifyOtp?: (otp: string | number, success?: Cb, failure?: Cb, reqId?: string) => void;
  }
}

let loading: Promise<void> | null = null;

export function loadMsg91Widget(widgetId: string, tokenAuth: string, captchaRenderId: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("browser only"));
  if (window.sendOtp && window.verifyOtp) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const configuration = {
      widgetId,
      tokenAuth,
      exposeMethods: true,
      captchaRenderId,
      success: () => {},
      failure: () => {},
    };
    const script = document.createElement("script");
    script.src = MSG91_WIDGET_SCRIPT;
    script.async = true;
    script.onload = () => {
      try {
        window.initSendOTP?.(configuration);
        // methods are attached synchronously by initSendOTP; poll briefly in case the widget defers
        let tries = 0;
        const tick = () => {
          if (window.sendOtp && window.verifyOtp) return resolve();
          if (++tries > 50) return reject(new Error("OTP widget did not initialise"));
          setTimeout(tick, 100);
        };
        tick();
      } catch (e) {
        reject(e);
      }
    };
    script.onerror = () => {
      loading = null;
      reject(new Error("Could not load the OTP service. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function msg91Message(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  const e = err as { message?: unknown; msg?: unknown; error?: unknown; code?: unknown };
  const m = e.message ?? e.msg ?? e.error;
  if (typeof m === "string" && m.trim()) return prettify(m);
  if (m && typeof m === "object") {
    const inner = (m as { message?: unknown }).message;
    if (typeof inner === "string") return prettify(inner);
  }
  return fallback;
}

function prettify(m: string): string {
  const s = m.trim();
  const lower = s.toLowerCase();
  if (lower.includes("invalid otp") || lower.includes("otp not match") || lower.includes("wrong otp")) return "Incorrect OTP. Please check and try again.";
  if (lower.includes("expired")) return "OTP expired. Request a new one.";
  if (lower.includes("already verified")) return "This OTP was already used. Request a new one.";
  if (lower.includes("limit") || lower.includes("too many")) return "Too many attempts. Please try again after some time.";
  if (lower.includes("captcha")) return "Please complete the captcha and try again.";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Pull the access token out of verifyOtp's success payload (shape varies: string, {message}, {token}) */
export function msg91AccessToken(data: unknown): string | undefined {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    for (const k of ["message", "token", "accessToken", "access-token", "data"]) {
      const v = d[k];
      if (typeof v === "string" && v.length > 10) return v;
      if (v && typeof v === "object") {
        const t = msg91AccessToken(v);
        if (t) return t;
      }
    }
  }
  return undefined;
}

export function msg91RequestId(data: unknown): string | undefined {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    for (const k of ["reqId", "requestId", "request_id"]) if (typeof d[k] === "string") return d[k] as string;
    if (d.message && typeof d.message === "object") return msg91RequestId(d.message);
  }
  return undefined;
}
