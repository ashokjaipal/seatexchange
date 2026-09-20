"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Loader2, PartyPopper, Search, Share2, Sparkles, Ticket, Users, Wand2, AlertTriangle } from "lucide-react";
import type { BerthType, Gender, TravelClass } from "@/lib/types";
import type { PnrDetails, PnrPassenger } from "@/lib/pnr";
import { BERTH_INFO, CLASS_INFO, CLASS_ORDER, berthOptionsFor, deriveBerthType, isSittingClass, normalizeCoach } from "@/lib/rail";
import { addDays, formatDate, todayYmd } from "@/lib/format";
import { TrainSearch } from "./TrainSearch";
import { BerthDiagram } from "./BerthDiagram";
import { ClassBadge, BerthBadge, VerifiedBadge } from "./Badges";
import { ShareButton } from "./ShareButton";
import { useToast } from "./Toast";

interface Props {
  user: { name: string; gender?: Gender };
  initial: { trainNo?: string; trainName?: string; from?: string; to?: string; classes?: TravelClass[]; date?: string };
  demo: boolean;
  demoPnrs: string[];
  liveLookup: boolean;
}

const STEPS = ["Your ticket", "Your seat", "What you want", "Review"];
const NOTE_IDEAS = ["Travelling with elderly parent", "Family got split up", "Kid wants the window", "Medical reason, can't climb", "Happy to help anyone who needs it"];

type PnrState = { kind: "idle" } | { kind: "looking" } | { kind: "found"; details: PnrDetails } | { kind: "manual"; message: string } | { kind: "error"; message: string };

export function ListWizard({ user, initial, demo, demoPnrs, liveLookup }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const today = todayYmd();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Step 1: ticket
  const [pnr, setPnr] = useState("");
  const [pnrState, setPnrState] = useState<PnrState>({ kind: "idle" });
  const [passengerNo, setPassengerNo] = useState<number | null>(null);
  // Manual fallback (only when lookup is unavailable)
  const [trainNo, setTrainNo] = useState(initial.trainNo ?? "");
  const [trainName, setTrainName] = useState(initial.trainName ?? "");
  const [classes, setClasses] = useState<TravelClass[] | undefined>(initial.classes);
  const [date, setDate] = useState(initial.date && initial.date >= today ? initial.date : today);
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");
  const [manualTrain, setManualTrain] = useState(false);

  // Step 2: seat
  const [cls, setCls] = useState<TravelClass | "">(initial.classes?.length === 1 ? initial.classes[0] : "");
  const [coach, setCoach] = useState("");
  const [seat, setSeat] = useState("");
  const [berth, setBerth] = useState<BerthType | "">("");
  const [berthAuto, setBerthAuto] = useState(true);
  const [pName, setPName] = useState(user.name);
  const [pAge, setPAge] = useState("");
  const [pGender, setPGender] = useState<Gender | "">(user.gender ?? "");

  // Step 3: wants
  const [wantBerths, setWantBerths] = useState<BerthType[]>([]);
  const [near, setNear] = useState(false);
  const [wantCoach, setWantCoach] = useState("");
  const [nearSeat, setNearSeat] = useState("");
  const [womenOnly, setWomenOnly] = useState(false);
  const [note, setNote] = useState("");

  // Step 4
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<{ id: string; matchCount: number } | null>(null);

  const found = pnrState.kind === "found" ? pnrState.details : null;
  const verified = !!found?.verified;
  const seatNo = Number(seat);
  const derived = cls && seatNo ? deriveBerthType(cls, seatNo) : undefined;

  useEffect(() => {
    if (!found && berthAuto) setBerth(derived ?? "");
  }, [derived, berthAuto, found]);

  useEffect(() => {
    if (pnr.length === 10) lookup(pnr);
    else {
      setPnrState({ kind: "idle" });
      setPassengerNo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pnr]);

  const lookup = async (p: string) => {
    setPnrState({ kind: "looking" });
    setPassengerNo(null);
    try {
      const r = await fetch(`/api/pnr/${p}`);
      const d = await r.json();
      if (r.ok && d.found && d.details) {
        const det = d.details as PnrDetails;
        setPnrState({ kind: "found", details: det });
        setTrainNo(det.trainNo);
        setTrainName(det.trainName);
        setDate(det.journeyDate >= today ? det.journeyDate : today);
        setFrom(det.from);
        setTo(det.to);
        setCls(det.travelClass);
        const confirmed = det.passengers.filter((x) => x.status === "CNF" && x.coach && x.seatNo);
        if (confirmed.length === 1) applyPassenger(confirmed[0]);
      } else if (d.reason === "not_found") {
        setPnrState({ kind: "error", message: d.message || "No booking found for this PNR. Check the number on your ticket." });
      } else {
        setPnrState({ kind: "manual", message: d.message || "Couldn't fetch this PNR right now. Fill the details from your ticket below." });
      }
    } catch {
      setPnrState({ kind: "manual", message: "Couldn't reach the PNR service. Fill the details from your ticket below." });
    }
  };

  const applyPassenger = (p: PnrPassenger) => {
    setPassengerNo(p.number);
    setCoach(p.coach ?? "");
    setSeat(p.seatNo ? String(p.seatNo) : "");
    if (p.berthType) {
      setBerth(p.berthType);
      setBerthAuto(false);
    } else setBerthAuto(true);
    if (p.name) setPName(p.name);
    if (p.age) setPAge(String(p.age));
    if (p.gender) setPGender(p.gender);
  };

  const classOptions: TravelClass[] = classes?.length ? classes : CLASS_ORDER;
  const berthOptions = cls ? berthOptionsFor(cls) : [];
  const sitting = cls ? isSittingClass(cls) : false;
  const wantOptions = berthOptions.filter((b) => b !== berth);
  const manual = pnrState.kind === "manual";

  const validateStep = (): string => {
    if (step === 0) {
      if (!/^\d{10}$/.test(pnr)) return "Enter your 10-digit PNR from the ticket.";
      if (pnrState.kind === "looking") return "Checking your PNR, one moment.";
      if (pnrState.kind === "error") return pnrState.message;
      if (found) {
        if (found.cancelled) return "IRCTC shows this train as cancelled.";
        if (!passengerNo) return "Pick which passenger's seat you want to list.";
        return "";
      }
      if (!/^\d{5}$/.test(trainNo)) return "Pick your train, or enter its 5-digit number.";
      if (manualTrain && !trainName.trim()) return "Enter the train name.";
      if (!date || date < today) return "Pick a valid journey date.";
      if (date > addDays(today, 120)) return "Journey date is too far ahead.";
      if (!from.trim() || !to.trim()) return "Enter your boarding and destination stations.";
    }
    if (step === 1) {
      if (!cls) return "Pick your travel class.";
      const c = normalizeCoach(coach);
      if (!/^[A-Z]{1,2}[0-9]{1,2}$/.test(c)) return "Coach looks wrong. Examples: S4, B2, A1, C3.";
      if (!seatNo || seatNo < 1 || seatNo > CLASS_INFO[cls].maxSeat) return `Seat number must be 1 to ${CLASS_INFO[cls].maxSeat} for ${CLASS_INFO[cls].label}.`;
      if (!berth) return sitting ? "Pick your seat type: window, middle or aisle." : "Pick your berth type.";
      if (pName.trim().length < 2) return "Enter the passenger's name.";
      if (pAge && (Number(pAge) < 1 || Number(pAge) > 120)) return "Enter a valid age.";
    }
    if (step === 2) {
      if (near) {
        const c = normalizeCoach(wantCoach);
        if (!/^[A-Z]{1,2}[0-9]{1,2}$/.test(c)) return "Enter the coach you want to be near, e.g. S4.";
      }
      if (wantBerths.length === 1 && wantBerths[0] === berth && !near) return "That's the berth you already have. Pick something different, or choose Any.";
    }
    return "";
  };

  const next = () => {
    const e = validateStep();
    setErr(e);
    if (e) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    setErr("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const publish = async () => {
    if (!confirm) {
      setErr("Please confirm the details match your ticket.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pnr,
          passengerNumber: passengerNo ?? undefined,
          trainNo,
          trainName,
          journeyDate: date,
          from,
          to,
          travelClass: cls,
          coach: normalizeCoach(coach),
          seatNo,
          berthType: berth,
          passenger: { name: pName.trim(), age: pAge ? Number(pAge) : undefined, gender: pGender || undefined },
          wants: { berthTypes: wantBerths, coach: near ? normalizeCoach(wantCoach) : undefined, nearSeat: near && nearSeat ? Number(nearSeat) : undefined, womenOnly, note: note.trim() },
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDone({ id: d.listing.id, matchCount: d.matchCount ?? 0 });
      toast("Your seat is live!", "success");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const boardHref = `/train/${trainNo}?date=${date}`;

  if (done) {
    return (
      <div className="card animate-rise p-6 text-center sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <PartyPopper className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">Your seat is live!</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          Your {berth ? BERTH_INFO[berth].label.toLowerCase() : "seat"} in coach <span className="font-semibold">{normalizeCoach(coach)}</span> on{" "}
          <span className="font-mono font-semibold">{trainNo}</span> for {formatDate(date)} is now visible to co-passengers. We&apos;ll notify you the moment
          someone proposes a swap.
        </p>
        {done.matchCount > 0 ? (
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left">
            <p className="flex items-center gap-2 font-bold text-emerald-800">
              <Sparkles className="h-4 w-4" /> {done.matchCount} co-passenger{done.matchCount > 1 ? "s" : ""} already match{done.matchCount > 1 ? "" : "es"} what you want
            </p>
            <p className="mt-1 text-sm text-emerald-800/80">Don&apos;t wait for them to find you. Propose a swap now.</p>
          </div>
        ) : (
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-line bg-canvas p-4 text-left">
            <p className="font-bold">No matching seats yet</p>
            <p className="mt-1 text-sm text-slate-600">Share the board in your family or travel WhatsApp group. More people on the board means faster swaps for everyone.</p>
          </div>
        )}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={boardHref} className="btn-primary btn-lg">
            {done.matchCount > 0 ? "See matches" : "View the board"} <ArrowRight className="h-4 w-4" />
          </Link>
          <ShareButton
            className="btn-secondary btn-lg"
            title={`Swap seats on ${trainNo}`}
            text={`I'm on train ${trainNo} on ${formatDate(date)} and looking to exchange my seat. If you're on it too, list yours here:`}
            path={boardHref}
          >
            <Share2 className="h-4 w-4" /> Share with co-passengers
          </ShareButton>
        </div>
        <Link href="/my-seats" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
          Go to My seats
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ol className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-col gap-1.5">
            <span className={`h-1.5 rounded-full ${i <= step ? "bg-brand-600" : "bg-line"}`} />
            <span className={`text-[11px] font-bold uppercase tracking-wide ${i === step ? "text-brand-700" : i < step ? "text-ink" : "text-muted"}`}>
              {i < step ? <Check className="mr-0.5 inline h-3 w-3" /> : null}
              {s}
            </span>
          </li>
        ))}
      </ol>

      <div className="card animate-rise p-5 sm:p-8" key={step}>
        {/* STEP 1: Ticket */}
        {step === 0 && (
          <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-extrabold tracking-tight">Enter your PNR</h1>
              <p className="mt-1 text-sm text-muted">
                {liveLookup
                  ? "We fetch your train, date, coach and berth straight from IRCTC PNR status. Nothing to type twice."
                  : "We use the PNR only to verify the seat. It is never shown to anyone."}
              </p>
            </header>

            <div>
              <label className="label" htmlFor="pnr">
                PNR number <span className="font-normal text-muted">(10 digits, on your ticket)</span>
              </label>
              <div className="relative">
                <Ticket className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="pnr"
                  className={`input pl-11 font-mono text-lg tracking-widest ${pnrState.kind === "error" ? "input-error" : ""}`}
                  inputMode="numeric"
                  placeholder="10-digit PNR"
                  value={pnr}
                  maxLength={10}
                  autoFocus
                  onChange={(e) => setPnr(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
                {pnrState.kind === "looking" && <Loader2 className="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-brand-500" />}
                {found && <BadgeCheck className="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />}
              </div>
              {pnrState.kind === "looking" && <p className="hint">Checking PNR status with IRCTC…</p>}
              {pnrState.kind === "error" && (
                <p className="mt-2 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {pnrState.message}
                </p>
              )}
              {manual && (
                <p className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {pnrState.message}
                </p>
              )}
              {demo && pnrState.kind === "idle" && (
                <p className="hint">
                  Demo: try PNR{" "}
                  {demoPnrs.map((p, i) => (
                    <span key={p}>
                      <button type="button" className="kbd hover:bg-slate-100" onClick={() => setPnr(p)}>
                        {p}
                      </button>
                      {i < demoPnrs.length - 1 ? " or " : ""}
                    </span>
                  ))}
                  .
                </p>
              )}
            </div>

            {found && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <Wand2 className="h-4 w-4" /> {found.verified ? "Fetched from IRCTC" : "Demo ticket"}
                  </p>
                  <div className="flex gap-1.5">
                    <ClassBadge cls={found.travelClass} />
                    {found.chartPrepared ? <span className="badge tone-amber">Chart prepared</span> : <span className="badge tone-slate">Chart not prepared</span>}
                  </div>
                </div>
                <p className="mt-2 font-bold">
                  <span className="font-mono">{found.trainNo}</span> · {found.trainName}
                </p>
                <p className="text-sm text-slate-700">
                  {formatDate(found.journeyDate)}
                  {found.departureTime ? ` · dep ${found.departureTime}` : ""} · {found.from} → {found.to}
                </p>
                {found.cancelled && <p className="mt-2 text-sm font-semibold text-red-700">IRCTC shows this train as cancelled.</p>}

                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-emerald-900/70">
                  {found.passengers.length > 1 ? "Which seat do you want to list?" : "Seat on this ticket"}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {found.passengers.map((p) => {
                    const ok = p.status === "CNF" && !!p.coach && !!p.seatNo;
                    const on = passengerNo === p.number;
                    return (
                      <button
                        key={p.number}
                        type="button"
                        disabled={!ok}
                        onClick={() => applyPassenger(p)}
                        className={`flex items-center gap-3 rounded-xl border bg-white p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          on ? "border-brand-600 ring-2 ring-brand-200" : "border-line hover:border-brand-300"
                        }`}
                      >
                        {ok ? (
                          <BerthDiagram cls={found.travelClass} berth={p.berthType ?? deriveBerthType(found.travelClass, p.seatNo!) ?? "LB"} size={56} className="shrink-0 rounded-lg" />
                        ) : (
                          <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">{p.status}</span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold">
                            Passenger {p.number}
                            {p.name ? ` · ${p.name}` : ""}
                          </span>
                          <span className="block text-xs text-slate-600">
                            {ok ? `Coach ${p.coach} · Berth ${p.seatNo} · ${BERTH_INFO[p.berthType ?? deriveBerthType(found.travelClass, p.seatNo!) ?? "LB"].label}` : `${p.statusText} · not confirmed yet`}
                          </span>
                        </span>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? "border-brand-600 bg-brand-600 text-white" : "border-line"}`}>{on && <Check className="h-3 w-3" />}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {manual && (
              <>
                <div>
                  <label className="label">Train</label>
                  {trainNo && !manualTrain ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          <span className="font-mono">{trainNo}</span> {trainName && `· ${trainName}`}
                        </p>
                        {(from || to) && <p className="truncate text-xs text-muted">{from} → {to}</p>}
                      </div>
                      <button type="button" className="btn-ghost btn-sm shrink-0" onClick={() => { setTrainNo(""); setTrainName(""); setClasses(undefined); setFrom(""); setTo(""); }}>
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <TrainSearch
                        hideDate
                        buttonLabel="Select"
                        defaultQuery={manualTrain ? trainNo : ""}
                        onPick={(t) => {
                          setTrainNo(t.no);
                          setTrainName(t.name ?? "");
                          setFrom(t.from ?? "");
                          setTo(t.to ?? "");
                          setManualTrain(!t.name);
                          setClasses(undefined);
                          fetch(`/api/trains/search?q=${t.no}`)
                            .then((r) => r.json())
                            .then((d) => {
                              const hit = (d.trains ?? []).find((x: { no: string }) => x.no === t.no);
                              if (hit) setClasses(hit.classes);
                            })
                            .catch(() => {});
                        }}
                      />
                      {manualTrain && (
                        <div className="mt-3">
                          <label className="label" htmlFor="trainName">
                            Train name <span className="font-normal text-muted">(we don&apos;t have {trainNo} in our list yet)</span>
                          </label>
                          <input id="trainName" className="input" placeholder="e.g. Sabarmati Express" value={trainName} onChange={(e) => setTrainName(e.target.value)} />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label" htmlFor="date">
                      Boarding date
                    </label>
                    <input id="date" type="date" className="input" value={date} min={today} max={addDays(today, 120)} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="label" htmlFor="from">
                      Boarding at
                    </label>
                    <input id="from" className="input" placeholder="Station" value={from} onChange={(e) => setFrom(e.target.value)} />
                  </div>
                  <div>
                    <label className="label" htmlFor="to">
                      Getting off at
                    </label>
                    <input id="to" className="input" placeholder="Station" value={to} onChange={(e) => setTo(e.target.value)} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 2: Seat */}
        {step === 1 && (
          <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-extrabold tracking-tight">{found ? "Who is travelling on this seat?" : "Your seat, as on the ticket"}</h1>
              <p className="mt-1 text-sm text-muted">{found ? "Seat details come from your ticket. Just tell us about the passenger." : "Coach and seat are printed on your ticket, e.g. B2 / 23."}</p>
            </header>

            {found && cls && berth ? (
              <div className="flex items-center gap-4 rounded-2xl border border-line bg-canvas p-4">
                <BerthDiagram cls={cls} berth={berth} size={80} className="shrink-0 rounded-lg" />
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    <ClassBadge cls={cls} />
                    <BerthBadge berth={berth} />
                    {verified && <VerifiedBadge />}
                  </div>
                  <p className="mt-1.5 font-bold">
                    Coach {normalizeCoach(coach)} · Berth {seatNo}
                  </p>
                  <p className="text-xs text-muted">{BERTH_INFO[berth].label} · {CLASS_INFO[cls].label}</p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="label">Class</p>
                  <div className="flex flex-wrap gap-2">
                    {classOptions.map((c) => (
                      <button key={c} type="button" className={`chip ${cls === c ? "chip-on" : ""}`} onClick={() => { setCls(c); setBerthAuto(true); setWantBerths([]); }}>
                        <span className="font-bold">{c}</span> <span className={cls === c ? "text-brand-100" : "text-muted"}>{CLASS_INFO[c].label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="coach">
                      Coach
                    </label>
                    <input id="coach" className="input font-mono text-lg uppercase" placeholder={cls ? `e.g. ${CLASS_INFO[cls].coachPrefix}2` : "e.g. B2"} value={coach} maxLength={4} onChange={(e) => setCoach(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
                  </div>
                  <div>
                    <label className="label" htmlFor="seat">
                      {sitting ? "Seat number" : "Berth number"}
                    </label>
                    <input id="seat" type="number" className="input font-mono text-lg" placeholder={cls ? `1 - ${CLASS_INFO[cls].maxSeat}` : "e.g. 23"} value={seat} min={1} max={cls ? CLASS_INFO[cls].maxSeat : 120} onChange={(e) => setSeat(e.target.value.replace(/\D/g, "").slice(0, 3))} />
                  </div>
                </div>
                {cls && (
                  <div>
                    <p className="label">
                      {sitting ? "Seat position" : "Berth type"}{" "}
                      {!sitting && berthAuto && derived && (
                        <span className="badge tone-green ml-1 normal-case tracking-normal">
                          <Wand2 className="h-3 w-3" /> Auto-detected from berth number
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {berthOptions.map((b) => (
                        <button key={b} type="button" className={`chip ${berth === b ? "chip-on" : ""}`} onClick={() => { setBerth(b); setBerthAuto(false); }}>
                          {BERTH_INFO[b].label}
                        </button>
                      ))}
                    </div>
                    {berth && (
                      <div className="mt-3 flex items-center gap-3 rounded-xl bg-canvas p-3">
                        <BerthDiagram cls={cls} berth={berth} size={72} className="rounded-lg" />
                        <p className="text-sm text-slate-600">
                          Highlighted: <span className="font-semibold text-ink">{BERTH_INFO[berth].label}</span>
                          {!sitting && !berthAuto && derived && derived !== berth && (
                            <span className="block text-xs text-amber-700">
                              Berth {seatNo} in {cls} is usually a {BERTH_INFO[derived].label.toLowerCase()}.{" "}
                              <button type="button" className="font-semibold underline" onClick={() => setBerthAuto(true)}>
                                Use that
                              </button>
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="rounded-2xl border border-line p-4">
              <p className="flex items-center gap-2 text-sm font-bold">
                <Users className="h-4 w-4 text-brand-600" /> Passenger on this seat
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_100px_auto]">
                <div>
                  <label className="label" htmlFor="pName">
                    Name
                  </label>
                  <input id="pName" className="input" value={pName} onChange={(e) => setPName(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="pAge">
                    Age
                  </label>
                  <input id="pAge" type="number" className="input" placeholder="Opt." value={pAge} min={1} max={120} onChange={(e) => setPAge(e.target.value.replace(/\D/g, "").slice(0, 3))} />
                </div>
                <div>
                  <p className="label">Gender</p>
                  <div className="flex gap-1.5">
                    {(["F", "M", "O"] as const).map((g) => (
                      <button key={g} type="button" className={`chip px-3 ${pGender === g ? "chip-on" : ""}`} onClick={() => setPGender(pGender === g ? "" : g)}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="hint">Only the first name is shown to others. Age and gender help co-passengers understand your need.</p>
            </div>
          </div>
        )}

        {/* STEP 3: Wants */}
        {step === 2 && cls && (
          <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-extrabold tracking-tight">What would you like instead?</h1>
              <p className="mt-1 text-sm text-muted">Pick everything you&apos;d be happy with. More options means more matches.</p>
            </header>

            <div>
              <p className="label">{sitting ? "Seat position" : "Berth type"}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={`chip ${wantBerths.length === 0 ? "chip-on" : ""}`} onClick={() => setWantBerths([])}>
                  Any is fine
                </button>
                {wantOptions.map((b) => {
                  const on = wantBerths.includes(b);
                  return (
                    <button key={b} type="button" className={`chip ${on ? "chip-on" : ""}`} onClick={() => setWantBerths(on ? wantBerths.filter((x) => x !== b) : [...wantBerths, b])}>
                      {on && <Check className="h-3.5 w-3.5" />} {BERTH_INFO[b].label}
                    </button>
                  );
                })}
              </div>
              {wantBerths.length === 0 && <p className="hint">&ldquo;Any is fine&rdquo; is perfect if you mainly want to sit near someone, or are simply offering your seat.</p>}
            </div>

            <div className="rounded-2xl border border-line p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-300" checked={near} onChange={(e) => setNear(e.target.checked)} />
                <span>
                  <span className="block text-sm font-bold">I want to be near someone</span>
                  <span className="block text-xs text-muted">Family or friends in another coach or bay? Tell us where they sit.</span>
                </span>
              </label>
              {near && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="wantCoach">
                      Their coach
                    </label>
                    <input id="wantCoach" className="input font-mono uppercase" placeholder={`e.g. ${normalizeCoach(coach) || CLASS_INFO[cls].coachPrefix + "4"}`} value={wantCoach} maxLength={4} onChange={(e) => setWantCoach(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
                  </div>
                  <div>
                    <label className="label" htmlFor="nearSeat">
                      Their seat number <span className="font-normal text-muted">(optional)</span>
                    </label>
                    <input id="nearSeat" type="number" className="input font-mono" placeholder="e.g. 17" value={nearSeat} min={1} onChange={(e) => setNearSeat(e.target.value.replace(/\D/g, "").slice(0, 3))} />
                  </div>
                </div>
              )}
            </div>

            {pGender === "F" && (
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-line text-violet-600 focus:ring-violet-300" checked={womenOnly} onChange={(e) => setWomenOnly(e.target.checked)} />
                <span>
                  <span className="block text-sm font-bold text-violet-900">Swap with women passengers only</span>
                  <span className="block text-xs text-violet-800/80">Only listings by women passengers will match yours, and only they can send you requests.</span>
                </span>
              </label>
            )}

            <div>
              <label className="label" htmlFor="note">
                A line for your co-passengers <span className="font-normal text-muted">(optional, but it really helps)</span>
              </label>
              <textarea id="note" className="input min-h-24 resize-y" maxLength={280} placeholder="e.g. Travelling with my 70-year-old mother, she can't climb to the upper berth." value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {NOTE_IDEAS.map((idea) => (
                  <button key={idea} type="button" className="chip py-1 text-xs" onClick={() => setNote((n) => (n ? `${n} ${idea}.` : `${idea}.`))}>
                    + {idea}
                  </button>
                ))}
              </div>
              <p className="hint text-right">{note.length}/280</p>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 3 && cls && berth && (
          <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-extrabold tracking-tight">Looks right?</h1>
              <p className="mt-1 text-sm text-muted">This is how co-passengers will see your listing. Your exact berth number stays hidden until a swap is agreed.</p>
            </header>

            <div className="rounded-2xl border border-line bg-canvas p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Journey</p>
              <p className="mt-1 font-bold">
                <span className="font-mono">{trainNo}</span> {trainName && `· ${trainName}`}
              </p>
              <p className="text-sm text-slate-600">
                {formatDate(date)} · {from} → {to} · PNR ending {pnr.slice(-4)}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="card p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">You have</p>
                  <div className="mt-2 flex items-center gap-3">
                    <BerthDiagram cls={cls} berth={berth} size={64} className="rounded-lg" />
                    <div>
                      <div className="flex flex-wrap gap-1.5">
                        <ClassBadge cls={cls} />
                        <BerthBadge berth={berth} />
                        {verified && <VerifiedBadge />}
                      </div>
                      <p className="mt-1 font-bold">Coach {normalizeCoach(coach)}</p>
                      <p className="text-xs text-muted">
                        {pName.split(" ")[0]}
                        {pAge ? `, ${pAge}` : ""} {pGender}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">You want</p>
                  <p className="mt-2 font-semibold">{wantBerths.length ? wantBerths.map((b) => BERTH_INFO[b].label).join(" / ") : "Any berth"}</p>
                  {near && (
                    <p className="text-sm text-slate-600">
                      Near {normalizeCoach(wantCoach)}
                      {nearSeat ? `-${nearSeat}` : ""}
                    </p>
                  )}
                  {womenOnly && <span className="badge tone-violet mt-2">Women only</span>}
                  {note && <p className="mt-2 text-sm italic text-slate-600">&ldquo;{note}&rdquo;</p>}
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-300" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
              <span className="text-sm">
                These details match my ticket. I understand SeatBadlo only connects co-passengers, the swap itself happens on board with the TTE informed, and no money changes hands.
              </span>
            </label>
          </div>
        )}

        {err && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{err}</p>}

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button type="button" className="btn-secondary" onClick={back} disabled={busy}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <Link href={trainNo ? boardHref : "/"} className="btn-ghost">
              Cancel
            </Link>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn-primary" onClick={next} disabled={pnrState.kind === "looking"}>
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" className="btn-accent btn-lg" onClick={publish} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Publish & find matches
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
