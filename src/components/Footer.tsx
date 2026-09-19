import Link from "next/link";
import { LogoMark } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="container-x grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2.5 font-extrabold tracking-tight">
            <LogoMark className="h-8 w-8" />
            <span className="text-lg">
              Seat<span className="text-saffron-500">Badlo</span>
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted">
            Seat badlo, saath baitho. A free community tool for Indian Railways passengers to exchange seats and berths with
            co-passengers on the same train, before boarding.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/how-it-works" className="hover:text-ink">How it works</Link></li>
            <li><Link href="/list" className="hover:text-ink">List your seat</Link></li>
            <li><Link href="/my-seats" className="hover:text-ink">My seats</Link></li>
            <li><Link href="/requests" className="hover:text-ink">Swap requests</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold">Good to know</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Not affiliated with IRCTC or Indian Railways</li>
            <li>Tickets always stay in the original passenger&apos;s name</li>
            <li>Never pay anyone for a swap</li>
            <li>Your PNR is never shown to others</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>Made with love for Indian train travellers.</span>
          <span>Swaps are voluntary arrangements between passengers. Please inform the TTE on board.</span>
        </div>
      </div>
    </footer>
  );
}
