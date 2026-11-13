-- ============================================================
-- MIGRAZIONE 002 — Dettagli segnalazione, ruolo publisher,
-- contatore segnalazioni, profili pubblici in lettura
-- Esegui nel SQL Editor di Supabase
-- ============================================================

-- 1. Nuovi campi sulla segnalazione
alter table public.reports
  add column if not exists aggression_level text not null default 'moderato'
    check (aggression_level in ('aggressivo', 'moderato', 'calmo')),
  add column if not exists armed boolean not null default false,
  add column if not exists group_size smallint
    check (group_size is null or (group_size between 1 and 10)),
  add column if not exists location_type text
    check (location_type in ('stazione_treni', 'metro', 'citta', 'altro')),
  add column if not exists location_label text;

-- 2. Ruolo "publisher" per utenti registrati (segnalano come gli anonimi,
-- ma la loro segnalazione mostra nickname + stellina + conteggio)
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'publisher', 'moderator', 'admin'));

alter table public.profiles alter column role set default 'publisher';

-- 3. Contatore segnalazioni approvate per profilo
alter table public.profiles
  add column if not exists report_count integer not null default 0;

create or replace function public.increment_report_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' and new.user_id is not null then
    update public.profiles set report_count = report_count + 1 where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_increment_report_count on public.reports;
create trigger trg_increment_report_count
after update on public.reports
for each row execute function public.increment_report_count();

-- 4. Rendi i profili leggibili pubblicamente (servono nickname + stellina
-- sulle card delle segnalazioni). Non ci sono dati sensibili in profiles
-- (niente email, che resta protetta in auth.users).
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_public_read" on public.profiles for select using (true);

-- 5. Collega automaticamente user_id alla segnalazione se l'autore è loggato
-- (il client lo passa già, ma questo è un fallback di sicurezza server-side
-- se in futuro serve un default)
