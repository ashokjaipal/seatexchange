"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Phone, ShieldCheck, Smartphone } from "lucide-react";
import { useToast } from "./Toast";

type Step = "mobile" | "otp" | "profile";

export function LoginForm({ next, demo }: { next: string; demo: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "O" | "">("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [demoCode, setDemoCode] = useState<string | undefined>();
  const [cooldown, setCooldown] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "otp") otpRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async () => {
    setErr("");
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setErr("Enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mobile }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDemoCode(d.demoCode);
      setStep("otp");
      setCooldown(30);
    } catch (e) {
      setErr((e as Error).message || "Could not send OTP.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (withProfile = false) => {
    setErr("");
    if (!/^\d{6}$/.test(code)) {
      setErr("Enter the 6-digit OTP.");
      return;
    }
    if (withProfile && name.trim().length < 2) {
      setErr("Please tell us your name (as on your ticket is ideal).");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, code, name: withProfile ? name.trim() : undefined, gender: withProfile ? gender || undefined : undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.needsProfile) {
        setStep("profile");
        return;
      }
      toast(`Welcome${d.user?.name ? ", " + d.user.name.split(" ")[0] : ""}!`, "success");
      router.push(next);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message || "Could not verify OTP.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      {step === "mobile" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendOtp();
          }}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Smartphone className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Log in with your mobile</h1>
          <p className="mt-1 text-sm text-muted">We&apos;ll send a one-time password. No passwords to remember.</p>
          <label className="label mt-6" htmlFor="mobile">
            Mobile number
          </label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-xl border border-r-0 border-line bg-slate-50 px-3 text-sm font-semibold text-slate-600">+91</span>
            <input
              id="mobile"
              className={`input rounded-l-none ${err ? "input-error" : ""}`}
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              value={mobile}
              maxLength={10}
              autoFocus
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          </div>
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          <button className="btn-primary mt-5 w-full btn-lg" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Send OTP
          </button>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            Your number is shared only with a co-passenger after you both agree to a swap.
          </p>
          {demo && (
            <p className="mt-3 rounded-lg bg-saffron-50 px-3 py-2 text-xs text-saffron-700">
              Demo mode: any valid number works and the OTP is <span className="kbd">123456</span>. Try <span className="kbd">9000000001</span> (Priya) or{" "}
              <span className="kbd">9000000002</span> (Rahul) to see existing requests.
            </p>
          )}
        </form>
      )}

      {step === "otp" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Phone className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Enter the OTP</h1>
          <p className="mt-1 text-sm text-muted">
            Sent to +91 {mobile}.{" "}
            <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={() => { setStep("mobile"); setCode(""); setErr(""); }}>
              Change
            </button>
          </p>
          <label className="label mt-6" htmlFor="otp">
            6-digit OTP
          </label>
          <input
            id="otp"
            ref={otpRef}
            className={`input text-center font-mono text-2xl tracking-[0.5em] ${err ? "input-error" : ""}`}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••••"
            value={code}
            maxLength={6}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          {demoCode && (
            <p className="mt-2 rounded-lg bg-saffron-50 px-3 py-2 text-xs text-saffron-700">
              Demo mode: your OTP is <span className="kbd">{demoCode}</span>
            </p>
          )}
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          <button className="btn-primary mt-5 w-full btn-lg" disabled={busy || code.length !== 6}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Verify & continue
          </button>
          <button type="button" className="btn-ghost mt-2 w-full" disabled={cooldown > 0 || busy} onClick={sendOtp}>
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
          </button>
        </form>
      )}

      {step === "profile" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify(true);
          }}
        >
          <h1 className="text-2xl font-extrabold tracking-tight">Nice to meet you!</h1>
          <p className="mt-1 text-sm text-muted">Co-passengers will see your first name only.</p>
          <label className="label mt-6" htmlFor="name">
            Your name
          </label>
          <input id="name" className="input" placeholder="e.g. Priya Sharma" value={name} autoFocus autoComplete="name" onChange={(e) => setName(e.target.value)} />
          <p className="label mt-5">Gender <span className="font-normal text-muted">(optional, enables women-only swaps)</span></p>
          <div className="flex gap-2">
            {(["F", "M", "O"] as const).map((g) => (
              <button key={g} type="button" className={`chip ${gender === g ? "chip-on" : ""}`} onClick={() => setGender(gender === g ? "" : g)}>
                {g === "F" ? "Woman" : g === "M" ? "Man" : "Other"}
              </button>
            ))}
          </div>
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          <button className="btn-primary mt-6 w-full btn-lg" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Create my account
          </button>
        </form>
      )}
    </div>
  );
}
