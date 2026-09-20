"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Check, Inbox, Loader2, MessageCircle, Phone, Send, X, CheckCheck, Info } from "lucide-react";
import type { PublicRequest } from "@/lib/listings";
import { formatDate, timeAgo } from "@/lib/format";
import { ListingMini } from "./ListingCard";
import { StatusBadge } from "./Badges";
import { EmptyState } from "./EmptyState";
import { useToast } from "./Toast";
import { track } from "@/lib/firebase";

export function RequestsView({ requests, initialTab }: { requests: PublicRequest[]; initialTab?: "received" | "sent" }) {
  const received = requests.filter((r) => r.direction === "received");
  const sent = requests.filter((r) => r.direction === "sent");
  const [tab, setTab] = useState<"received" | "sent">(initialTab ?? (received.length || !sent.length ? "received" : "sent"));
  const list = tab === "received" ? received : sent;
  const pendingReceived = received.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        <TabBtn on={tab === "received"} onClick={() => setTab("received")} label="Received" count={pendingReceived} />
        <TabBtn on={tab === "sent"} onClick={() => setTab("sent")} label="Sent" />
      </div>
      <div className="mt-5 space-y-4">
        {list.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-7 w-7" />}
            title={tab === "received" ? "No requests received yet" : "You haven't proposed any swaps"}
            body={tab === "received" ? "When a co-passenger proposes a swap for one of your seats, it shows up here." : "Find your train, pick a seat you like and propose a swap."}
            action={
              <Link href={tab === "received" ? "/my-seats" : "/"} className="btn-primary">
                {tab === "received" ? "My seats" : "Find my train"}
              </Link>
            }
          />
        ) : (
          list.map((r) => <RequestCard key={r.id} r={r} />)
        )}
      </div>
    </div>
  );
}

function TabBtn({ on, onClick, label, count }: { on: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button type="button" onClick={onClick} className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${on ? "bg-white text-ink shadow-card" : "text-slate-500 hover:text-ink"}`}>
      {label}
      {count ? <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron-500 px-1.5 text-[11px] font-bold text-white">{count}</span> : null}
    </button>
  );
}

function RequestCard({ r }: { r: PublicRequest }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState("");

  const act = async (action: "accept" | "decline" | "cancel" | "complete") => {
    if (action === "decline" && !window.confirm("Decline this request?")) return;
    if (action === "cancel" && !window.confirm("Cancel your request?")) return;
    setBusy(action);
    try {
      const res = await fetch(`/api/requests/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      track(`swap_${action}`, { train_no: r.mine.trainNo, travel_class: r.mine.travelClass });
      toast(
        action === "accept" ? "Swap accepted! Contact details unlocked." : action === "complete" ? "Marked as done. Happy journey!" : action === "decline" ? "Request declined." : "Request cancelled.",
        action === "accept" || action === "complete" ? "success" : "info",
      );
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy("");
    }
  };

  const other = r.theirs.passenger.firstName;
  const wa = r.contact
    ? `https://wa.me/91${r.contact.mobile}?text=${encodeURIComponent(
        `Hi ${r.contact.name.split(" ")[0]}, about our SeatBadlo swap on train ${r.mine.trainNo} (${formatDate(r.mine.journeyDate)}): my ${r.mine.coach}-${r.mine.seatNo} for your ${r.theirs.coach}${r.theirs.seatNo ? "-" + r.theirs.seatNo : ""}. See you on board!`,
      )}`
    : "";

  return (
    <div className={`card overflow-hidden ${r.status === "pending" && r.direction === "received" ? "ring-2 ring-saffron-300" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-canvas px-4 py-2.5 text-sm">
        <span className="font-bold">
          <span className="font-mono">{r.mine.trainNo}</span> · {r.mine.trainName}
        </span>
        <span className="text-muted">· {formatDate(r.mine.journeyDate)}</span>
        <span className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
          <StatusBadge status={r.status} />
        </span>
      </div>

      <div className="p-4">
        <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-xl border border-line p-3">
            <ListingMini listing={r.mine} label="Your seat" />
          </div>
          <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <ArrowLeftRight className="h-4 w-4" />
          </span>
          <Link href={`/listing/${r.theirs.id}`} className="rounded-xl border border-line p-3 transition hover:border-brand-300">
            <ListingMini listing={r.theirs} label={`${other}'s seat`} />
          </Link>
        </div>

        {r.message && (
          <p className="mt-3 flex gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>
              <span className="font-semibold">{r.direction === "received" ? other : "You"}:</span> {r.message}
            </span>
          </p>
        )}

        {(r.status === "accepted" || r.status === "completed") && r.contact && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 font-bold text-emerald-900">
              <CheckCheck className="h-4 w-4" /> Swap agreed with {r.contact.name}
            </p>
            <p className="mt-1 text-sm text-emerald-900/80">
              Say hello, confirm the plan, and meet at the seat after boarding. Let the TTE know you&apos;ve exchanged.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:bg-[#1ebe5b]">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <a href={`tel:+91${r.contact.mobile}`} className="btn-secondary">
                <Phone className="h-4 w-4" /> +91 {r.contact.mobile}
              </a>
              {r.status === "accepted" && (
                <button type="button" className="btn-primary ml-auto" onClick={() => act("complete")} disabled={!!busy}>
                  {busy === "complete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} We swapped
                </button>
              )}
            </div>
          </div>
        )}

        {r.status === "pending" && r.direction === "received" && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <p className="mr-auto flex items-center gap-1.5 text-sm text-slate-600">
              <Info className="h-4 w-4 text-brand-500" /> Accepting shares your name and number with {other}.
            </p>
            <button type="button" className="btn-secondary" onClick={() => act("decline")} disabled={!!busy}>
              {busy === "decline" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Decline
            </button>
            <button type="button" className="btn-primary" onClick={() => act("accept")} disabled={!!busy}>
              {busy === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Accept swap
            </button>
          </div>
        )}

        {r.status === "pending" && r.direction === "sent" && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <p className="mr-auto flex items-center gap-1.5 text-sm text-slate-600">
              <Send className="h-4 w-4 text-brand-500" /> Waiting for {other} to respond.
            </p>
            <button type="button" className="btn-ghost" onClick={() => act("cancel")} disabled={!!busy}>
              {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Cancel request
            </button>
          </div>
        )}

        {r.status === "declined" && r.direction === "sent" && (
          <p className="mt-4 text-sm text-slate-600">
            {other} declined this one. New seats get listed daily:{" "}
            <Link href={`/train/${r.mine.trainNo}?date=${r.mine.journeyDate}`} className="font-semibold text-brand-700 hover:underline">
              check the board
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
