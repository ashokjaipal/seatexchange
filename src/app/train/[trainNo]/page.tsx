import Link from "next/link";
import type { Metadata } from "next";
import { Clock, MapPin, PlusCircle, Share2, TrainFront } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getTrain } from "@/lib/trains";
import { activeListingsForTrain, myActiveListingsOnTrain, toPublicListing } from "@/lib/listings";
import { bestMatchAgainst } from "@/lib/matching";
import { formatDate, isValidYmd, relativeDay, todayYmd } from "@/lib/format";
import { isValidTrainNo } from "@/lib/rail";
import { DateStrip } from "@/components/DateStrip";
import { TrainBoard } from "@/components/TrainBoard";
import { TrainSearch } from "@/components/TrainSearch";
import { ShareButton } from "@/components/ShareButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ trainNo: string }>; searchParams: Promise<{ date?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trainNo } = await params;
  const t = getTrain(trainNo);
  return { title: t ? `${trainNo} ${t.name} - seats up for swap` : `Train ${trainNo} - seats up for swap` };
}

export default async function TrainPage({ params, searchParams }: Props) {
  const { trainNo } = await params;
  const sp = await searchParams;
  const date = sp.date && isValidYmd(sp.date) ? sp.date : todayYmd();
  const train = getTrain(trainNo);
  const viewer = await getSessionUser();
  const db = await getDb();

  const mine = viewer ? myActiveListingsOnTrain(db, viewer.id, trainNo, date) : [];
  const listings = activeListingsForTrain(db, trainNo, date).map((l) => ({
    ...toPublicListing(l, db, viewer?.id),
    match: mine.length ? bestMatchAgainst(mine, l) : null,
  }));
  const counts: Record<string, number> = {};
  for (const l of db.listings) if (l.trainNo === trainNo && l.status === "active") counts[l.journeyDate] = (counts[l.journeyDate] ?? 0) + 1;

  const listHref = `/list?train=${trainNo}&date=${date}`;
  const rel = relativeDay(date);

  if (!isValidTrainNo(trainNo)) {
    return (
      <div className="container-x py-12">
        <h1 className="text-2xl font-extrabold">That doesn&apos;t look like a train number</h1>
        <p className="mt-2 text-muted">Train numbers are 5 digits, like 12951.</p>
        <div className="mt-6 max-w-2xl">
          <TrainSearch />
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-6 sm:py-10">
      {/* Train header */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-glow">
              <TrainFront className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                <span className="font-mono">{trainNo}</span> {train ? `· ${train.name}` : ""}
              </h1>
              {train ? (
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {train.from.name} → {train.to.name}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> dep {train.dep} · {train.dur}
                  </span>
                  <span className="badge tone-slate">{train.type}</span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted">We don&apos;t have this train&apos;s details yet, but swaps work all the same.</p>
              )}
              <p className="mt-2 text-sm font-semibold text-brand-700">
                {formatDate(date)} {rel && <span className="badge tone-saffron ml-1">{rel}</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <ShareButton
              title={`Swap seats on ${trainNo}${train ? " " + train.name : ""} on ${formatDate(date)}`}
              text={`I'm on ${trainNo}${train ? " " + train.name : ""} on ${formatDate(date)}. If you'd like to exchange seats, list yours here:`}
              path={`/train/${trainNo}?date=${date}`}
            >
              <Share2 className="h-4 w-4" /> Share
            </ShareButton>
            <Link href={listHref} className="btn-accent">
              <PlusCircle className="h-4 w-4" /> List my seat
            </Link>
          </div>
        </div>
        <div className="border-t border-line bg-canvas px-5 py-3">
          <DateStrip basePath={`/train/${trainNo}`} selected={date} counts={counts} />
        </div>
      </div>

      <TrainBoard listings={listings} myListings={mine.map((m) => toPublicListing(m, db, viewer?.id))} listHref={listHref} loggedIn={!!viewer} />

      <div className="mt-10 rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">
        Looking for a different train?
        <div className="mx-auto mt-3 max-w-xl text-left">
          <TrainSearch defaultDate={date} />
        </div>
      </div>
    </div>
  );
}
