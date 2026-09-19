# SeatBadlo

**Seat badlo, saath baitho.** A web platform for Indian Railways passengers to exchange seats and berths with co-passengers on the same train, before boarding.

Family split across coaches? Parents stuck on an upper berth? A kid who wants the window on the Vande Bharat? Today you ask around in the coach and hope. SeatBadlo moves that conversation to before the journey, matches you with the right co-passenger, and keeps everything private until both sides agree.

- **Stack:** Next.js 16 (App Router, TypeScript), Tailwind CSS 4, zero UI frameworks, JSON-file datastore (swappable), mobile-OTP login.
- **Status:** fully working MVP with demo data. Every screen and API in the journey below is implemented and tested end to end.

---

## 1. Product thinking

### Why this name

| Candidate | Verdict |
|---|---|
| **SeatBadlo** | Chosen. "Badlo" (बदलो) means *exchange it* in Hindi. It is an instruction, so the name itself tells a first-time user what to do. Two syllables + two syllables, easy to say on the phone, easy to type, works across Hindi-belt and non-Hindi metros because "seat" carries the meaning. `seatbadlo.in` / `seatbadlo.com` style domains are natural. |
| BerthSwap / SeatSwap | Clear but generic and English-only. Forgettable in a market where Zomato, Paytm, Zepto and Meesho win on distinct, vernacular-flavoured names. |
| AdlaBadli | Charming, but too regional and doesn't say "train". |
| SeatSaathi | Warm, but says "companion" not "exchange". |

Tagline **"Seat badlo, saath baitho"** ("swap the seat, sit together") states the number-one use case: families wanting to sit together.

### Who it is for (in priority order)

1. **Families and groups split up at booking** (late Tatkal, waitlist confirmations, multiple PNRs). This is the most common, most emotional case.
2. **Elderly or unwell passengers who need a lower berth** and the many young travellers who are happy to give one up.
3. **Chair-car travellers** (Shatabdi, Vande Bharat, Tejas) trading window and aisle.
4. **Women travelling alone** who want to sit near other women and control who can contact them.

### Principles that shaped the journey

- **The train + date is the room.** A swap is only possible with someone on the same train on the same day, so the whole product is organised around a "train board" rather than a global marketplace.
- **Browse without friction, act with identity.** Anyone can search a train and see what is available with no login. Login (mobile OTP, India-standard) is asked for only at the moment of listing or proposing, and the user is returned to exactly where they were.
- **Ask only what we can use.** Every field either powers matching, builds trust, or prevents abuse. Nothing else.
- **Privacy until agreement.** First name, age and seat are public. PNR is never shown. Phone number is revealed to both parties only after an accept.
- **No money, ever.** Swaps are goodwill. Removing payments removes fraud incentives and keeps the community warm.
- **Matches come to you.** Listing your seat is not the end of the journey; it is the start of notifications and a personalised, best-first board.

---

## 2. The user journey

```
Landing ──▶ Search train + date ──▶ Train board (public)
                                        │
                     ┌──────────────────┼──────────────────┐
                     ▼                                     ▼
              "List my seat"                      Tap a seat card
                     │                                     │
              (login if needed)                     (login if needed)
                     ▼                                     ▼
      4-step wizard: Journey → Your seat         Listing detail + "Propose a swap"
      → What you want → Review → Publish          (choose which of your seats to offer)
                     │                                     │
                     ▼                                     ▼
      Success: match count + share to WhatsApp     Request sent → other side notified
                     │                                     │
                     └──────────────┬──────────────────────┘
                                    ▼
                          Requests (Received / Sent)
                                    │
                        Accept ──▶ contact revealed, WhatsApp + call buttons
                                    │
                        "We swapped" ──▶ both listings closed
```

**Step by step**

1. **Landing.** One input (train number or name, with autocomplete over a bundled list of popular trains), one date, one button. Live counters and popular trains give a sense of activity.
2. **Train board** `/train/12951?date=2026-09-20`. Train header with route and departure, an 8-day date strip with live counts, filters by class / berth they have / berth they want, and cards for every seat up for swap. If you have a seat on this train the board sorts **best match first** and labels cards Perfect / Good / Possible with the reasons.
3. **List my seat** `/list`, a four-step wizard.
   - *Journey:* PNR (auto-fills train, date, stations, class and seat when a lookup is available), train, boarding date, boarding and destination stations.
   - *Your seat:* class, coach, berth number. The **berth type is auto-detected from the berth number** using Indian Railways' fixed bay numbering (e.g. 3A berth 7 = side lower), with an override. A small bay diagram shows the position.
   - *What you want:* one or more berth types (or "any"), optionally "near someone" (coach + seat), optional women-only, and a one-line note with quick-suggestion chips ("Travelling with elderly parent").
   - *Review and publish:* a preview of the exact card others will see and a consent line. On publish we notify every co-passenger whose wish this seat fulfils and show how many matches already exist.
4. **Listing detail** `/listing/:id`. Big seat card, wants, note, "why this could work" reasons, and a propose panel that lets you pick which of your seats to offer with a pre-written message.
5. **Requests** `/requests`. Received and Sent tabs. Accept, decline, cancel. Accepting auto-declines other pending requests on both seats, reveals contacts on both sides, and offers WhatsApp and call shortcuts. "We swapped" closes both listings.
6. **My seats** `/my-seats`. Every listing with status, match count, pending requests, share, remove, or mark as swapped. Listings expire automatically after the journey date.
7. **Notifications.** In-app bell (polled) for new requests, accepts, declines and "a seat you might want just got listed".

---

## 3. What we ask for, and why

| Field | Required | Why it exists |
|---|---|---|
| Mobile number | yes | Identity, OTP login, contact after acceptance. Indian users expect this over email. |
| Name | yes | Trust. Only the first name is shown publicly. |
| Gender | optional | Enables the women-only preference. Helps others understand a need. |
| PNR (10 digits) | yes | Proves the seat is real, prevents the same seat being listed twice, enables auto-fill. Stored as a salted hash plus last 4 digits. Never displayed. |
| Train number | yes | Defines the "room". Works even for trains not in our list. |
| Boarding date | yes | Defines the "room". |
| Boarding and destination stations | yes | Two passengers on the same train may overlap for only part of the route. Shown on cards and flagged in matching. |
| Class | yes | Swaps are only meaningful within the same class (fare differences otherwise). Enforced. |
| Coach + berth number | yes | The seat itself. Also drives "near my family" matching by bay. |
| Berth type | yes (auto-detected) | The thing people actually trade. Lower / Middle / Upper / Side lower / Side upper (+ Side middle in 3E), or Window / Middle / Aisle in sitting classes. |
| Passenger age | optional | Signals need ("68 yrs" says a lot). |
| Wants: berth types | optional | Empty means "any", which is common when the main goal is sitting together or simply helping. |
| Wants: near coach + seat | optional | Turns "I want to be with my family in S4" into a matchable preference. |
| Wants: women only | optional | Safety. Enforced in matching and in the request API, not just displayed. |
| Note (280 chars) | optional | The human reason. Listings with a note convert far better. |

Deliberately **not** asked: full ticket photo, email, ID proof, exact fare, payment details.

---

## 4. Matching

`src/lib/matching.ts` scores a pair of listings on the same train, date and class:

- +2 if they have a berth type you want, +2 if you have one they want
- +2 if their seat is in the same or adjacent bay as the seat you want to be near, else +1 if just the right coach (and symmetric)
- +1 if boarding and destination are identical, otherwise a warning reason is attached
- Women-only preferences on either side that are not satisfied make the pair incompatible

Labels: **Perfect** when both sides get what they asked for, **Good** when you get what you asked for, **Possible** when only their wish is met (for example they will take anything). Reasons are rendered in plain language on cards and detail pages.

---

## 5. Running it

```bash
npm install
npm run dev       # http://localhost:3000
```

The app seeds itself with demo users, listings on popular trains for the next few days, and a couple of requests, so every screen is alive on first run.

**Demo mode** (default, `NEXT_PUBLIC_DEMO_MODE=true`):

- OTP is always `123456` and is shown on the login screen.
- Log in as any 10-digit number to create a fresh account, or as a demo user to see the other side of a swap: `9000000001` (Priya), `9000000002` (Rahul, has a pending request), `9000000009` (Kavita, has an accepted swap).
- Demo PNRs that auto-fill the wizard: `4512345678`, `2231456789`, `8801234567`.

Other scripts: `npm run build`, `npm start`, `npm run typecheck`, `npm run db:reset` (wipe and re-seed).

Copy `.env.example` to `.env` and set `SESSION_SECRET` before deploying.

---

## 6. Codebase map

```
src/app/                 App Router pages and API routes
  page.tsx               Landing
  train/[trainNo]/       Train board
  list/                  List-my-seat wizard
  listing/[id]/          Listing detail + propose swap
  requests/ my-seats/ profile/ login/ how-it-works/
  api/auth/*             send-otp, verify-otp, logout, me
  api/listings/*         list/create, get/update/withdraw, matches
  api/requests/*         create, accept/decline/cancel/complete
  api/notifications/*    inbox + mark read
  api/trains/search      autocomplete
  api/pnr/[pnr]          PNR auto-fill (demo lookup, see below)
src/lib/
  rail.ts                Class/berth rules, berth-type derivation from berth number, validators
  trains.ts              Bundled dataset of ~110 popular trains + search
  matching.ts            Scoring and labels
  listings.ts            Public serialisers (never leak PNR hash / full names)
  db.ts                  JSON-file store with atomic writes and auto-expiry
  auth.ts otp.ts pnr.ts  HMAC-signed session cookie, OTP issue/verify, PNR hashing + lookup
  seed.ts                Demo data, dated relative to today
src/components/          UI (Tailwind, no component library)
```

---

## 7. Going to production

The MVP was built to be swapped piece by piece without touching the UI:

1. **Datastore.** `src/lib/db.ts` is the only module that touches disk. Replace `getDb()` / `mutate()` with Postgres (Prisma or Drizzle) for multi-instance deploys. The types in `src/lib/types.ts` map 1:1 to tables.
2. **SMS OTP.** Implement `sendSms()` in `src/lib/otp.ts` with MSG91 / Kaleyra / Twilio and set `NEXT_PUBLIC_DEMO_MODE=false`.
3. **PNR auto-fill.** `lookupPnr()` in `src/lib/pnr.ts` currently answers only demo PNRs. Wire an official or partner rail API there; the wizard already handles found / not-found, and multi-passenger PNRs.
4. **Train data.** `src/lib/trains.ts` is a curated sample. Replace with a full schedule feed; the board already works for unknown train numbers.
5. **Notifications.** `pushNotification()` in `src/lib/notify.ts` is the single hook. Add WhatsApp Business / SMS / web push there.
6. **Trust and safety.** Add report-user, rate limits per mobile, and a simple admin view. Session cookies are HttpOnly + SameSite=Lax; set `SESSION_SECRET`.

### Roadmap ideas

- Group listings: list all seats on one PNR at once and ask for "all of us together".
- Reputation: count of completed swaps on the profile, shown on cards.
- Chart-time nudge: when the chart is prepared (4 hours before departure), remind everyone still unmatched on that train.
- Vernacular UI (Hindi, Tamil, Telugu, Bengali, Marathi) driven by the phone's language.
- TTE mode: a read-only board per coach to ease on-board coordination.
- Monetisation without hurting the community: sponsored travel essentials, station cab partners, optional "boost" for time-critical listings.

---

## Disclaimer

SeatBadlo is a community tool and is not affiliated with Indian Railways or IRCTC. Seat exchanges are voluntary arrangements between passengers; tickets always remain in the original passengers' names and the on-board TTE should be informed.
