/**
 * Formatage monétaire FR (euro). Ex : 2650 → "2 650 €", 13.99 → "13,99 €".
 */
const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// Espace insécable normale (U+00A0) — lisible et qui ne casse pas en fin de ligne.
const NBSP = " ";

export function formatEuro(amount: number): string {
  // ICU utilise une espace fine insécable (U+202F) comme séparateur de milliers
  // et avant le « € » ; elle est quasi invisible aux petites tailles. On
  // normalise toutes les espaces (fine insécable, insécable, normale) en U+00A0.
  return eur.format(amount).replace(/\s+/g, NBSP);
}

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

/**
 * Formate une date ISO (YYYY-MM-DD) en libellé court : "2026-04-03" → "3 avr".
 * Si la valeur n'est pas une date ISO valide, on la renvoie telle quelle
 * (compatibilité avec d'anciens libellés en texte).
 */
export function formatDateShort(value: string): string {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return dateShort.format(d).replace(".", "");
}

/** Date du jour de référence du prototype (l'app est calée sur avril 2026). */
export const TODAY_ISO = "2026-04-10";
