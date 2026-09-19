"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Save } from "lucide-react";
import type { Gender } from "@/lib/types";
import { useToast } from "./Toast";

export function ProfileForm({ user }: { user: { name: string; mobile: string; gender?: Gender } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(user.name);
  const [gender, setGender] = useState<Gender | "">(user.gender ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, gender: gender || undefined }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast("Profile saved.", "success");
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="card p-6">
      <label className="label" htmlFor="name">
        Name
      </label>
      <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
      <p className="hint">Co-passengers see your first name only.</p>

      <p className="label mt-5">Mobile</p>
      <p className="input bg-slate-50 text-slate-600">+91 {user.mobile}</p>
      <p className="hint">Shared only after a swap is accepted by both sides.</p>

      <p className="label mt-5">Gender</p>
      <div className="flex gap-2">
        {(["F", "M", "O"] as const).map((g) => (
          <button key={g} type="button" className={`chip ${gender === g ? "chip-on" : ""}`} onClick={() => setGender(gender === g ? "" : g)}>
            {g === "F" ? "Woman" : g === "M" ? "Man" : "Other"}
          </button>
        ))}
      </div>
      <p className="hint">Women can choose to swap only with women passengers.</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="btn-ghost text-red-600 hover:bg-red-50" onClick={logout}>
          <LogOut className="h-4 w-4" /> Log out
        </button>
        <button type="button" className="btn-primary" onClick={save} disabled={busy || name.trim().length < 2}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
      </div>
    </div>
  );
}
