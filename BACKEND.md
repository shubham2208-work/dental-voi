# Dental VOI backend (Supabase)

Portfolio demo storage for patient VOI forms. **Use fake patients only** — not for real PHI without a BAA and full compliance review.

## What it does

- **Save** full form snapshots per **patient** (stable `patient_key` from office + chart ID) and **date of service**
- **Search** by patient name + DOB, or by subscriber/member ID
- **Load** a past visit; if multiple DOS exist, pick from a list

## 1. Create Supabase project

1. [supabase.com](https://supabase.com) → New project (free tier)
2. **SQL Editor** → run [`supabase/migrations/001_patients_visits.sql`](supabase/migrations/001_patients_visits.sql)

## 2. Edge Function secrets

In Supabase **Project Settings → Edge Functions → Secrets**:

| Secret | Purpose |
|--------|---------|
| `OFFICE_PIN` | Shared office PIN shown to demo users |
| `OFFICE_JWT_SECRET` | Optional; signs session tokens (defaults to `OFFICE_PIN` if unset) |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically when functions run in Supabase.

## 3. Deploy Edge Functions

Install [Supabase CLI](https://supabase.com/docs/guides/cli), link the project, then:

```bash
cd dental-voi
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy verify_pin
supabase functions deploy search_patients
supabase functions deploy list_visits
supabase functions deploy get_visit
supabase functions deploy save_visit
```

## 4. Frontend env

Copy `.env.example` to `.env.local`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Restart `npm run dev`.

## 5. Deploy the app

- **Vercel**: add the same `VITE_*` variables in Project → Settings → Environment Variables, then deploy.
- **GitHub Pages**: build with env vars in the workflow (secrets), or the app runs without DB buttons.

After deploy, open the app → **Search patient** or **Save to database** → enter **office PIN**.

## API (Edge Functions)

All authenticated routes expect `Authorization: Bearer <token>` from `verify_pin`.

| Function | Body |
|----------|------|
| `verify_pin` | `{ "pin": "..." }` |
| `search_patients` | `{ "pat", "patdob" }` or `{ "subid" }` |
| `list_visits` | `{ "patient_id" }` |
| `get_visit` | `{ "visit_id" }` |
| `save_visit` | full `VoiFormValues` JSON |

## Smoke test

1. Fill office, patient ID, patient name, date (DOS), save.
2. Change date, save again → two visits for one patient.
3. Search by member ID or name+DOB → pick DOS → form loads.
4. Edit and save same DOS → updates existing row.
