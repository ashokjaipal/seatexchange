"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Check, Loader2, LogIn, PlusCircle, Send } from "lucide-react";
import type { PublicListing } from "@/lib/types";
import type { MatchResult } from "@/lib/matching";
import { BERTH_INFO } from "@/lib/rail";
import { scoreMatch } from "@/lib/matching";
import { ListingMini } from "./ListingCard";
import { MatchBadge } from "./Badges";
import { useToast } from "./Toast";

interface Props {
  target: PublicListing;
  myListings: PublicListing[];
  loggedIn: boolean;
  existingRequestId?: string;
  match: (MatchResult & { myListingId: string }) | null;
}

export function ProposeSwap({ target, myListings, loggedIn, existingRequestId, match }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const eligible = myListings.filter((m) => m.travelClass === target.travelClass);
  const [pick, setPick] = useState<string>(match?.myListingId ?? eligible[0]?.id ?? "");
  const [msg, setMsg] = useState(`Hi ${target.passenger.firstName}! I'd be happy to swap my seat with yours. Does that work for you?`);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(!!existingRequestId);

  const listHref = `/list?train=${target.trainNo}&date=${target.journeyDate}`;

  if (!loggedIn) {
    return (
      <Panel title="Propose a swap">
        <p className="text-sm text-slate-600">Log in with your mobile number to offer your seat to {target.passenger.firstName}.</p>
        <Link href={`/login?next=${encodeURIComponent(`/listing/${target.id}`)}`} className="btn-primary mt-4 w-full">
          <LogIn className="h-4 w-4" /> Log in to continue
        </Link>
      </Panel>
    );
  }

  if (sent) {
    return (
      <Panel title="Request sent">
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {target.passenger.firstName} has been notified. You&apos;ll get their number as soon as they accept.
          </p>
        </div>
        <Link href="/requests" className="btn-secondary mt-4 w-full">
          Track in Requests
        </Link>
      </Panel>
    );
  }

  if (eligible.length === 0) {
    return (
      <Panel title="Propose a swap">
        <p className="text-sm text-slate-600">
          {myListings.length
            ? `Swaps only work within the same class. Add your ${target.travelClass} seat on this train to propose.`
            : "First, add your seat on this train. It takes a minute, and then you can propose a swap with one tap."}
        </p>
        <Link href={listHref} className="btn-primary mt-4 w-full">
          <PlusCircle className="h-4 w-4" /> Add my seat on {target.trainNo}
        </Link>
      </Panel>
    );
  }

  const send = async () => {
    setErr("");
    if (!pick) return setErr("Pick which seat to offer.");
    setBusy(true);
    try {
      const r = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toListingId: target.id, fromListingId: pick, message: msg.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setSent(true);
      toast("Swap request sent!", "success");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Propose a swap">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Offer your seat</p>
      <div className="mt-2 space-y-2">
        {eligible.map((m) => {
          const on = pick === m.id;
          const sm = scoreMatchPublic(m, target);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setPick(m.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition ${on ? "border-brand-600 bg-brand-50 ring-2 ring-brand-200" : "border-line hover:border-brand-300"}`}
            >
              <ListingMini listing={m} />
              <div className="flex flex-col items-end gap-1">
                {sm && <MatchBadge label={sm.label} />}
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${on ? "border-brand-600 bg-brand-600 text-white" : "border-line"}`}>{on && <Check className="h-3 w-3" />}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="my-4 flex items-center gap-2 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        <ArrowLeftRight className="h-3.5 w-3.5" /> for their {BERTH_INFO[target.berthType].label.toLowerCase()} {target.coach}-{target.seatNo}
        <span className="h-px flex-1 bg-line" />
      </div>

      <label className="label" htmlFor="msg">
        Message
      </label>
      <textarea id="msg" className="input min-h-20 resize-y text-sm" maxLength={280} value={msg} onChange={(e) => setMsg(e.target.value)} />
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      <button type="button" className="btn-accent mt-4 w-full" onClick={send} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send swap request
      </button>
      <p className="hint text-center">They&apos;ll see your first name and seat. Your number is shared only if they accept.</p>
    </Panel>
  );
}

function scoreMatchPublic(mine: PublicListing, theirs: PublicListing) {
  // PublicListing is a superset of what scoreMatch needs, apart from pnrHash/passenger.name
  const toL = (p: PublicListing) => ({ ...p, pnrHash: "", passenger: { name: p.passenger.firstName, age: p.passenger.age, gender: p.passenger.gender } });
  return scoreMatch(toL(mine), toL(theirs));
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}
