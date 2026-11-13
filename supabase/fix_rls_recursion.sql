-- ============================================================
-- FIX: RLS ricorsiva su public.profiles
-- Esegui questo script nel SQL Editor di Supabase per correggere
-- l'errore 500 causato dalla ricorsione nelle policy.
-- ============================================================

-- 1. Funzione helper che verifica il ruolo bypassando la RLS
--    (SECURITY DEFINER = esegue con i permessi di chi l'ha creata,
--    non di chi la chiama, quindi non triggera di nuovo le policy)
create or replace function public.is_moderator()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 2. Rimuovi le vecchie policy ricorsive e ricreale usando le funzioni

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles for select using (
  id = auth.uid() or public.is_moderator()
);

drop policy if exists "cities_write_admin" on public.cities;
create policy "cities_write_admin" on public.cities for all using (
  public.is_admin()
);

drop policy if exists "tags_write_mod" on public.pattern_tags;
create policy "tags_write_mod" on public.pattern_tags for all using (
  public.is_moderator()
);

drop policy if exists "reports_read_public" on public.reports;
create policy "reports_read_public" on public.reports for select using (
  (status = 'approved' and expires_at > now())
  or user_id = auth.uid()
  or public.is_moderator()
);

drop policy if exists "reports_update_mod" on public.reports;
create policy "reports_update_mod" on public.reports for update using (
  public.is_moderator()
);

drop policy if exists "reports_delete_mod" on public.reports;
create policy "reports_delete_mod" on public.reports for delete using (
  public.is_moderator()
);

drop policy if exists "report_tags_delete_mod" on public.report_tags;
create policy "report_tags_delete_mod" on public.report_tags for delete using (
  public.is_moderator()
);
