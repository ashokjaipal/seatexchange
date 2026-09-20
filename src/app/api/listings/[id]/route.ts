import { handle, fail, json, readJson, requireUser, str, num } from "@/lib/api";
import { getDb, mutate } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { toPublicListing, myActiveListingsOnTrain, toPublicRequest } from "@/lib/listings";
import { bestMatchAgainst } from "@/lib/matching";
import { berthOptionsFor, isValidCoach, normalizeCoach } from "@/lib/rail";
import type { BerthType } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const viewer = await getSessionUser();
  const db = await getDb();
  const l = db.listings.find((x) => x.id === id);
  if (!l) return fail("Listing not found.", 404);
  const mine = viewer ? myActiveListingsOnTrain(db, viewer.id, l.trainNo, l.journeyDate) : [];
  const requests =
    viewer && l.userId === viewer.id
      ? db.requests
          .filter((r) => r.toListingId === l.id || r.fromListingId === l.id)
          .map((r) => toPublicRequest(r, db, viewer))
          .filter(Boolean)
      : [];
  return json({
    listing: toPublicListing(l, db, viewer?.id),
    match: mine.length ? bestMatchAgainst(mine, l) : null,
    myListings: mine.map((m) => toPublicListing(m, db, viewer?.id)),
    requests,
  });
});

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const body = await readJson(req);
  const db = await getDb();
  const l = db.listings.find((x) => x.id === id);
  if (!l) return fail("Listing not found.", 404);
  if (l.userId !== user.id) return fail("You can only edit your own listing.", 403);
  if (l.status !== "active") return fail("This listing is no longer active.");

  const wants = body.wants as Record<string, unknown> | undefined;
  const allowed = berthOptionsFor(l.travelClass);
  await mutate(() => {
    if (wants) {
      if (Array.isArray(wants.berthTypes)) {
        l.wants.berthTypes = [
          ...new Set(wants.berthTypes.map((x) => str(x, 2)).filter((x) => allowed.includes(x as BerthType)) as BerthType[]),
        ];
      }
      const c = normalizeCoach(str(wants.coach, 4));
      l.wants.coach = c && isValidCoach(c) ? c : undefined;
      const n = num(wants.nearSeat);
      l.wants.nearSeat = l.wants.coach && n && n > 0 ? n : undefined;
      l.wants.womenOnly = !!wants.womenOnly && l.passenger.gender === "F" ? true : undefined;
      const note = str(wants.note, 280);
      l.wants.note = note || undefined;
    }
    if (body.status === "withdrawn" || body.status === "swapped") l.status = body.status;
    l.updatedAt = new Date().toISOString();
  });
  return json({ listing: toPublicListing(l, db, user.id) });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const db = await getDb();
  const l = db.listings.find((x) => x.id === id);
  if (!l) return fail("Listing not found.", 404);
  if (l.userId !== user.id) return fail("You can only remove your own listing.", 403);
  await mutate((d) => {
    l.status = "withdrawn";
    l.updatedAt = new Date().toISOString();
    for (const r of d.requests) {
      if (r.status === "pending" && (r.fromListingId === l.id || r.toListingId === l.id)) {
        r.status = "cancelled";
        r.respondedAt = new Date().toISOString();
      }
    }
  });
  return json({ ok: true });
});
