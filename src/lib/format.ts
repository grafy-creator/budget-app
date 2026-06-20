/**
 * Formatage monétaire FR (euro). Ex : 2650 → "2 650 €", 13.99 → "13,99 €".
 */
const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatEuro(amount: number): string {
  return eur.format(amount).replace(/ /g, " ");
}
