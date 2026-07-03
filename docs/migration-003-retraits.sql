-- ====================================================================
-- Budget App — Migration 003 : suivi des retraits d'épargne (« à rendre »)
-- ====================================================================
-- NON DESTRUCTIF : ne supprime AUCUNE donnée existante.
-- À exécuter UNE FOIS dans Supabase : SQL Editor > New query > coller > Run.
-- Pré-requis : schema.sql + migration 002 déjà en place.
-- ====================================================================

-- Retraits d'un compte d'épargne vers le compte principal (à rembourser) ----
create table if not exists public.withdrawals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  amount     numeric(12, 2) not null default 0,
  date       text not null,                 -- 'YYYY-MM-DD'
  note       text not null default '',
  repaid     boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists withdrawals_user_idx
  on public.withdrawals (user_id, date desc);

alter table public.withdrawals enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'withdrawals'
      and policyname = 'withdrawals_owner'
  ) then
    create policy "withdrawals_owner" on public.withdrawals
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
