import Link from "next/link";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#2a48c2" />
      <rect x="12" y="16" width="26" height="9" rx="3" fill="#ffffff" opacity="0.95" />
      <rect x="26" y="39" width="26" height="9" rx="3" fill="#ff9538" />
      <path d="M44 17 L52 21 L44 25 Z" fill="#ffffff" opacity="0.95" />
      <path d="M20 39 L12 43 L20 47 Z" fill="#ff9538" />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const text = size === "lg" ? "text-2xl" : "text-lg";
  const mark = size === "lg" ? "h-10 w-10" : "h-8 w-8";
  return (
    <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
      <LogoMark className={mark} />
      <span className={text}>
        Seat<span className="text-saffron-500">Badlo</span>
      </span>
    </Link>
  );
}
