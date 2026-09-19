"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ArrowLeftRight, Armchair, LogOut, Menu, PlusCircle, User as UserIcon, X } from "lucide-react";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";
import { timeAgo } from "@/lib/format";
import type { Notification } from "@/lib/types";

interface NavUser {
  id: string;
  name: string;
}

export function NavClient({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [pending, setPending] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setBell(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/notifications", { cache: "no-store" });
        const d = await r.json();
        if (!alive) return;
        setNotifs(d.notifications ?? []);
        setUnread(d.unread ?? 0);
        setPending(d.pendingRequests ?? 0);
      } catch {}
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [user, pathname]);

  useEffect(() => {
    if (!bell) return;
    const onDoc = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBell(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [bell]);

  const openBell = async () => {
    setBell((v) => !v);
    if (unread > 0) {
      setUnread(0);
      try {
        await fetch("/api/notifications/read", { method: "POST" });
      } catch {}
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const navLink = (href: string, label: string, Icon: typeof Bell, badge?: number) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
        {badge ? (
          <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron-500 px-1.5 text-[11px] font-bold text-white">
            {badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-white/85 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {user && navLink("/my-seats", "My seats", Armchair)}
          {user && navLink("/requests", "Requests", ArrowLeftRight, pending)}
          <Link href="/how-it-works" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-ink">
            How it works
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/list" className="btn-accent hidden sm:inline-flex">
            <PlusCircle className="h-4 w-4" /> List my seat
          </Link>

          {user ? (
            <>
              <div className="relative" ref={bellRef}>
                <button
                  onClick={openBell}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-saffron-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      {unread}
                    </span>
                  )}
                </button>
                {bell && (
                  <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-pop animate-rise">
                    <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                      <span className="text-sm font-bold">Notifications</span>
                      <button onClick={() => setBell(false)} className="text-slate-400 hover:text-ink" aria-label="Close">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <ul className="max-h-96 overflow-y-auto">
                      {notifs.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">Nothing yet. We&apos;ll ping you here when someone wants your seat.</li>}
                      {notifs.map((n) => (
                        <li key={n.id} className="border-b border-line/70 last:border-0">
                          <Link href={n.href ?? "/requests"} className="block px-4 py-3 hover:bg-slate-50">
                            <div className="flex items-start gap-2">
                              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-saffron-500" />}
                              <div className={n.read ? "pl-4" : ""}>
                                <p className="text-sm font-semibold">{n.title}</p>
                                <p className="mt-0.5 text-xs text-muted">{n.body}</p>
                                <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Link href="/profile" className="hidden items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-slate-100 md:flex" aria-label="Profile">
                <Avatar name={user.name} size="sm" />
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn-secondary hidden md:inline-flex">
              Log in
            </Link>
          )}

          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-white md:hidden animate-rise">
          <div className="container-x flex flex-col gap-1 py-3">
            <Link href="/list" className="btn-accent w-full">
              <PlusCircle className="h-4 w-4" /> List my seat
            </Link>
            {user ? (
              <>
                {navLink("/my-seats", "My seats", Armchair)}
                {navLink("/requests", "Swap requests", ArrowLeftRight, pending)}
                {navLink("/profile", user.name, UserIcon)}
                <Link href="/how-it-works" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                  How it works
                </Link>
                <button onClick={logout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/how-it-works" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                  How it works
                </Link>
                <Link href="/login" className="btn-secondary w-full">
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
