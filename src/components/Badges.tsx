import { BERTH_INFO, CLASS_INFO } from "@/lib/rail";
import type { BerthType, TravelClass } from "@/lib/types";
import type { MatchLabel } from "@/lib/matching";
import { Sparkles, ThumbsUp, CircleDot, BadgeCheck } from "lucide-react";

export function ClassBadge({ cls, className = "" }: { cls: TravelClass; className?: string }) {
  return (
    <span className={`badge tone-brand ${className}`} title={CLASS_INFO[cls].label}>
      {cls}
    </span>
  );
}

export function BerthBadge({ berth, full = false, className = "" }: { berth: BerthType; full?: boolean; className?: string }) {
  const b = BERTH_INFO[berth];
  return (
    <span className={`badge tone-${b.tone} ${className}`} title={b.label}>
      {full ? b.label : b.short}
    </span>
  );
}

export function MatchBadge({ label, className = "" }: { label: MatchLabel; className?: string }) {
  if (label === "perfect")
    return (
      <span className={`badge whitespace-nowrap bg-emerald-600 text-white ${className}`}>
        <Sparkles className="h-3 w-3" /> Perfect match
      </span>
    );
  if (label === "good")
    return (
      <span className={`badge whitespace-nowrap tone-green ${className}`}>
        <ThumbsUp className="h-3 w-3" /> Good match
      </span>
    );
  return (
    <span className={`badge whitespace-nowrap tone-slate ${className}`}>
      <CircleDot className="h-3 w-3" /> Possible
    </span>
  );
}

export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`badge whitespace-nowrap tone-green ${className}`} title="Seat confirmed against live IRCTC PNR status">
      <BadgeCheck className="h-3 w-3" /> Verified
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { text: string; tone: string }> = {
    active: { text: "Live", tone: "tone-green" },
    swapped: { text: "Swapped", tone: "tone-brand" },
    withdrawn: { text: "Withdrawn", tone: "tone-slate" },
    expired: { text: "Expired", tone: "tone-slate" },
    pending: { text: "Pending", tone: "tone-amber" },
    accepted: { text: "Accepted", tone: "tone-green" },
    declined: { text: "Declined", tone: "tone-red" },
    cancelled: { text: "Cancelled", tone: "tone-slate" },
    completed: { text: "Swap done", tone: "tone-brand" },
  };
  const s = map[status] ?? { text: status, tone: "tone-slate" };
  return <span className={`badge ${s.tone}`}>{s.text}</span>;
}
