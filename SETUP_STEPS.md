# Dental VOI backend — step-by-step

Follow these in order. The **code is already in this repo**; you are wiring Supabase and env vars.

---

## Step 1 — Confirm local app (no database yet)

```bash
cd dental-voi
npm install
npm test
npm run dev
```

Open http://localhost:5173 — form works; **Search patient** / **Save to database** stay hidden until Step 4.

---

## Step 2 — Create Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project** (free tier).
2. Wait for the database to finish provisioning.
3. Open **SQL Editor** → **New query**.
4. Paste the full contents of [`supabase/migrations/001_patients_visits.sql`](supabase/migrations/001_patients_visits.sql) → **Run**.

You should have tables `patients` and `voi_visits`.

---

## Step 3 — Set secrets and deploy Edge Functions

### 3a. Secrets

**Project Settings → Edge Functions → Secrets** (or via CLI):

| Name | Example |
|------|---------|
| `OFFICE_PIN` | `demo1234` |
| `OFFICE_JWT_SECRET` | (optional) long random string |

### 3b. Install CLI and deploy

```bash
brew install supabase/tap/supabase   # or see supabase.com/docs/guides/cli
cd dental-voi
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy verify_pin
supabase functions deploy search_patients
supabase functions deploy list_visits
supabase functions deploy get_visit
supabase functions deploy save_visit
```

`YOUR_PROJECT_REF` is in the project URL: `https://supabase.com/dashboard/project/<ref>`.

---

## Step 4 — Connect the frontend

1. Supabase **Settings → API** → copy **Project URL** and **anon public** key.
2. In `dental-voi`:

```bash
cp .env.example .env.local
```

3. Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Restart dev server: `npm run dev`.

You should see **Search patient** in the left rail and **Save to database** on the form.

---

## Step 5 — Smoke test in the browser

1. Fill **Office Name**, **Patient ID**, **Patient Name**, **Date** (DOS), and a few other fields.
2. Click **Save to database** → enter **OFFICE_PIN** when prompted → confirm success message.
3. Change **Date** to another day → **Save** again (same patient, second visit).
4. Click **Search patient** → search by name + DOB or **Sub. ID #** → if multiple DOS, pick one from the list → form loads.
5. Edit and **Save** again (same DOS updates that visit).

---

## Step 6 — Deploy the live app

**Vercel (recommended):** import `dental-voi` repo, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Environment Variables, deploy.

**GitHub Pages:** add the same vars to the Pages build workflow secrets, then rebuild.

Edge Functions stay on Supabase; only the Vite app needs the two `VITE_*` vars.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No Search / Save buttons | Missing or wrong `VITE_*` in `.env.local`; restart dev server |
| 401 Unauthorized | Wrong PIN or expired session; enter PIN again |
| Save fails “Office name and Patient ID” | Fill **Office Name** and **Patient ID** |
| CORS errors | Functions must be deployed on the same Supabase project as the URL in env |

More detail: [`BACKEND.md`](BACKEND.md).
