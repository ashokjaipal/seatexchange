import Link from "next/link";
import { ArrowRight, MapPin, Quote, ShieldCheck, Users } from "lucide-react";
import type { PublicListing } from "@/lib/types";
import type { MatchResult } from "@/lib/matching";
import { BERTH_INFO } from "@/lib/rail";
import { timeAgo } from "@/lib/format";
import { BerthBadge, ClassBadge, MatchBadge } from "./Badges";
import { BerthDiagram } from "./BerthDiagram";
import { Avatar } from "./Avatar";

export function wantsSummary(l: Pick<PublicListing, "wants" | "travelClass">): string {
  const parts: string[] = [];
  if (l.wants.berthTypes.length) parts.push(l.wants.berthTypes.map((b) => BERTH_INFO[b].short).join(" / "));
  else parts.push("Any berth");
  if (l.wants.coach) parts.push(`near ${l.wants.coach}${l.wants.nearSeat ? "-" + l.wants.nearSeat : ""}`);
  return parts.join(" · ");
}

export function ListingCard({ listing, match, href }: { listing: PublicListing; match?: (MatchResult & { myListingId?: string }) | null; href?: string }) {
  const l = listing;
  const link = href ?? `/listing/${l.id}`;
  const who = `${l.passenger.firstName}${l.passenger.age ? `, ${l.passenger.age}` : ""}${l.passenger.gender ? ` ${l.passenger.gender}` : ""}`;
  return (
    <Link href={link} className="card group flex flex-col p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <BerthDiagram cls={l.travelClass} berth={l.berthType} size={64} className="shrink-0 rounded-lg" />
          <div>
            <div className="flex items-center gap-1.5">
              <ClassBadge cls={l.travelClass} />
              <BerthBadge berth={l.berthType} />
            </div>
            <p className="seat-code mt-1.5 text-lg">
              {l.coach}-{l.seatNo}
            </p>
          </div>
        </div>
        {l.isMine ? <span className="badge tone-saffron">Yours</span> : match ? <MatchBadge label={match.label} /> : null}
      </div>

      <div className="mt-3 rounded-xl bg-canvas px-3 py-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Wants</p>
        <p className="mt-0.5 text-sm font-semibold">{wantsSummary(l)}</p>
      </div>

      {l.wants.note && (
        <p className="mt-3 line-clamp-2 flex gap-1.5 text-sm text-slate-600">
          <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
          <span>{l.wants.note}</span>
        </p>
      )}

      <div className="mt-auto flex items-center justify-between pt-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Avatar name={l.ownerName} size="sm" />
          <span className="font-medium text-slate-700">{who}</span>
          {l.wants.womenOnly && (
            <span className="badge tone-violet" title="Swaps with women passengers only">
              <ShieldCheck className="h-3 w-3" /> Women only
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400">{timeAgo(l.createdAt)}</span>
      </div>

      {(l.from || l.to) && (
        <p className="mt-2 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3 w-3" /> {l.from} → {l.to}
        </p>
      )}

      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 opacity-80 transition group-hover:opacity-100">
        {l.isMine ? "Manage" : "Propose a swap"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function ListingMini({ listing, label }: { listing: PublicListing; label?: string }) {
  const l = listing;
  return (
    <div className="flex items-center gap-3">
      <BerthDiagram cls={l.travelClass} berth={l.berthType} size={56} className="shrink-0 rounded-lg" />
      <div className="min-w-0">
        {label && <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</p>}
        <p className="seat-code">
          {l.coach}-{l.seatNo} <span className="font-sans text-xs font-semibold text-muted">{l.travelClass}</span>
        </p>
        <p className="text-xs text-slate-600">
          {BERTH_INFO[l.berthType].label} · <Users className="inline h-3 w-3" /> {l.passenger.firstName}
        </p>
      </div>
    </div>
  );
}
