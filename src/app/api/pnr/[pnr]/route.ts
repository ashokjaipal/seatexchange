import { handle, fail, json } from "@/lib/api";
import { requireUser } from "@/lib/api";
import { isValidPnr } from "@/lib/rail";
import { lookupPnr, PNR_API_CONFIGURED } from "@/lib/pnr";

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ pnr: string }> }) => {
  await requireUser(); // lookups cost API quota: logged-in users only
  const { pnr } = await ctx.params;
  if (!isValidPnr(pnr)) return fail("PNR must be 10 digits.");
  const r = await lookupPnr(pnr);
  if (r.ok) return json({ found: true, details: r.details, live: PNR_API_CONFIGURED });
  return json({ found: false, reason: r.reason, message: r.message, live: PNR_API_CONFIGURED });
});
