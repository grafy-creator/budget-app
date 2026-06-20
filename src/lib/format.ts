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
  return eur.format(amount).replace(/[  \s]+/g, NBSP);
}
