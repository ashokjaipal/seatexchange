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
| PNR (10 digits) | yes | Fetches the ticket from IRCTC PNR status (train, date, stations, class, coach, berth), proves the seat is real, prevents the same seat being listed twice. Stored as a salted hash plus last 4 digits. Never displayed. |
| Train number | yes | Defines the "room". Works even for trains not in our list. |
| Boarding date | yes | Defines the "room". |
| Boarding and destination stations | yes | Two passengers on the same train may overlap for only part of the route. Shown on cards and flagged in matching. |
| Class | yes | Swaps are only meaningful within the same class (fare differences otherwise). Enforced. |
| Coach + berth number | yes (from PNR) | The seat itself. Also drives "near my family" matching by bay. The number is hidden from other users until a swap is accepted. |
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

**Demo mode** (automatic while no SMS provider is configured):

- OTP is always `123456` and is shown on the login screen.
- Log in as any 10-digit number to create a fresh account, or as a demo user to see the other side of a swap: `9000000001` (Priya), `9000000002` (Rahul, has a pending request), `9000000009` (Kavita, has an accepted swap).
- Demo PNRs that auto-fill the wizard: `4512345678`, `2231456789`, `8801234567`.

Other scripts: `npm run build`, `npm start`, `npm run typecheck`, `npm run db:reset` (wipe and re-seed).

Copy `.env.example` to `.env` and set `SESSION_SECRET` before deploying.

### OTP login

Three ways to deliver the login OTP, chosen automatically in this order:

1. **Demo mode**: `NEXT_PUBLIC_DEMO_MODE=true`, or nothing else configured. Fixed OTP `123456`, shown on screen.
2. **Your own SMS provider**: set `SMS_PROVIDER` (table below). The server generates and checks the code.
3. **Firebase Phone Authentication** (default when the Firebase web config is present, which it is). Implemented exactly as the Firebase "Authenticate with Firebase on the web using a phone number" guide:
   - `RecaptchaVerifier` (invisible) mounted on `#recaptcha-container` in the login form, reset after a failed send since reCAPTCHA tokens are single-use
   - `signInWithPhoneNumber(auth, "+91" + mobile, verifier)` → `confirmationResult.confirm(code)`
   - `auth.useDeviceLanguage()` so reCAPTCHA and the SMS text follow the phone's language
   - the ID token is verified server-side with the Admin SDK before a SeatBadlo session is created; the phone number is taken from the token, never from the form
   - errors from the SDK (`auth/invalid-verification-code`, `auth/code-expired`, `auth/too-many-requests`, `auth/unauthorized-domain`, ...) are mapped to plain-language messages

   **Project configuration (one-time).** Everything the guide asks you to click in the console is scripted:

   ```bash
   FIREBASE_SERVICE_ACCOUNT='<service account JSON>' npm run firebase:setup
   ```

   It enables Phone sign-in, adds the authorized domains (`localhost`, `seatexchange.vercel.app`, the Firebase Hosting domains), restricts SMS to India (`+91`) to stop SMS abuse from abroad, and registers fictional test numbers `+91 9000000001 / 02 / 09` with code `123456` so the demo accounts work in production without sending SMS. The same settings can be made by hand under *Authentication → Sign-in method → Phone* and *Authentication → Settings*.

   **Local testing without SMS.** `npm run firebase:emulators` starts the Auth + Firestore emulators. Run the app with `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 FIRESTORE_EMULATOR_HOST=localhost:8080 npm run dev`; verification codes appear in the emulator log and at `http://localhost:9099/emulator/v1/projects/seatexchange-94e8b/verificationCodes`.

   Free tier covers 10k verifications a month.

SMS providers:

| Provider | Env vars | Notes |
|---|---|---|
| `msg91` | `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID` | Create an OTP template in MSG91 with the `##OTP##` variable. Best deliverability for Indian numbers, DLT-registered. |
| `twilio` | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | Works worldwide; Indian DLT rules still apply to the sender. |
| `webhook` | `SMS_WEBHOOK_URL`, optional `SMS_WEBHOOK_TOKEN` | Posts `{mobile, message, otp}` as JSON to any endpoint you own (Fast2SMS, Kaleyra, a WhatsApp bridge). |

Built-in protections: 6-digit random codes, 10 minute expiry, codes stored only as salted hashes, 5 wrong attempts per code, 30 second resend cooldown, 5 sends per number per hour. `NEXT_PUBLIC_DEMO_MODE=true` forces the fixed demo OTP even with a provider configured (for staging).

### Firebase Analytics

Initialised in `src/components/FirebaseAnalytics.tsx` (browser only, logs `page_view` on every route change). Product events are sent through `track()` in `src/lib/firebase.ts`: `login`, `listing_created`, `swap_requested`, `swap_accept` / `swap_decline` / `swap_cancel` / `swap_complete`. Override the project with `NEXT_PUBLIC_FIREBASE_*` variables.

### PNR status (live IRCTC data)

Set `RAPIDAPI_KEY` from the RapidAPI "IRCTC" API (`irctc1.p.rapidapi.com`). With it:

- The listing wizard becomes PNR-first: enter the PNR and the train, date, stations, class, coach, berth number and berth type are fetched. The user only picks which passenger's seat to list (multi-passenger PNRs) and says what they want.
- The server re-fetches the PNR when a listing is created and uses the IRCTC data as the source of truth, so a client cannot claim a seat it does not hold. Such listings carry a **Verified** badge.
- RAC / waitlisted passengers cannot list until confirmed; cancelled trains are rejected; unknown PNRs are rejected with IRCTC's message.
- Lookups are cached for 10 minutes and require login, to protect your API quota.

Without a key, the demo PNRs still auto-fill, and every other PNR falls back to manual entry (unverified).

### Privacy of the berth number

Cards and listing pages show only the coach and berth type (for example "Lower berth, coach B2"). The exact berth number is revealed to the two passengers only after a swap request is accepted, together with the phone number.

### Deploying to Vercel

The app deploys to Vercel as is (framework preset: Next.js). Two things to know:

1. **Storage: Cloud Firestore.** Set `FIREBASE_SERVICE_ACCOUNT` to the service account JSON of project `seatexchange-94e8b` (Firebase console → Project settings → Service accounts → Generate new private key; paste the JSON, or base64 of it). Redeploy; the log line `[store] using firestore:cloud` confirms it. Without it the app falls back to Redis (if configured) or the temp directory, where data does not persist.
2. **Secrets.** Set `SESSION_SECRET` (any long random string) in *Settings → Environment Variables*. Leave `NEXT_PUBLIC_DEMO_MODE=true` until an SMS provider is wired in.

---

## 5b. Firebase backend

The backend is Firebase: **Authentication (Phone)** for login and **Cloud Firestore** for data, in project `seatexchange-94e8b` (web app `1:478450622890:web:9973655a01cde977efcbd3`).

**How the pieces fit**

- Browsers use the Firebase web SDK only for Phone Authentication and Analytics. They never read or write Firestore directly.
- The Next.js server uses the Firebase Admin SDK: it verifies Phone Auth ID tokens, then reads and writes Firestore on the user's behalf. This is what lets us hide berth numbers and phone numbers until a swap is accepted, run the request state machine, and verify PNRs server-side.
- Firestore collections (one document each): `users`, `listings`, `requests`, `notifications`, `otps`, plus `meta/db`. See the data model comment at the top of `firestore.rules`.
- `firestore.rules` is therefore **default deny** for clients. Verified on the emulator: unauthenticated reads return `PERMISSION_DENIED`, Admin SDK access works.

**One-time setup (needs your Firebase login, run from the repo root)**

```bash
npx -y firebase-tools@latest login              # or: login --no-localhost
npx -y firebase-tools@latest use seatexchange-94e8b
npx -y firebase-tools@latest deploy --only firestore   # creates the default database if needed, deploys rules + indexes
npx -y firebase-tools@latest deploy --only auth        # pushes the authorized domains from firebase.json
```

Then in the Firebase console:

1. *Authentication → Sign-in method → Phone → Enable* (phone sign-in cannot be enabled from the CLI).
2. Optional: *Phone numbers for testing* → add `+91 9000000001` / `+91 9000000002` with code `123456` so the demo accounts work on the live site.
3. *Project settings → Service accounts → Generate new private key* → paste the JSON into Vercel as `FIREBASE_SERVICE_ACCOUNT`.

`SEED_DEMO_DATA=false` starts an empty database with no demo users or listings.

**Local development against the emulator**

```bash
npx -y firebase-tools@latest emulators:start --only firestore --project seatexchange-94e8b
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run dev
```

**Scaling note.** The server keeps the working set in memory and re-reads Firestore every few seconds per instance, writing only changed documents in batches. That is simple and cheap at launch scale (thousands of listings). When a train board needs to scale beyond that, switch `activeListingsForTrain()` and friends to targeted queries; the composite indexes for those queries are already declared in `firestore.indexes.json`.

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
  db.ts store.ts         In-memory working set + adapters (Firestore via Admin SDK, Redis, JSON file)
  firebase-admin.ts      Admin SDK init (service account / ADC / emulator)
  auth.ts otp.ts pnr.ts  HMAC-signed session cookie, OTP issue/verify + auth mode, PNR lookup
  firebase.ts            Firebase web config, lazy app/auth/analytics, track()
  firebase-token.ts      Phone Auth ID token verification through the Admin SDK
  seed.ts                Demo data, dated relative to today
src/components/          UI (Tailwind, no component library)
```

---

## 7. Going to production

The MVP was built to be swapped piece by piece without touching the UI:

1. **Datastore.** Cloud Firestore through `src/lib/store.ts` (see section 5b). Move hot paths to targeted Firestore queries as traffic grows.
2. **SMS OTP.** Configure a provider as above (MSG91 recommended for India).
3. **PNR auto-fill.** Set `RAPIDAPI_KEY` as above. To use a different rail data vendor, adapt `mapIrctcResponse()` in `src/lib/pnr.ts`.
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
