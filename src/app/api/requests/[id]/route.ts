import { handle, fail, json, readJson, requireUser, str } from "@/lib/api";
import { getDb, mutate } from "@/lib/db";
import { toPublicRequest } from "@/lib/listings";
import { pushNotification } from "@/lib/notify";
import { firstName } from "@/lib/format";

type Action = "accept" | "decline" | "cancel" | "complete";

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const body = await readJson(req);
  const action = str(body.action, 10) as Action;
  const db = await getDb();
  const r = db.requests.find((x) => x.id === id);
  if (!r) return fail("Request not found.", 404);
  const isReceiver = r.toUserId === user.id;
  const isSender = r.fromUserId === user.id;
  if (!isReceiver && !isSender) return fail("Not your request.", 403);

  const now = new Date().toISOString();
  const me = firstName(user.name);
  const from = db.listings.find((l) => l.id === r.fromListingId);
  const to = db.listings.find((l) => l.id === r.toListingId);
  if (!from || !to) return fail("Listing not found.", 404);

  switch (action) {
    case "accept": {
      if (!isReceiver) return fail("Only the person who received the request can accept it.", 403);
      if (r.status !== "pending") return fail("This request is no longer pending.");
      await mutate((d) => {
        r.status = "accepted";
        r.respondedAt = now;
        // Both seats are now spoken for: close other pending requests on them
        for (const o of d.requests) {
          if (o.id === r.id || o.status !== "pending") continue;
          const touches = [o.fromListingId, o.toListingId].some((x) => x === from.id || x === to.id);
          if (touches) {
            o.status = "declined";
            o.respondedAt = now;
            pushNotification(d, o.fromUserId, "Seat no longer available", `A seat you requested on ${o.trainNo} was swapped with someone else.`, "/requests");
          }
        }
        pushNotification(d, r.fromUserId, "Swap accepted!", `${me} accepted your request on ${r.trainNo}. Contact details are now visible.`, "/requests");
      });
      break;
    }
    case "decline": {
      if (!isReceiver) return fail("Only the receiver can decline.", 403);
      if (r.status !== "pending") return fail("This request is no longer pending.");
      await mutate((d) => {
        r.status = "declined";
        r.respondedAt = now;
        pushNotification(d, r.fromUserId, "Request declined", `${me} declined your swap request on ${r.trainNo}. Keep looking, new seats get listed daily.`, `/train/${r.trainNo}?date=${r.journeyDate}`);
      });
      break;
    }
    case "cancel": {
      if (!isSender) return fail("Only the sender can cancel.", 403);
      if (r.status !== "pending") return fail("This request is no longer pending.");
      await mutate(() => {
        r.status = "cancelled";
        r.respondedAt = now;
      });
      break;
    }
    case "complete": {
      if (r.status !== "accepted") return fail("Only accepted swaps can be marked done.");
      await mutate((d) => {
        r.status = "completed";
        r.respondedAt = now;
        from.status = "swapped";
        to.status = "swapped";
        from.updatedAt = now;
        to.updatedAt = now;
        const other = isSender ? r.toUserId : r.fromUserId;
        pushNotification(d, other, "Swap marked as done", `${me} marked your swap on ${r.trainNo} as completed. Happy journey!`, "/requests");
      });
      break;
    }
    default:
      return fail("Unknown action.");
  }
  return json({ request: toPublicRequest(r, db, user) });
});
