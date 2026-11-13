-- Apply after schema.sql, migration_002_features.sql, migration_003_geolocated_push.sql
-- and fix_rls_recursion.sql. Review before production deployment.
begin;

create table if not exists public.app_settings (
 id boolean primary key default true check (id),
 report_lifetime_hours integer not null default 4 check (report_lifetime_hours between 1 and 48)
);
insert into public.app_settings(id,report_lifetime_hours) values(true,4) on conflict(id) do update set report_lifetime_hours=4;
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon,authenticated;
grant select on public.app_settings to anon,authenticated;
drop policy if exists settings_public_read on public.app_settings;
create policy settings_public_read on public.app_settings for select using(true);

-- Roles are provisioned by the operator only, never by the public client.
drop policy if exists profiles_self_insert on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_public_read on public.profiles;
drop policy if exists profiles_self_read on public.profiles;
drop policy if exists profiles_moderator_read on public.profiles;
create policy profiles_moderator_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
revoke all on public.profiles from anon,authenticated;
grant select on public.profiles to authenticated;

-- No client identity, photo or GPS is attached to new reports.
alter table public.reports alter column lat drop not null;
alter table public.reports alter column lng drop not null;
alter table public.reports add column if not exists approved_at timestamptz;
alter table public.reports alter column expires_at set default (now()+interval '24 hours');
create or replace function public.enforce_report_lifecycle() returns trigger
language plpgsql security definer set search_path=public as $$
declare lifetime integer;
begin
 if TG_OP='INSERT' then
  new.status:='pending'; new.created_at:=now(); new.expires_at:=now()+interval '24 hours';
  new.approved_at:=null; new.user_id:=null; new.lat:=null; new.lng:=null;
  new.photo_url:=null; new.photo_blurred:=false;
 elsif new.status='approved' and old.status is distinct from 'approved' then
  select report_lifetime_hours into lifetime from public.app_settings where id=true;
  new.approved_at:=now(); new.expires_at:=now()+make_interval(hours=>coalesce(lifetime,4));
 elsif new.status='rejected' and old.status is distinct from 'rejected' then
  new.expires_at:=least(old.expires_at,now()+interval '24 hours');
 else
  new.approved_at:=old.approved_at; new.expires_at:=old.expires_at; new.created_at:=old.created_at;
 end if;
 if length(trim(coalesce(new.description,''))) not between 15 and 1500 then
  raise exception 'La descrizione deve contenere da 15 a 1500 caratteri';
 end if;
 if length(trim(coalesce(new.location_label,''))) not between 1 and 120 then
  raise exception 'Indica un luogo pubblico (massimo 120 caratteri)';
 end if;
 return new;
end $$;
drop trigger if exists enforce_report_lifecycle on public.reports;
create trigger enforce_report_lifecycle before insert or update on public.reports for each row execute function public.enforce_report_lifecycle();
drop trigger if exists trg_increment_report_count on public.reports;
revoke all on public.reports from anon,authenticated;
grant select on public.reports to anon,authenticated;
grant insert(city_id,description,location_type,location_label,aggression_level,armed,group_size) on public.reports to anon,authenticated;
grant update(status,description,city_id),delete on public.reports to authenticated;
drop policy if exists reports_insert_any on public.reports;
create policy reports_insert_any on public.reports for insert to anon,authenticated with check(status='pending' and user_id is null and photo_url is null and lat is null and lng is null);
drop policy if exists reports_read_public on public.reports;
create policy reports_read_public on public.reports for select using((status='approved' and expires_at>now()) or public.is_moderator());

-- Disable unused public upload and device subscription APIs. Existing data is retained.
drop policy if exists anyone_upload_report_photos on storage.objects;
drop policy if exists public_read_report_photos on storage.objects;
update storage.buckets set public=false where id='report-photos';
revoke all on public.push_subscriptions from anon,authenticated;
revoke insert,update,delete on public.report_tags from anon,authenticated;

do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='reports') then
  alter publication supabase_realtime add table public.reports;
 end if;
end $$;
-- Keep the existing database cleanup schedule. Its expiry now follows this lifecycle.
commit;
