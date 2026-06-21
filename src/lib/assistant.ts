/**
 * Préférences locales de l'assistant d'ouverture (localStorage) — pas de
 * nouvelle table Supabase au stade prototype.
 *  - `assistant-enabled`        : afficher l'assistant à l'ouverture (défaut: oui)
 *  - `assistant-reviewed-<mois>`: le mois (YYYY-MM) a déjà été mis à jour
 */
const ENABLED_KEY = "assistant-enabled";
const REVIEWED_PREFIX = "assistant-reviewed-";

export function isAssistantEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(ENABLED_KEY) !== "0";
}

export function setAssistantEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ENABLED_KEY, on ? "1" : "0");
  } catch {
    /* mode privé / quota : on ignore */
  }
}

export function isMonthReviewed(month: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(REVIEWED_PREFIX + month) === "1";
}

export function markMonthReviewed(month: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REVIEWED_PREFIX + month, "1");
  } catch {
    /* mode privé / quota : on ignore */
  }
}
