import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight, BadgeCheck, HeartHandshake, Search, ShieldAlert, Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "How it works" };

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is exchanging seats allowed?",
    a: "Yes. Passengers exchange berths on board all the time with mutual consent, and TTEs routinely help with it. SeatBadlo simply lets you find the willing co-passenger before the journey instead of asking around in the coach. Tickets are not transferred and stay in the original names.",
  },
  {
    q: "Why do you ask for my PNR?",
    a: "To check that the seat is real and to stop the same seat being listed twice. We store only a one-way hash and the last 4 digits. Nobody, including other passengers, ever sees your PNR.",
  },
  {
    q: "When does the other person get my phone number?",
    a: "Only after a swap request is accepted. Until then you are a first name, an age and a seat. Declining a request reveals nothing.",
  },
  {
    q: "Does it cost anything?",
    a: "No. SeatBadlo is free. Never pay anyone for a swap, and report anyone who asks.",
  },
  {
    q: "What if my train isn't in the list?",
    a: "Type the 5-digit train number anyway. Listings work for every train, even ones we don't yet have the name and route for.",
  },
  {
    q: "What if both of us get on at different stations?",
    a: "Listings show boarding and destination stations, and matches point out when they differ. Agree on where to swap in the message before accepting.",
  },
  {
    q: "The swap was agreed but the other person didn't turn up?",
    a: "It happens rarely. Your original seat is always yours, so nothing is lost. Mark the request as not completed and list again if you like.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="container-x py-8 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How SeatBadlo works</h1>
        <p className="mt-3 text-lg text-slate-600">A polite, private way to end up in the seat you actually want.</p>

        <ol className="mt-10 space-y-4">
          <Step icon={<Search className="h-5 w-5" />} n={1} title="Find your train and date">
            Enter the train number (or name) and your boarding date. You&apos;ll see every seat that co-passengers have put up for exchange, with the berth type they have and what they want instead.
          </Step>
          <Step icon={<ArrowLeftRight className="h-5 w-5" />} n={2} title="List your seat, or propose directly">
            Add your seat from the ticket: PNR, class, coach, berth. Say what you want: a lower berth, a window, a seat near your family in another coach. We auto-detect the berth type from the number for you.
          </Step>
          <Step icon={<Sparkles className="h-5 w-5" />} n={3} title="Get matched">
            The board sorts seats by how well they fit, and we notify you the moment a seat that matches your wish is listed. Send a request in one tap, with a short note.
          </Step>
          <Step icon={<HeartHandshake className="h-5 w-5" />} n={4} title="Agree, then meet at the seat">
            When the other passenger accepts, both of you see each other&apos;s name and number, with a WhatsApp shortcut. Board, exchange places, and let the TTE know. Tap &ldquo;We swapped&rdquo; to close it.
          </Step>
        </ol>

        <div className="mt-12 rounded-2xl border border-line bg-white p-6">
          <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <BadgeCheck className="h-5 w-5 text-emerald-600" /> Swap etiquette
          </h2>
          <ul className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <li className="rounded-xl bg-canvas p-3">Reply to requests quickly, even to decline. Someone is planning their journey around it.</li>
            <li className="rounded-xl bg-canvas p-3">If your plans change, remove your listing so nobody counts on it.</li>
            <li className="rounded-xl bg-canvas p-3">Lower berths to those who need them: the elderly, parents with infants, anyone unwell.</li>
            <li className="rounded-xl bg-canvas p-3">Tell the TTE after exchanging. It keeps the chart tidy and avoids confusion at night.</li>
          </ul>
        </div>

        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-red-900">
            <ShieldAlert className="h-5 w-5" /> Stay safe
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-red-900/80">
            <li>Never pay, and never share your PNR, OTP or ticket photo with anyone.</li>
            <li>Women travellers can restrict swaps to women passengers only. The restriction is enforced, not just shown.</li>
            <li>Meet at the seat on the train, not before. Your ticket and original seat always remain yours.</li>
          </ul>
        </div>

        <h2 className="mt-12 text-2xl font-extrabold tracking-tight">Questions people ask</h2>
        <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <span className="text-slate-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/" className="btn-primary btn-lg">
            Find my train
          </Link>
        </div>
      </div>
    </div>
  );
}

function Step({ icon, n, title, children }: { icon: React.ReactNode; n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="card flex gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-glow">{icon}</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Step {n}</p>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{children}</p>
      </div>
    </li>
  );
}
