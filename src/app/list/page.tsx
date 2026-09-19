import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getTrain } from "@/lib/trains";
import { DEMO_MODE } from "@/lib/otp";
import { DEMO_PNRS } from "@/lib/pnr";
import { isValidYmd } from "@/lib/format";
import { ListWizard } from "@/components/ListWizard";

export const metadata: Metadata = { title: "List my seat" };
export const dynamic = "force-dynamic";

export default async function ListPage({ searchParams }: { searchParams: Promise<{ train?: string; date?: string }> }) {
  const sp = await searchParams;
  const user = await getSessionUser();
  const qs = new URLSearchParams();
  if (sp.train) qs.set("train", sp.train);
  if (sp.date) qs.set("date", sp.date);
  const self = `/list${qs.toString() ? "?" + qs.toString() : ""}`;
  if (!user) redirect(`/login?next=${encodeURIComponent(self)}`);

  const train = sp.train ? getTrain(sp.train) : undefined;
  const initial = {
    trainNo: train?.no ?? (sp.train && /^\d{5}$/.test(sp.train) ? sp.train : undefined),
    trainName: train?.name,
    from: train?.from.name,
    to: train?.to.name,
    classes: train?.classes,
    date: sp.date && isValidYmd(sp.date) ? sp.date : undefined,
  };

  return (
    <div className="container-x py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <ListWizard user={{ name: user.name, gender: user.gender }} initial={initial} demo={DEMO_MODE} demoPnrs={DEMO_PNRS} />
      </div>
    </div>
  );
}
