-- ====================================================================
-- Budget App — Migration 002 : historique des charges + prévu par catégorie
-- ====================================================================
-- NON DESTRUCTIF : ne supprime AUCUNE donnée existante.
-- À exécuter UNE FOIS dans Supabase : SQL Editor > New query > coller > Run.
-- Pré-requis : le schéma v2 (schema.sql) est déjà en place.
-- ====================================================================

-- 1) Prévu mensuel par catégorie (ex : Courses 200 €, Shopping 100 €) -----
alter table public.categories
  add column if not exists budget numeric(10, 2) not null default 0;

-- 2) Paiement des charges fixes, mois par mois (historique) ---------------
create table if not exists public.charge_payments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  charge_id  uuid not null references public.charges (id) on delete cascade,
  month      text not null,                 -- 'YYYY-MM'
  paid       boolean not null default false,
  amount     numeric(10, 2),                -- montant réel ce mois ; null = montant du modèle
  created_at timestamptz not null default now(),
  unique (charge_id, month)
);

create index if not exists charge_payments_user_idx
  on public.charge_payments (user_id, month);

alter table public.charge_payments enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'charge_payments'
      and policyname = 'charge_payments_owner'
  ) then
    create policy "charge_payments_owner" on public.charge_payments
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
