import Link from "next/link";
import { addDays, formatDate, todayYmd } from "@/lib/format";

export function DateStrip({ basePath, selected, counts }: { basePath: string; selected: string; counts?: Record<string, number> }) {
  const today = todayYmd();
  const days = Array.from({ length: 8 }, (_, i) => addDays(today, i));
  const inStrip = days.includes(selected);
  return (
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {!inStrip && <DatePill href={`${basePath}?date=${selected}`} label={formatDate(selected)} sub="Selected" active count={counts?.[selected]} />}
      {days.map((d, i) => (
        <DatePill
          key={d}
          href={`${basePath}?date=${d}`}
          label={formatDate(d).split(", ")[1]}
          sub={i === 0 ? "Today" : i === 1 ? "Tomorrow" : formatDate(d).split(",")[0]}
          active={d === selected}
          count={counts?.[d]}
        />
      ))}
    </div>
  );
}

function DatePill({ href, label, sub, active, count }: { href: string; label: string; sub: string; active: boolean; count?: number }) {
  return (
    <Link
      href={href}
      className={`flex min-w-[88px] shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-center transition ${
        active ? "border-brand-600 bg-brand-600 text-white shadow-glow" : "border-line bg-white text-ink hover:border-brand-300"
      }`}
    >
      <span className={`text-[11px] font-semibold ${active ? "text-brand-100" : "text-muted"}`}>{sub}</span>
      <span className="text-sm font-bold">{label}</span>
      {count ? (
        <span className={`mt-0.5 text-[10px] font-bold ${active ? "text-saffron-200" : "text-emerald-600"}`}>{count} live</span>
      ) : (
        <span className="mt-0.5 text-[10px] text-transparent">.</span>
      )}
    </Link>
  );
}
