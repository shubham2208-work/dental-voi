# Dental VOI backend — from planning to implementation

This document records the full arc: why we added a backend, what we decided, what was built, and how to finish wiring it in Supabase.

---

## 1. Where we started

### Product before backend

The **Dental VOI Form and Extractor** (`dental-voi`) was a **frontend-only** React app:

- Staff paste insurance text → **Extract** fills the form.
- **Copy summary**, **Print/PDF**, **Reset** — all in the browser.
- Copy on the page stated that records stay in the session only and nothing is sent to a server.

The form already had the fields we need for identity and visits ([`src/lib/fields.ts`](src/lib/fields.ts)):

| Form field | Meaning |
|------------|---------|
| `office` | Office name (part of stable patient identity) |
| `patid` | Patient / chart ID |
| `pat`, `patdob` | Patient name and DOB (search path 1) |
| `subid` | Subscriber / member ID (search path 2) |
| `date` | **Date of service (DOS)** for this VOI record |

Full snapshot shape: [`VoiFormValues`](src/types.ts) (benefits, coinsurance, procedures table, notes, etc.).

The app is linked from the portfolio as a live demo ([GitHub Pages](https://shubham2208-work.github.io/dental-voi/) / portfolio cards).

---

## 2. What you asked for (requirements)

You wanted to **store patient data** with these rules:

1. **One logical patient** → one stable ID derived from **Patient ID** (`patid`), scoped with office (one key per patient per office).
2. **Save** the full form whenever staff save — keyed by patient + **DOS** (`date`).
3. **Search and fetch**:
   - By **patient name + date of birth**, or
   - By **member ID** (`subid`) alone.
4. **Multiple visits**: same patient can have many saved forms (one row per DOS).
5. **On fetch**: if several past DOS exist, show a list and let the user **choose which visit** to open and edit.
6. **Re-save**: same patient + same DOS **updates** that visit; a new DOS creates a new visit row.

---

## 3. Planning phase

### Stack choice

| Option | Decision |
|--------|----------|
| Database | **Supabase (Postgres)** — free tier, JSONB for full form snapshots |
| Auth | **Shared office PIN** (not individual accounts) — suitable for portfolio demo |
| API shape | **Edge Functions as BFF** — service role in functions; no direct client DB access |
| Frontend | Keep **Vite + React**; add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only |

Constraints called out in the plan:

- **Portfolio / demo only** — fake patients; real PHI would need HIPAA/BAA and stronger controls.
- **Out of v1**: fuzzy search, audit log, multi-tenant offices, server-side full Zod parity (basic validation on save).

### Data model (planned)

**`patients`**

- `patient_key` = hash(normalize(`office`) + `"|"` + normalize(`patid`)) — unique.
- Denormalized `pat`, `patdob`, `subid` for search and display.

**`voi_visits`**

- One row per `(patient_id, date_of_service)`.
- `form_data` JSONB = entire `VoiFormValues`.
- Unique constraint → upsert on save for the same DOS.

### User flows (planned)

```text
Save  → PIN (if needed) → upsert patient → upsert visit for DOS

Search → PIN → name+DOB OR subid
       → 0 results | 1 patient | pick among patients (member ID)
       → list visits (newest DOS first)
       → 0 | 1 auto-load | DOS picker if many
       → load form into react-hook-form
```

---

## 4. What we implemented

All items below live in the **`dental-voi`** repo (sibling to `portfolio` on disk).

### 4.1 Database migration

- [`supabase/migrations/001_patients_visits.sql`](supabase/migrations/001_patients_visits.sql)
  - Tables `patients`, `voi_visits`
  - Unique `patient_key`, unique `(patient_id, date_of_service)`
  - RLS enabled, **no public policies** (functions use service role)

### 4.2 Edge Functions

| Function | Role |
|----------|------|
| `verify_pin` | Check `OFFICE_PIN`; return short-lived HMAC JWT; rate-limit attempts |
| `search_patients` | `{ pat, patdob }` or `{ subid }` |
| `list_visits` | Visits for a patient, newest DOS first |
| `get_visit` | Full `form_data` for one visit |
| `save_visit` | Upsert patient + visit from full form JSON |

Shared code: [`supabase/functions/_shared/`](supabase/functions/_shared/) (auth, CORS, patient key, normalize, Supabase admin client).

Config: [`supabase/config.toml`](supabase/config.toml).

### 4.3 Patient key (client + server)

- Client: [`src/lib/patientKey.ts`](src/lib/patientKey.ts) + tests in [`src/lib/patientKey.test.ts`](src/lib/patientKey.test.ts)
- Server: same algorithm in [`supabase/functions/_shared/patientKey.ts`](supabase/functions/_shared/patientKey.ts)
- Save requires **Office name** and **Patient ID**

### 4.4 Frontend API layer

- [`src/lib/api/client.ts`](src/lib/api/client.ts) — invoke functions, attach Bearer token
- [`src/lib/api/session.ts`](src/lib/api/session.ts) — token in `sessionStorage`
- [`src/lib/api/types.ts`](src/lib/api/types.ts)
- [`src/lib/usePatientRecords.ts`](src/lib/usePatientRecords.ts) — search → patient picker → DOS picker → load/save orchestration

### 4.5 UI

| Component | Purpose |
|-----------|---------|
| [`OfficePinGate.tsx`](src/components/OfficePinGate.tsx) | PIN modal |
| [`PatientSearchPanel.tsx`](src/components/PatientSearchPanel.tsx) | Name+DOB or member ID; multi-patient picker |
| [`DosPickerDialog.tsx`](src/components/DosPickerDialog.tsx) | Choose which DOS to open |

[`App.tsx`](src/App.tsx):

- **Search patient** (left rail, when backend env is set)
- **Save to database** (form actions)
- Updated demo notice (database vs session-only)
- Optional loaded patient/visit id hint

Backend features are **hidden** until `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set ([`.env.example`](.env.example)).

### 4.6 Documentation and quality

| File | Purpose |
|------|---------|
| [`BACKEND.md`](BACKEND.md) | Supabase setup, secrets, deploy, API summary |
| [`SETUP_STEPS.md`](SETUP_STEPS.md) | Numbered checklist from local dev → live deploy |
| This file | Planning → delivery narrative |

**Tests:** `npm test` — 99 tests passing (including patient key).  
**Build:** `npm run build` — succeeds.

---

## 5. Architecture (as built)

```text
┌─────────────────────────────────────────────────────────┐
│  Browser (Dental VOI — Vite/React)                       │
│  Search · DOS picker · Form · Save                       │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS + Bearer (office JWT)
                            │ + Supabase anon key (gateway)
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase Edge Functions                                 │
│  verify_pin · search_patients · list_visits              │
│  get_visit · save_visit                                  │
└───────────────────────────┬─────────────────────────────┘
                            │ service role
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Postgres                                                │
│  patients (patient_key) · voi_visits (form_data JSONB)   │
└─────────────────────────────────────────────────────────┘
```

---

## 6. End state — what is done vs what you still run

### Done in git (implementation complete)

- Schema, functions, client, UI, tests, build, docs.

### Not automatic (your Supabase / hosting steps)

These are **one-time** per environment — see [`SETUP_STEPS.md`](SETUP_STEPS.md):

1. Create Supabase project and run migration SQL.
2. Set `OFFICE_PIN` (and optional `OFFICE_JWT_SECRET`) as function secrets.
3. Deploy all five Edge Functions (Supabase CLI).
4. Add `VITE_SUPABASE_*` to `.env.local` (dev) and Vercel/GitHub Pages (production).
5. Smoke test: save → second DOS → search → pick DOS → edit → save.
6. Redeploy the static app so the live demo gets Search/Save.

Until step 4, the app behaves like before: **session-only**, no database buttons.

---

## 7. Related portfolio work (context)

During the same period, the **portfolio** site was updated separately:

- Added **Dental VOI form and Extractor** project card with animated thumbnail.
- Deployed to [shubhamsharma-dev.vercel.app](https://shubhamsharma-dev.vercel.app/).
- Fixed overlay **Open app** click stacking on the VOI card.

That is **marketing/linking** only; the backend lives entirely in **`dental-voi`**.

---

## 8. Quick reference — important paths

```text
dental-voi/
├── BACKEND_JOURNEY.md          ← this file
├── BACKEND.md                  ← operator reference
├── SETUP_STEPS.md              ← go-live checklist
├── .env.example
├── supabase/
│   ├── migrations/001_patients_visits.sql
│   └── functions/              ← Edge Functions
└── src/
    ├── App.tsx
    ├── lib/patientKey.ts
    ├── lib/usePatientRecords.ts
    ├── lib/api/
    └── components/OfficePinGate.tsx, PatientSearchPanel.tsx, DosPickerDialog.tsx
```

---

## 9. Summary

| Phase | Status |
|-------|--------|
| Requirements (save, search, multi-DOS, patient key) | Defined |
| Plan (Supabase + PIN + BFF functions) | Approved |
| Implementation (DB, API, UI, tests) | **Complete in repo** |
| Supabase project + deploy + env on live site | **Your steps** ([SETUP_STEPS.md](SETUP_STEPS.md)) |

The backend journey **ends in code** at a production-ready demo stack; it **ends in production** once you connect your Supabase project and env vars to the deployed app.
