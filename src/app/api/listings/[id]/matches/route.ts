import { handle, fail, json, requireUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import { activeListingsForTrain, toPublicListing } from "@/lib/listings";
import { scoreMatch } from "@/lib/matching";

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const db = await getDb();
  const mine = db.listings.find((x) => x.id === id);
  if (!mine) return fail("Listing not found.", 404);
  if (mine.userId !== user.id) return fail("Not your listing.", 403);
  const matches = activeListingsForTrain(db, mine.trainNo, mine.journeyDate)
    .map((l) => ({ listing: toPublicListing(l, db, user.id), match: scoreMatch(mine, l) }))
    .filter((x) => x.match)
    .sort((a, b) => b.match!.score - a.match!.score);
  return json({ matches });
});
