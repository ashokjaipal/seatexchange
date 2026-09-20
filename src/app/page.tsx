import Link from "next/link";
import { ArrowLeftRight, BadgeCheck, Baby, HeartHandshake, Lock, Search, ShieldCheck, Sparkles, TrainFront, Users, Wallet, Accessibility, Sun } from "lucide-react";
import { TrainSearch } from "@/components/TrainSearch";
import { getDb } from "@/lib/db";
import { getTrain, POPULAR_TRAIN_NOS } from "@/lib/trains";
import { todayYmd, addDays } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = await getDb();
  const today = todayYmd();
  const liveSeats = db.listings.filter((l) => l.status === "active").length;
  const swapsAgreed = db.requests.filter((r) => r.status === "accepted" || r.status === "completed").length;
  const trainsToday = new Set(db.listings.filter((l) => l.status === "active").map((l) => `${l.trainNo}|${l.journeyDate}`)).size;

  const popular = POPULAR_TRAIN_NOS.map((no) => getTrain(no)!).filter(Boolean);
  const counts = new Map<string, number>();
  for (const l of db.listings) if (l.status === "active") counts.set(l.trainNo, (counts.get(l.trainNo) ?? 0) + 1);

  return (
    <>
      {/* Hero */}
      <section className="bg-hero relative overflow-hidden">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="container-x relative pb-14 pt-12 sm:pb-20 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="badge tone-saffron mb-5 inline-flex px-3 py-1 text-xs normal-case tracking-normal">
              <Sparkles className="h-3.5 w-3.5" /> Free for every Indian Railways passenger
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
              Swap your train seat <span className="text-brand-600">before</span> you board.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 sm:text-xl">
              Family got split across coaches? Stuck on an upper berth? Find co-passengers on <em>your</em> train who will happily
              exchange. No awkward asking around in the coach.
            </p>
            <p className="mt-3 text-base font-semibold text-saffron-600">Seat badlo, saath baitho.</p>
          </div>

          <div className="mx-auto mt-9 max-w-3xl animate-rise">
            <TrainSearch size="lg" autoFocus />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted">
              <span>Popular:</span>
              {popular.slice(0, 4).map((t) => (
                <Link key={t.no} href={`/train/${t.no}?date=${addDays(today, 1)}`} className="rounded-md px-1.5 py-0.5 font-semibold text-brand-700 hover:bg-brand-50">
                  {t.no} {t.name}
                </Link>
              ))}
            </div>
          </div>

          <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-white/80 py-4 text-center shadow-card backdrop-blur">
            <Stat n={liveSeats} label="seats up for swap" />
            <Stat n={trainsToday} label="trains with swaps" />
            <Stat n={swapsAgreed} label="swaps agreed" />
          </dl>
        </div>
      </section>

      {/* How it works */}
      <section className="container-x py-14 sm:py-20" id="how">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Three steps. Two minutes.</h2>
          <p className="mt-3 text-slate-600">Everything happens before the journey, so you board and sit exactly where you want.</p>
        </div>
        <ol className="mt-10 grid gap-4 sm:grid-cols-3">
          <Step n={1} icon={<Search className="h-5 w-5" />} title="Find your train" body="Enter your train number and travel date. See every seat that co-passengers have put up for exchange." />
          <Step n={2} icon={<ArrowLeftRight className="h-5 w-5" />} title="List or propose" body="Add your seat from the ticket and say what you'd like instead. Or propose a swap directly on a seat you like." />
          <Step n={3} icon={<HeartHandshake className="h-5 w-5" />} title="Agree & meet at the seat" body="Once both say yes, you get each other's number. Board, exchange, and tell the TTE. Done." />
        </ol>
      </section>

      {/* Use cases */}
      <section className="bg-white py-14 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Built for the way India travels</h2>
            <p className="mt-3 text-slate-600">Every long journey has one of these. Now there is a polite, private way to fix it.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <UseCase icon={<Users className="h-5 w-5" />} title="Family split across coaches" body="Booked late and got S4 and S9? Ask for seats near your group and let matches come to you." />
            <UseCase icon={<Accessibility className="h-5 w-5" />} title="Parents who need a lower berth" body="Many young travellers are happy to give up a lower berth. Find them before the journey, not after." />
            <UseCase icon={<Baby className="h-5 w-5" />} title="Kids who want the window" body="On Vande Bharat and Shatabdi, swap aisle for window with someone who prefers to stretch out." />
            <UseCase icon={<ShieldCheck className="h-5 w-5" />} title="Women travelling alone" body="Choose to swap only with women passengers. Your preference is enforced, not just displayed." />
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container-x py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Private by design. Free, always.</h2>
            <p className="mt-3 text-slate-600">
              SeatBadlo just introduces you to the right co-passenger. Your ticket stays yours, your PNR stays hidden, and there is
              never a payment involved.
            </p>
            <ul className="mt-6 space-y-4">
              <Trust icon={<Lock className="h-4 w-4" />} title="PNR is never shown" body="We use it only to confirm the seat is real and prevent duplicate listings. Others see just your coach and berth." />
              <Trust icon={<BadgeCheck className="h-4 w-4" />} title="Phone number shared only after both agree" body="Until a swap is accepted, you're just a first name and a seat." />
              <Trust icon={<Wallet className="h-4 w-4" />} title="No money, ever" body="Swaps are goodwill between passengers. If anyone asks for payment, report them." />
              <Trust icon={<Sun className="h-4 w-4" />} title="Nothing changes on your ticket" body="Tickets stay in the original names. You simply exchange places on board and inform the TTE." />
            </ul>
          </div>
          <div className="card overflow-hidden">
            <div className="border-b border-line bg-slate-50 px-5 py-3 text-sm font-bold">Trains with swaps right now</div>
            <ul className="divide-y divide-line">
              {popular.map((t) => (
                <li key={t.no}>
                  <Link href={`/train/${t.no}?date=${addDays(today, 1)}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                      <TrainFront className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        <span className="font-mono">{t.no}</span> · {t.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {t.from.name} → {t.to.name}
                      </span>
                    </span>
                    <span className={`badge ${counts.get(t.no) ? "tone-green" : "tone-slate"}`}>
                      {counts.get(t.no) ? `${counts.get(t.no)} live` : "Be first"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pb-6">
        <div className="relative overflow-hidden rounded-3xl bg-brand-700 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div className="bg-grid absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgb(255_255_255/0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.3)_1px,transparent_1px)]" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Travelling soon? List your seat now.</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">
              The earlier you list, the more co-passengers see it. We will notify you the moment someone wants to swap.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/list" className="btn-accent btn-lg">
                List my seat
              </Link>
              <Link href="/how-it-works" className="btn btn-lg bg-white/10 text-white ring-1 ring-inset ring-white/30 hover:bg-white/20">
                How it works
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="px-2">
      <dt className="text-2xl font-extrabold tracking-tight text-brand-700 sm:text-3xl">{n}</dt>
      <dd className="text-xs text-muted sm:text-sm">{label}</dd>
    </div>
  );
}

function Step({ n, icon, title, body }: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="card relative p-6">
      <span className="absolute right-5 top-5 text-4xl font-extrabold text-slate-100">0{n}</span>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-glow">{icon}</span>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-600">{body}</p>
    </li>
  );
}

function UseCase({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-100 text-saffron-600">{icon}</span>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function Trust({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">{icon}</span>
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm text-slate-600">{body}</p>
      </div>
    </li>
  );
}
