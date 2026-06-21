import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase navigateur (singleton). Les requêtes passent par le domaine
 * de l'app (`/sb/*`, reverse-proxy défini dans next.config.ts) au lieu de
 * supabase.co directement → contourne les blocages réseau (VPN, filtres) qui ne
 * visent que ce domaine. Session persistée en localStorage (jeton attaché à
 * chaque requête). Sécurité assurée par les politiques RLS côté base.
 */
let client: ReturnType<typeof createSupabaseClient> | undefined;

function baseUrl() {
  if (typeof window !== "undefined") return `${window.location.origin}/sb`;
  // Côté serveur (non utilisé en pratique) : URL directe.
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function createClient() {
  if (!client) {
    client = createSupabaseClient(
      baseUrl(),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "budget-app-auth",
        },
      },
    );
  }
  return client;
}
