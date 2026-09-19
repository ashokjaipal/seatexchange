import { initials } from "@/lib/format";

const PALETTE = ["bg-brand-100 text-brand-800", "bg-saffron-100 text-saffron-700", "bg-emerald-100 text-emerald-800", "bg-violet-100 text-violet-800", "bg-sky-100 text-sky-800", "bg-rose-100 text-rose-800"];

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const color = PALETTE[h % PALETTE.length];
  const dim = size === "sm" ? "h-7 w-7 text-[11px]" : size === "lg" ? "h-14 w-14 text-lg" : "h-9 w-9 text-xs";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${dim} ${color}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
