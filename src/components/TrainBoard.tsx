"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Armchair, Filter, PlusCircle, Sparkles } from "lucide-react";
import type { PublicListing, TravelClass, BerthType } from "@/lib/types";
import type { MatchResult } from "@/lib/matching";
import { BERTH_INFO, CLASS_INFO, CLASS_ORDER, berthOptionsFor } from "@/lib/rail";
import { ListingCard } from "./ListingCard";
import { EmptyState } from "./EmptyState";

type Item = PublicListing & { match: (MatchResult & { myListingId: string }) | null };

export function TrainBoard({
  listings,
  myListings,
  listHref,
  loggedIn,
}: {
  listings: Item[];
  myListings: PublicListing[];
  listHref: string;
  loggedIn: boolean;
}) {
  const [cls, setCls] = useState<TravelClass | "ALL">("ALL");
  const [have, setHave] = useState<BerthType | "ALL">("ALL");
  const [want, setWant] = useState<BerthType | "ALL">("ALL");
  const [sort, setSort] = useState<"match" | "new">(myListings.length ? "match" : "new");

  const classesPresent = useMemo(() => CLASS_ORDER.filter((c) => listings.some((l) => l.travelClass === c)), [listings]);
  const berthsPresent = useMemo(() => {
    const set = new Set<BerthType>();
    for (const l of listings) if (cls === "ALL" || l.travelClass === cls) set.add(l.berthType);
    const order = cls === "ALL" ? (Object.keys(BERTH_INFO) as BerthType[]) : berthOptionsFor(cls);
    return order.filter((b) => set.has(b));
  }, [listings, cls]);
  const wantsPresent = useMemo(() => {
    const set = new Set<BerthType>();
    for (const l of listings) if (cls === "ALL" || l.travelClass === cls) l.wants.berthTypes.forEach((b) => set.add(b));
    const order = cls === "ALL" ? (Object.keys(BERTH_INFO) as BerthType[]) : berthOptionsFor(cls);
    return order.filter((b) => set.has(b));
  }, [listings, cls]);

  const filtered = useMemo(() => {
    const out = listings.filter(
      (l) =>
        (cls === "ALL" || l.travelClass === cls) &&
        (have === "ALL" || l.berthType === have) &&
        (want === "ALL" || l.wants.berthTypes.length === 0 || l.wants.berthTypes.includes(want)),
    );
    if (sort === "match") {
      out.sort((a, b) => (b.match?.score ?? -1) - (a.match?.score ?? -1) || b.createdAt.localeCompare(a.createdAt));
    } else {
      out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return out;
  }, [listings, cls, have, want, sort]);

  const others = filtered.filter((l) => !l.isMine);
  const matchesCount = listings.filter((l) => l.match).length;

  return (
    <div className="mt-6">
      {myListings.length > 0 && (
        <div className="mb-6 rounded-2xl border border-saffron-200 bg-saffron-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-saffron-600 shadow-card">
                <Armchair className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold">
                  Your seat{myListings.length > 1 ? "s" : ""} on this train:{" "}
                  {myListings.map((m) => `${m.coach}-${m.seatNo}`).join(", ")}
                </p>
                <p className="text-sm text-slate-600">
                  {matchesCount > 0 ? (
                    <>
                      <Sparkles className="inline h-3.5 w-3.5 text-saffron-500" /> {matchesCount} possible match{matchesCount > 1 ? "es" : ""} below, sorted best first.
                    </>
                  ) : (
                    "No matches yet. You'll be notified the moment a matching seat is listed."
                  )}
                </p>
              </div>
            </div>
            <Link href="/my-seats" className="btn-secondary btn-sm">
              Manage
            </Link>
          </div>
        </div>
      )}

      {listings.length > 0 && (
        <div className="mb-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
            <Filter className="h-3.5 w-3.5" /> Filter
          </div>
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <button className={`chip ${cls === "ALL" ? "chip-on" : ""}`} onClick={() => { setCls("ALL"); setHave("ALL"); setWant("ALL"); }}>
              All classes
            </button>
            {classesPresent.map((c) => (
              <button key={c} className={`chip ${cls === c ? "chip-on" : ""}`} onClick={() => { setCls(c); setHave("ALL"); setWant("ALL"); }}>
                {c} · {CLASS_INFO[c].label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="scrollbar-none -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <span className="shrink-0 text-xs font-semibold text-muted">They have:</span>
              <button className={`chip py-1.5 text-xs ${have === "ALL" ? "chip-on" : ""}`} onClick={() => setHave("ALL")}>Any</button>
              {berthsPresent.map((b) => (
                <button key={b} className={`chip py-1.5 text-xs ${have === b ? "chip-on" : ""}`} onClick={() => setHave(b)}>
                  {BERTH_INFO[b].short}
                </button>
              ))}
            </div>
            <div className="scrollbar-none -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <span className="shrink-0 text-xs font-semibold text-muted">They want:</span>
              <button className={`chip py-1.5 text-xs ${want === "ALL" ? "chip-on" : ""}`} onClick={() => setWant("ALL")}>Any</button>
              {wantsPresent.map((b) => (
                <button key={b} className={`chip py-1.5 text-xs ${want === b ? "chip-on" : ""}`} onClick={() => setWant(b)}>
                  {BERTH_INFO[b].short}
                </button>
              ))}
            </div>
            <div className="sm:ml-auto">
              <select className="input w-auto py-1.5 text-xs" value={sort} onChange={(e) => setSort(e.target.value as "match" | "new")} aria-label="Sort">
                <option value="new">Newest first</option>
                <option value="match" disabled={!myListings.length}>Best match for me</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {listings.length === 0 ? (
        <EmptyState
          icon={<Armchair className="h-7 w-7" />}
          title="No seats listed for this date yet"
          body="Be the first. When another passenger on this train lists a seat that matches what you want, we'll notify you immediately."
          action={
            <Link href={listHref} className="btn-primary">
              <PlusCircle className="h-4 w-4" /> List my seat
            </Link>
          }
        />
      ) : others.length === 0 ? (
        <EmptyState title="No seats match these filters" body="Try clearing a filter, or list your seat so people can find you." action={<button className="btn-secondary" onClick={() => { setCls("ALL"); setHave("ALL"); setWant("ALL"); }}>Clear filters</button>} />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            {others.length} seat{others.length > 1 ? "s" : ""} up for swap{!loggedIn && " · log in to propose a swap"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((l) => (
              <ListingCard key={l.id} listing={l} match={l.match} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
