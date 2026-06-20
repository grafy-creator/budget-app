"use client";

import { useState } from "react";

export const MONTHS = [
  "Février 2026",
  "Mars 2026",
  "Avril 2026",
  "Mai 2026",
  "Juin 2026",
];

/** Sélecteur de mois ‹ Mois AAAA › (état interne, visuel). */
export function MonthSelector({
  initial = "Avril 2026",
  prefix,
}: {
  initial?: string;
  prefix?: string;
}) {
  const [index, setIndex] = useState(Math.max(0, MONTHS.indexOf(initial)));

  return (
    <header className="flex items-center justify-between">
      <button
        type="button"
        aria-label="Mois précédent"
        onClick={() => setIndex((i) => Math.max(0, i - 1))}
        disabled={index === 0}
        className="flex size-9 items-center justify-center rounded-full text-xl text-graphite/60 transition hover:bg-graphite/5 disabled:opacity-30"
      >
        ‹
      </button>
      <h1 className="text-base font-bold text-graphite">
        {prefix}
        {MONTHS[index]}
      </h1>
      <button
        type="button"
        aria-label="Mois suivant"
        onClick={() => setIndex((i) => Math.min(MONTHS.length - 1, i + 1))}
        disabled={index === MONTHS.length - 1}
        className="flex size-9 items-center justify-center rounded-full text-xl text-graphite/60 transition hover:bg-graphite/5 disabled:opacity-30"
      >
        ›
      </button>
    </header>
  );
}
