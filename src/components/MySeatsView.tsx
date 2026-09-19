import Link from "next/link";
import { Armchair, ArrowRight, Inbox, PlusCircle, Sparkles } from "lucide-react";
import type { PublicListing } from "@/lib/types";
import { formatDate, relativeDay, timeAgo } from "@/lib/format";
import { BerthDiagram } from "./BerthDiagram";
import { BerthBadge, ClassBadge, StatusBadge } from "./Badges";
import { ManageListing } from "./ManageListing";
import { EmptyState } from "./EmptyState";
import { wantsSummary } from "./ListingCard";

export interface MySeat extends PublicListing {
  pendingReceived: number;
  matchCount: number;
}

export function MySeatsView({ upcoming, past }: { upcoming: MySeat[]; past: MySeat[] }) {
  return (
    <div className="space-y-8">
      <section>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={<Armchair className="h-7 w-7" />}
            title="No seats listed yet"
            body="List your seat from your ticket and we'll find co-passengers who want to swap."
            action={
              <Link href="/list" className="btn-primary">
                <PlusCircle className="h-4 w-4" /> List my seat
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((l) => (
              <SeatCard key={l.id} l={l} />
            ))}
          </div>
        )}
      </section>
      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Past & closed</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {past.map((l) => (
              <SeatCard key={l.id} l={l} muted />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SeatCard({ l, muted = false }: { l: MySeat; muted?: boolean }) {
  const rel = relativeDay(l.journeyDate);
  const boardHref = `/train/${l.trainNo}?date=${l.journeyDate}`;
  return (
    <div className={`card flex flex-col p-4 ${muted ? "opacity-75" : ""}`}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-bold">
          <span className="font-mono">{l.trainNo}</span> · {l.trainName}
        </span>
        <StatusBadge status={l.status} />
      </div>
      <p className="mt-0.5 text-sm text-brand-700">
        <span className="font-semibold">{formatDate(l.journeyDate)}</span> {rel && <span className="badge tone-saffron ml-1">{rel}</span>}
      </p>

      <div className="mt-3 flex items-center gap-3">
        <BerthDiagram cls={l.travelClass} berth={l.berthType} size={64} className="rounded-lg" />
        <div>
          <div className="flex gap-1.5">
            <ClassBadge cls={l.travelClass} />
            <BerthBadge berth={l.berthType} />
          </div>
          <p className="seat-code mt-1 text-lg">
            {l.coach}-{l.seatNo}
          </p>
          <p className="text-xs text-muted">Wants: {wantsSummary(l)}</p>
        </div>
      </div>

      {l.status === "active" && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link href={boardHref} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold ${l.matchCount ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
            <Sparkles className="h-3.5 w-3.5" /> {l.matchCount ? `${l.matchCount} match${l.matchCount > 1 ? "es" : ""}` : "No matches yet"}
          </Link>
          <Link href="/requests" className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold ${l.pendingReceived ? "bg-saffron-100 text-saffron-700" : "bg-slate-100 text-slate-600"}`}>
            <Inbox className="h-3.5 w-3.5" /> {l.pendingReceived ? `${l.pendingReceived} request${l.pendingReceived > 1 ? "s" : ""} waiting` : "No requests"}
          </Link>
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
        <span className="text-xs text-slate-400">Listed {timeAgo(l.createdAt)}</span>
        <div className="flex items-center gap-2">
          <ManageListing id={l.id} status={l.status} compact />
          <Link href={`/listing/${l.id}`} className="btn-secondary btn-sm">
            View <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
