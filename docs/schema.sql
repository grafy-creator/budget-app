-- ====================================================================
-- Budget App — Schéma Supabase (PostgreSQL)
-- ====================================================================
-- À exécuter dans l'éditeur SQL Supabase (SQL Editor > New query).
-- Toutes les tables sont liées à auth.users via user_id et protégées par
-- Row Level Security : chaque utilisatrice ne voit que ses propres données.
-- ====================================================================

-- Types ---------------------------------------------------------------
create type transaction_type as enum ('depense', 'revenu', 'epargne');
-- Sous-type de revenu : distingue salaire fixe (alternance) et freelance.
create type income_subtype as enum ('fixe', 'freelance');

-- Catégories ----------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  nom         text not null,
  icone       text,                          -- emoji ou identifiant d'icône
  couleur     text,                          -- hex (charte)
  budget      numeric(10, 2) default 0,      -- enveloppe allouée / mois
  type        transaction_type not null default 'depense',
  cree_le     timestamptz not null default now()
);

-- Récurrences (charges fixes : loyer, abonnements…) -------------------
create table public.recurrences (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  libelle     text not null,
  montant     numeric(10, 2) not null,
  jour_du_mois smallint not null check (jour_du_mois between 1 and 31),
  categorie_id uuid references public.categories (id) on delete set null,
  icone       text,
  actif       boolean not null default true,
  cree_le     timestamptz not null default now()
);

-- Transactions --------------------------------------------------------
create table public.transactions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  montant        numeric(10, 2) not null,
  type           transaction_type not null,
  sous_type      income_subtype,             -- pour les revenus uniquement
  categorie_id   uuid references public.categories (id) on delete set null,
  date_operation date not null default current_date,
  source         text,                       -- ex : nom du client (freelance)
  note           text,
  tags           text[] default '{}',
  recurrence_id  uuid references public.recurrences (id) on delete set null,
  payee          boolean not null default true, -- pour les charges du jour
  cree_le        timestamptz not null default now()
);

-- Comptes / objectifs d'épargne (Livret A, PEL…) ---------------------
create table public.savings_accounts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  nom              text not null,
  icone            text,
  solde            numeric(12, 2) not null default 0,
  objectif         numeric(12, 2),
  versement_mensuel numeric(10, 2) default 0,
  principal        boolean not null default false,
  cree_le          timestamptz not null default now()
);

-- Réglages (1 ligne par utilisatrice) --------------------------------
create table public.settings (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  revenu_cible     numeric(10, 2) default 0,
  -- Règle de répartition (ex : 50/30/20) en pourcentages.
  pct_besoins      smallint default 50,
  pct_envies       smallint default 30,
  pct_epargne      smallint default 20,
  rappel_quotidien boolean not null default false,
  maj_le           timestamptz not null default now()
);

-- Index utiles --------------------------------------------------------
create index transactions_user_date_idx
  on public.transactions (user_id, date_operation desc);
create index categories_user_idx on public.categories (user_id);
create index recurrences_user_idx on public.recurrences (user_id);
create index savings_user_idx on public.savings_accounts (user_id);

-- ====================================================================
-- Row Level Security
-- ====================================================================
alter table public.categories       enable row level security;
alter table public.recurrences      enable row level security;
alter table public.transactions     enable row level security;
alter table public.savings_accounts enable row level security;
alter table public.settings         enable row level security;

-- Politique générique : l'utilisatrice ne manipule que ses lignes.
-- (une policy "for all" couvre select/insert/update/delete)
create policy "categories_owner" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recurrences_owner" on public.recurrences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_owner" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "savings_owner" on public.savings_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "settings_owner" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ====================================================================
-- Création automatique des réglages à l'inscription
-- ====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
