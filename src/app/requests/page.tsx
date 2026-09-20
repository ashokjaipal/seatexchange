import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { toPublicRequest } from "@/lib/listings";
import { RequestsView } from "@/components/RequestsView";

export const metadata: Metadata = { title: "Swap requests" };
export const dynamic = "force-dynamic";

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/requests");
  const { tab } = await searchParams;
  const db = await getDb();
  const requests = db.requests
    .filter((r) => r.fromUserId === user.id || r.toUserId === user.id)
    .sort((a, b) => {
      const rank = (s: string) => (s === "pending" ? 0 : s === "accepted" ? 1 : 2);
      return rank(a.status) - rank(b.status) || b.createdAt.localeCompare(a.createdAt);
    })
    .map((r) => toPublicRequest(r, db, user))
    .filter((r): r is NonNullable<typeof r> => !!r);

  return (
    <div className="container-x py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Swap requests</h1>
        <p className="mt-1 text-muted">Accept a request to unlock each other&apos;s contact details.</p>
        <div className="mt-6">
          <RequestsView requests={requests} initialTab={tab === "sent" ? "sent" : tab === "received" ? "received" : undefined} />
        </div>
      </div>
    </div>
  );
}
