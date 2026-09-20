import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { activeListingsForTrain, toPublicListing } from "@/lib/listings";
import { scoreMatch } from "@/lib/matching";
import { MySeatsView, type MySeat } from "@/components/MySeatsView";

export const metadata: Metadata = { title: "My seats" };
export const dynamic = "force-dynamic";

export default async function MySeatsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/my-seats");
  const db = await getDb();
  const mine = db.listings.filter((l) => l.userId === user.id).sort((a, b) => a.journeyDate.localeCompare(b.journeyDate) || b.createdAt.localeCompare(a.createdAt));
  const seats: MySeat[] = mine.map((l) => ({
    ...toPublicListing(l, db, user.id),
    pendingReceived: db.requests.filter((r) => r.toListingId === l.id && r.status === "pending").length,
    matchCount: l.status === "active" ? activeListingsForTrain(db, l.trainNo, l.journeyDate).filter((o) => scoreMatch(l, o)).length : 0,
  }));
  const upcoming = seats.filter((s) => s.status === "active");
  const past = seats.filter((s) => s.status !== "active").sort((a, b) => b.journeyDate.localeCompare(a.journeyDate));

  return (
    <div className="container-x py-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">My seats</h1>
            <p className="mt-1 text-muted">Seats you&apos;ve put up for exchange.</p>
          </div>
          <Link href="/list" className="btn-accent">
            <PlusCircle className="h-4 w-4" /> List another seat
          </Link>
        </div>
        <div className="mt-6">
          <MySeatsView upcoming={upcoming} past={past} />
        </div>
      </div>
    </div>
  );
}
