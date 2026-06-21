-- ====================================================================
-- Budget App — Schéma Supabase (PostgreSQL) — v2 (aligné sur l'app)
-- ====================================================================
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run.
-- Sûr à ré-exécuter : on supprime d'abord les anciens objets (aucune
-- donnée à conserver au stade prototype).
-- Chaque table est liée à auth.users via user_id (défaut = auth.uid())
-- et protégée par Row Level Security : chacune ne voit que ses données.
-- ====================================================================

-- Nettoyage (ancien schéma + nouveau) --------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists public.transactions cascade;     -- ancien
drop table if exists public.recurrences cascade;       -- ancien
drop table if exists public.savings_accounts cascade;  -- ancien
drop table if exists public.categories cascade;
drop table if exists public.income_types cascade;
drop table if exists public.charges cascade;
drop table if exists public.variables cascade;
drop table if exists public.income cascade;
drop table if exists public.accounts cascade;
drop table if exists public.settings cascade;

drop type if exists transaction_type;
drop type if exists income_subtype;

-- Catégories de dépenses ---------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label      text not null,
  icon       text not null default '📦',
  created_at timestamptz not null default now()
);

-- Natures de revenu (ex : Fixe (alternance), Freelance) --------------
create table public.income_types (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label      text not null,
  created_at timestamptz not null default now()
);

-- Charges fixes / récurrentes ----------------------------------------
create table public.charges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label        text not null,
  icon         text not null default '🏠',
  day_of_month smallint not null default 1 check (day_of_month between 1 and 31),
  amount       numeric(10, 2) not null default 0,
  paid         boolean not null default false,
  due_today    boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Dépenses variables --------------------------------------------------
create table public.variables (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label       text not null,
  icon        text not null default '📦',
  category_id uuid references public.categories (id) on delete set null,
  amount      numeric(10, 2) not null default 0,
  date        date not null default current_date,
  created_at  timestamptz not null default now()
);

-- Revenus -------------------------------------------------------------
create table public.income (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label      text not null,
  source     text not null default '—',
  icon       text not null default '💰',
  type_id    uuid references public.income_types (id) on delete set null,
  amount     numeric(10, 2) not null default 0,
  date       date not null default current_date,
  created_at timestamptz not null default now()
);

-- Comptes d'épargne ---------------------------------------------------
create table public.accounts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label         text not null,
  icon          text not null default '🐷',
  badge         text,
  before_amount numeric(12, 2) not null default 0,
  added         numeric(12, 2) not null default 0,
  balance       numeric(12, 2) not null default 0,
  goal          numeric(12, 2) not null default 0,
  projection    text not null default '',
  created_at    timestamptz not null default now()
);

-- Réglages (1 ligne par utilisatrice) --------------------------------
create table public.settings (
  user_id      uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  revenu_cible numeric(10, 2) not null default 0,
  pct_besoins  smallint not null default 50,
  pct_envies   smallint not null default 30,
  pct_epargne  smallint not null default 20,
  reminder     boolean not null default true,
  updated_at   timestamptz not null default now()
);

-- Index ---------------------------------------------------------------
create index categories_user_idx   on public.categories (user_id, created_at);
create index income_types_user_idx on public.income_types (user_id, created_at);
create index charges_user_idx      on public.charges (user_id, created_at);
create index variables_user_idx    on public.variables (user_id, date desc);
create index income_user_idx       on public.income (user_id, date desc);
create index accounts_user_idx     on public.accounts (user_id, created_at);

-- ====================================================================
-- Row Level Security : chacune ne manipule que ses lignes
-- ====================================================================
alter table public.categories   enable row level security;
alter table public.income_types enable row level security;
alter table public.charges      enable row level security;
alter table public.variables    enable row level security;
alter table public.income       enable row level security;
alter table public.accounts     enable row level security;
alter table public.settings     enable row level security;

create policy "categories_owner" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "income_types_owner" on public.income_types
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "charges_owner" on public.charges
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "variables_owner" on public.variables
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "income_owner" on public.income
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "accounts_owner" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "settings_owner" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ====================================================================
-- À l'inscription : créer les réglages + des catégories et natures par défaut
-- ====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.settings (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.categories (user_id, label, icon) values
    (new.id, 'Courses', '🛒'),
    (new.id, 'Resto', '🍽️'),
    (new.id, 'Transport', '🚗'),
    (new.id, 'Santé', '💊'),
    (new.id, 'Loisirs', '🎮'),
    (new.id, 'Autre', '📦');

  insert into public.income_types (user_id, label) values
    (new.id, 'Fixe (alternance)'),
    (new.id, 'Freelance');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
