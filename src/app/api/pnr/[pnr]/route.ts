import { handle, fail, json } from "@/lib/api";
import { isValidPnr } from "@/lib/rail";
import { lookupPnr } from "@/lib/pnr";

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ pnr: string }> }) => {
  const { pnr } = await ctx.params;
  if (!isValidPnr(pnr)) return fail("PNR must be 10 digits.");
  const details = await lookupPnr(pnr);
  return json({ found: !!details, details });
});
