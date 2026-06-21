"use client";

import { useMemo } from "react";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pad2 = (n: number) => String(n).padStart(2, "0");

// Liste de mois autour du mois courant : { ym: 'YYYY-MM', label: 'Juin 2026' }.
function buildMonths() {
  const now = new Date();
  const arr: { ym: string; label: string }[] = [];
  for (let i = -12; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    arr.push({
      ym: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`,
      label: cap(d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })),
    });
  }
  return arr;
}

/** Mois courant au format 'YYYY-MM' (valeur par défaut du sélecteur). */
export function currentMonthValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

/**
 * Sélecteur de mois contrôlé ‹ Mois AAAA ›. `value` = 'YYYY-MM', `onChange`
 * remonte le mois choisi pour filtrer les données. `labelPrefix` = texte avant.
 */
export function MonthSelector({
  value,
  onChange,
  labelPrefix,
}: {
  value: string;
  onChange: (ym: string) => void;
  labelPrefix?: string;
}) {
  const months = useMemo(buildMonths, []);
  const index = Math.max(
    0,
    months.findIndex((m) => m.ym === value),
  );

  return (
    <header className="flex items-center justify-between">
      <button
        type="button"
        aria-label="Mois précédent"
        onClick={() => onChange(months[Math.max(0, index - 1)].ym)}
        disabled={index === 0}
        className="flex size-9 items-center justify-center rounded-full text-xl text-graphite/60 transition hover:bg-graphite/5 disabled:opacity-30"
      >
        ‹
      </button>
      <h1 className="text-base font-bold text-graphite">
        {labelPrefix}
        {months[index]?.label ?? ""}
      </h1>
      <button
        type="button"
        aria-label="Mois suivant"
        onClick={() => onChange(months[Math.min(months.length - 1, index + 1)].ym)}
        disabled={index === months.length - 1}
        className="flex size-9 items-center justify-center rounded-full text-xl text-graphite/60 transition hover:bg-graphite/5 disabled:opacity-30"
      >
        ›
      </button>
    </header>
  );
}
