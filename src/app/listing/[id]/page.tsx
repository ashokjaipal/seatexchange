import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Quote, ShieldCheck, Sparkles, TrainFront } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { myActiveListingsOnTrain, toPublicListing, toPublicRequest } from "@/lib/listings";
import { bestMatchAgainst } from "@/lib/matching";
import { BERTH_INFO, CLASS_INFO } from "@/lib/rail";
import { formatDate, relativeDay, timeAgo } from "@/lib/format";
import { BerthDiagram } from "@/components/BerthDiagram";
import { BerthBadge, ClassBadge, MatchBadge, StatusBadge } from "@/components/Badges";
import { Avatar } from "@/components/Avatar";
import { ProposeSwap } from "@/components/ProposeSwap";
import { ManageListing } from "@/components/ManageListing";
import { wantsSummary } from "@/components/ListingCard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const l = (await getDb()).listings.find((x) => x.id === id);
  return { title: l ? `${l.coach}-${l.seatNo} ${BERTH_INFO[l.berthType].label} on ${l.trainNo}` : "Listing" };
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  const db = await getDb();
  const raw = db.listings.find((x) => x.id === id);
  if (!raw) notFound();
  const viewer = await getSessionUser();
  const l = toPublicListing(raw, db, viewer?.id);
  const mine = viewer ? myActiveListingsOnTrain(db, viewer.id, raw.trainNo, raw.journeyDate) : [];
  const match = mine.length ? bestMatchAgainst(mine, raw) : null;
  const myPublic = mine.map((m) => toPublicListing(m, db, viewer?.id));
  const existing = viewer
    ? db.requests.find((r) => r.status === "pending" && r.toListingId === raw.id && r.fromUserId === viewer.id)
    : undefined;
  const received =
    viewer && l.isMine
      ? db.requests
          .filter((r) => r.toListingId === raw.id || r.fromListingId === raw.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((r) => toPublicRequest(r, db, viewer))
          .filter((r): r is NonNullable<typeof r> => !!r)
      : [];
  const rel = relativeDay(l.journeyDate);
  const boardHref = `/train/${l.trainNo}?date=${l.journeyDate}`;

  return (
    <div className="container-x py-6 sm:py-10">
      <Link href={boardHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All seats on {l.trainNo} · {formatDate(l.journeyDate)}
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line bg-canvas px-5 py-3 text-sm">
              <TrainFront className="h-4 w-4 text-brand-600" />
              <span className="font-bold">
                <span className="font-mono">{l.trainNo}</span> · {l.trainName}
              </span>
              <span className="text-muted">·</span>
              <span className="font-semibold text-brand-700">{formatDate(l.journeyDate)}</span>
              {rel && <span className="badge tone-saffron">{rel}</span>}
              <span className="ml-auto">
                <StatusBadge status={l.status} />
              </span>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <BerthDiagram cls={l.travelClass} berth={l.berthType} size={160} className="shrink-0 rounded-2xl" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ClassBadge cls={l.travelClass} />
                    <BerthBadge berth={l.berthType} full />
                    {l.isMine ? <span className="badge tone-saffron">Your listing</span> : match ? <MatchBadge label={match.label} /> : null}
                  </div>
                  <h1 className="seat-code mt-2 text-4xl">
                    {l.coach}-{l.seatNo}
                  </h1>
                  <p className="mt-1 text-slate-600">
                    {BERTH_INFO[l.berthType].label} in {CLASS_INFO[l.travelClass].label} coach {l.coach}
                  </p>
                  <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {l.from} → {l.to}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> listed {timeAgo(l.createdAt)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-canvas p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Wants in exchange</p>
                  <p className="mt-1 text-lg font-bold">{wantsSummary(l)}</p>
                  {l.wants.womenOnly && (
                    <span className="badge tone-violet mt-2">
                      <ShieldCheck className="h-3 w-3" /> Women passengers only
                    </span>
                  )}
                </div>
                <div className="rounded-2xl bg-canvas p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Passenger</p>
                  <div className="mt-2 flex items-center gap-3">
                    <Avatar name={l.ownerName} />
                    <div>
                      <p className="font-bold">{l.passenger.firstName}</p>
                      <p className="text-xs text-muted">
                        {[l.passenger.age && `${l.passenger.age} yrs`, l.passenger.gender === "F" ? "Woman" : l.passenger.gender === "M" ? "Man" : null].filter(Boolean).join(" · ") || "Details private"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {l.wants.note && (
                <blockquote className="mt-4 flex gap-3 rounded-2xl border border-saffron-200 bg-saffron-50 p-4 text-slate-800">
                  <Quote className="h-5 w-5 shrink-0 text-saffron-400" />
                  <p className="text-[15px] leading-relaxed">{l.wants.note}</p>
                </blockquote>
              )}

              {match && !l.isMine && match.reasons.length > 0 && (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <Sparkles className="h-4 w-4" /> Why this could work
                  </p>
                  <ul className="mt-1.5 list-inside list-disc text-sm text-emerald-900/80">
                    {match.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {l.isMine && (
                <div className="mt-6 border-t border-line pt-5">
                  <ManageListing id={l.id} status={l.status} />
                </div>
              )}
            </div>
          </div>

          {l.isMine && (
            <div className="card p-5">
              <h2 className="text-lg font-extrabold tracking-tight">Requests on this seat</h2>
              {received.length === 0 ? (
                <p className="mt-2 text-sm text-muted">No requests yet. Share the board with co-passengers to speed things up.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {received.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="text-sm">
                        <p className="font-semibold">
                          {r.direction === "received" ? `${r.theirs.passenger.firstName} offers` : `You offered for`} {r.theirs.coach}-{r.theirs.seatNo} ({BERTH_INFO[r.theirs.berthType].short})
                        </p>
                        <p className="text-xs text-muted">{timeAgo(r.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={r.status} />
                        <Link href="/requests" className="btn-secondary btn-sm">
                          Open
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {l.isMine ? (
            <div className="card p-5">
              <h2 className="text-lg font-extrabold tracking-tight">Find your match</h2>
              <p className="mt-2 text-sm text-slate-600">See every seat on this train sorted by how well it fits what you want.</p>
              <Link href={boardHref} className="btn-primary mt-4 w-full">
                <Sparkles className="h-4 w-4" /> See matches on the board
              </Link>
            </div>
          ) : l.status !== "active" ? (
            <div className="card p-5">
              <h2 className="text-lg font-extrabold tracking-tight">No longer available</h2>
              <p className="mt-2 text-sm text-slate-600">This seat has been {l.status}. Other seats on this train may still be up for swap.</p>
              <Link href={boardHref} className="btn-secondary mt-4 w-full">
                Back to the board
              </Link>
            </div>
          ) : (
            <ProposeSwap target={l} myListings={myPublic} loggedIn={!!viewer} existingRequestId={existing?.id} match={match} />
          )}
        </aside>
      </div>
    </div>
  );
}
