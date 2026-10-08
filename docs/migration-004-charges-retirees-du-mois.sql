-- ====================================================================
-- Budget App — Migration 004 : retirer une charge fixe d'UN SEUL mois
-- ====================================================================
-- NON DESTRUCTIF : ne supprime AUCUNE donnée existante.
-- À exécuter UNE FOIS dans Supabase : SQL Editor > New query > coller > Run.
-- Pré-requis : schema.sql + migrations 002 et 003 déjà en place.
-- ====================================================================

-- Une charge « retirée » pour un mois n'apparaît plus ce mois-là,
-- mais reste active les autres mois (la supprimer = Réglages).
alter table public.charge_payments
  add column if not exists skipped boolean not null default false;
