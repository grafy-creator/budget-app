import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase navigateur (singleton). Session persistée en localStorage et
 * rafraîchie automatiquement → le jeton est attaché de façon fiable à toutes
 * les requêtes (lecture comme écriture). La sécurité repose sur les politiques
 * RLS côté base.
 */
let client: ReturnType<typeof createSupabaseClient> | undefined;

export function createClient() {
  if (!client) {
    client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: true, autoRefreshToken: true } },
    );
  }
  return client;
}
