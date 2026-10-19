-- Dental VOI demo: patients and per-DOS visit snapshots
-- Access via Edge Functions (service role); RLS denies anon/authenticated direct access.

create extension if not exists "pgcrypto";

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  patient_key text not null,
  patid text not null default '',
  pat text not null default '',
  patdob date,
  subid text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patients_patient_key_unique unique (patient_key)
);

create index if not exists patients_subid_lower_idx on public.patients (lower(trim(subid)))
  where trim(subid) <> '';

create index if not exists patients_pat_patdob_idx on public.patients (lower(trim(pat)), patdob);

create table if not exists public.voi_visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  date_of_service date not null,
  form_data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint voi_visits_patient_dos_unique unique (patient_id, date_of_service)
);

create index if not exists voi_visits_patient_dos_idx on public.voi_visits (patient_id, date_of_service desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists patients_updated_at on public.patients;
create trigger patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

drop trigger if exists voi_visits_updated_at on public.voi_visits;
create trigger voi_visits_updated_at
  before update on public.voi_visits
  for each row execute function public.set_updated_at();

alter table public.patients enable row level security;
alter table public.voi_visits enable row level security;

-- No policies: client uses Edge Functions with service role only.
