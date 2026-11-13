-- ============================================================
-- PickAlert — Schema Supabase completo
-- Esegui questo file nel SQL editor del tuo progetto Supabase
-- ============================================================

-- Estensioni necessarie
create extension if not exists "uuid-ossp";
create extension if not exists pg_cron;
create extension if not exists postgis; -- opzionale, utile se in futuro vuoi query geo avanzate

-- ============================================================
-- TABELLE
-- ============================================================

create table if not exists public.cities (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  region text,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz default now()
);

create table if not exists public.pattern_tags (
  id uuid primary key default uuid_generate_v4(),
  label text not null,
  description text,
  city_id uuid references public.cities(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  city_id uuid not null references public.cities(id),
  lat double precision not null,
  lng double precision not null,
  description text,
  photo_url text,
  photo_blurred boolean default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '3 hours')
);

create table if not exists public.report_tags (
  report_id uuid references public.reports(id) on delete cascade,
  pattern_tag_id uuid references public.pattern_tags(id) on delete cascade,
  primary key (report_id, pattern_tag_id)
);

create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  city_id uuid references public.cities(id) on delete cascade,
  device_token text not null,
  platform text check (platform in ('ios', 'android', 'web')),
  created_at timestamptz default now(),
  unique (device_token, city_id)
);

-- Indici utili
create index if not exists idx_reports_city_status on public.reports (city_id, status, expires_at);
create index if not exists idx_reports_expires on public.reports (expires_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.cities enable row level security;
alter table public.profiles enable row level security;
alter table public.pattern_tags enable row level security;
alter table public.reports enable row level security;
alter table public.report_tags enable row level security;
alter table public.push_subscriptions enable row level security;

-- Cities: lettura pubblica, scrittura solo admin
create policy "cities_read_all" on public.cities for select using (true);
create policy "cities_write_admin" on public.cities for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Profiles: ognuno vede/modifica il proprio, i moderatori vedono tutti
create policy "profiles_self_read" on public.profiles for select using (
  id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('moderator','admin'))
);
create policy "profiles_self_update" on public.profiles for update using (id = auth.uid());
create policy "profiles_self_insert" on public.profiles for insert with check (id = auth.uid());

-- Pattern tags: lettura pubblica, scrittura moderatori/admin
create policy "tags_read_all" on public.pattern_tags for select using (true);
create policy "tags_write_mod" on public.pattern_tags for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator','admin'))
);

-- Reports: lettura pubblica SOLO se approvato e non scaduto; l'autore vede la propria anche se pending
create policy "reports_read_public" on public.reports for select using (
  (status = 'approved' and expires_at > now())
  or user_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator','admin'))
);

-- Chiunque (anche anonimo, se abiliti l'auth anonima) può creare una segnalazione
create policy "reports_insert_any" on public.reports for insert with check (true);

-- Solo moderatori possono aggiornare status (approvazione/rifiuto)
create policy "reports_update_mod" on public.reports for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator','admin'))
);

create policy "reports_delete_mod" on public.reports for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator','admin'))
);

-- Report tags: lettura pubblica, scrittura legata a chi crea la segnalazione o moderatori
create policy "report_tags_read" on public.report_tags for select using (true);
create policy "report_tags_write" on public.report_tags for insert with check (true);
create policy "report_tags_delete_mod" on public.report_tags for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator','admin'))
);

-- Push subscriptions: ognuno gestisce solo le proprie
create policy "push_self" on public.push_subscriptions for all using (
  user_id = auth.uid() or user_id is null
);

-- ============================================================
-- CLEANUP AUTOMATICO (pg_cron)
-- Cancella le segnalazioni scadute ogni 15 minuti.
-- Nota: le foto associate su Storage vanno ripulite separatamente
-- (vedi supabase/functions/cleanup-expired per farlo anche su Storage).
-- ============================================================

select cron.schedule(
  'delete-expired-reports',
  '*/15 * * * *',
  $$ delete from public.reports where expires_at < now() $$
);

-- ============================================================
-- STORAGE BUCKET (crea anche da UI Supabase > Storage il bucket
-- "report-photos", impostato come pubblico in lettura)
--
-- NOTA IMPORTANTE: il flag "Public bucket" nella UI controlla SOLO
-- la lettura via URL pubblico. L'upload (INSERT) richiede comunque
-- policy RLS esplicite su storage.objects, altrimenti ogni caricamento
-- fallisce con "new row violates row-level security policy".
-- ============================================================

create policy "anyone_upload_report_photos"
on storage.objects for insert
with check (bucket_id = 'report-photos');

create policy "public_read_report_photos"
on storage.objects for select
using (bucket_id = 'report-photos');

-- Seed città di esempio
insert into public.cities (name, slug, region) values
  ('Milano', 'milano', 'Lombardia'),
  ('Roma', 'roma', 'Lazio'),
  ('Firenze', 'firenze', 'Toscana'),
  ('Napoli', 'napoli', 'Campania'),
  ('Bologna', 'bologna', 'Emilia-Romagna')
on conflict (slug) do nothing;
