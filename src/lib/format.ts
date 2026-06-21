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

const pad2 = (n: number) => String(n).padStart(2, "0");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Date du jour locale au format ISO (YYYY-MM-DD). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Libellé complet du jour, ex : "Samedi 21 juin 2026". */
export function todayLabel(): string {
  return cap(
    new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  );
}

/** Infos sur le mois courant (pour l'Agenda). */
export function currentMonthInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0–11
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=dim … 6=sam
  const firstWeekday = firstDow === 0 ? 7 : firstDow; // 1=lun … 7=dim
  return {
    year,
    month,
    daysInMonth,
    firstWeekday,
    todayDay: now.getDate(),
    prefix: `${year}-${pad2(month + 1)}`,
    label: cap(
      now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    ),
  };
}

/** Échéance récurrente : 1 → "Le 1er du mois", 10 → "Le 10 du mois". */
export function formatDayOfMonth(n: number): string {
  return n === 1 ? "Le 1er du mois" : `Le ${n} du mois`;
}
