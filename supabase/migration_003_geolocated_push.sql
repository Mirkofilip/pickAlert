-- ============================================================
-- MIGRAZIONE 003 — Notifiche geolocalizzate
-- Esegui nel SQL Editor di Supabase
-- ============================================================

-- 1. Coordinate delle città, servono per calcolare quella più vicina
-- alla posizione reale del device (lato client, con formula haversine)
alter table public.cities
  add column if not exists lat double precision,
  add column if not exists lng double precision;

update public.cities set lat = 45.4642, lng = 9.1900 where slug = 'milano';
update public.cities set lat = 41.9028, lng = 12.4964 where slug = 'roma';
update public.cities set lat = 43.7696, lng = 11.2558 where slug = 'firenze';
update public.cities set lat = 40.8518, lng = 14.2681 where slug = 'napoli';
update public.cities set lat = 44.4949, lng = 11.3426 where slug = 'bologna';

-- 2. Un device deve avere UNA SOLA città attiva alla volta: se ti sposti,
-- la vecchia iscrizione va sovrascritta, non accumulata (altrimenti
-- continueresti a ricevere notifiche anche dalla città precedente).
alter table public.push_subscriptions drop constraint if exists push_subscriptions_device_token_city_id_key;
alter table public.push_subscriptions add constraint push_subscriptions_device_token_key unique (device_token);
