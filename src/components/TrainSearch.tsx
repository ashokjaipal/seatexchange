"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, TrainFront, ArrowRight, CalendarDays } from "lucide-react";
import type { Train } from "@/lib/trains";
import { addDays, todayYmd } from "@/lib/format";

interface Props {
  size?: "lg" | "md";
  defaultQuery?: string;
  defaultDate?: string;
  /** Called instead of navigating (used inside the listing wizard) */
  onPick?: (train: { no: string; name?: string; from?: string; to?: string }, date: string) => void;
  hideDate?: boolean;
  autoFocus?: boolean;
  buttonLabel?: string;
}

export function TrainSearch({ size = "md", defaultQuery = "", defaultDate, onPick, hideDate, autoFocus, buttonLabel = "Find swaps" }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQuery);
  const [date, setDate] = useState(defaultDate ?? todayYmd());
  const [results, setResults] = useState<Train[]>([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [err, setErr] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const today = todayYmd();

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/trains/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });
        const d = await r.json();
        setResults(d.trains ?? []);
        setHi(0);
      } catch {}
    }, 120);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (train: { no: string; name?: string; from?: string; to?: string }) => {
    setErr("");
    if (onPick) {
      onPick(train, date);
      setQ(train.name ? `${train.no} ${train.name}` : train.no);
      setOpen(false);
      return;
    }
    router.push(`/train/${train.no}?date=${date}`);
  };

  const submit = () => {
    const query = q.trim();
    if (results.length && open) return go({ no: results[hi].no, name: results[hi].name, from: results[hi].from.name, to: results[hi].to.name });
    if (/^\d{5}$/.test(query)) return go({ no: query });
    if (results.length) return go({ no: results[0].no, name: results[0].name, from: results[0].from.name, to: results[0].to.name });
    setErr("Type a 5-digit train number, or pick a train from the list.");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, results.length - 1));
      setOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const big = size === "lg";

  return (
    <div className={`w-full ${big ? "card p-2 sm:p-2.5" : ""}`}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1" ref={boxRef}>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className={`input pl-11 ${big ? "h-14 border-transparent bg-slate-50 text-base shadow-none focus:bg-white sm:text-lg" : ""} ${err ? "input-error" : ""}`}
            placeholder="Train number or name, e.g. 12951 or Rajdhani"
            value={q}
            autoFocus={autoFocus}
            inputMode="search"
            autoComplete="off"
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setErr("");
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            aria-label="Train number or name"
            aria-expanded={open && results.length > 0}
            role="combobox"
            aria-controls="train-results"
          />
          {open && results.length > 0 && (
            <ul id="train-results" role="listbox" className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-line bg-white p-1.5 shadow-pop animate-rise">
              {results.map((t, i) => (
                <li key={t.no} role="option" aria-selected={i === hi}>
                  <button
                    type="button"
                    onMouseEnter={() => setHi(i)}
                    onClick={() => go({ no: t.no, name: t.name, from: t.from.name, to: t.to.name })}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${i === hi ? "bg-brand-50" : "hover:bg-slate-50"}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                      <TrainFront className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        <span className="font-mono">{t.no}</span> · {t.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {t.from.name} → {t.to.name} · dep {t.dep} · {t.classes.join(", ")}
                      </span>
                    </span>
                    <span className="badge tone-slate hidden sm:inline-flex">{t.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!hideDate && (
          <div className="relative sm:w-48">
            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              className={`input pl-11 ${big ? "h-14 border-transparent bg-slate-50 shadow-none focus:bg-white" : ""}`}
              value={date}
              min={today}
              max={addDays(today, 120)}
              onChange={(e) => setDate(e.target.value || today)}
              aria-label="Journey date"
            />
          </div>
        )}

        <button type="button" onClick={submit} className={`btn-primary ${big ? "h-14 rounded-xl px-6 text-base" : ""}`}>
          {buttonLabel} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {err && <p className="px-2 pb-1 pt-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}
