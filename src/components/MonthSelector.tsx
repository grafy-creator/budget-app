"use client";

import { useState } from "react";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Liste de mois autour du mois courant (index 12 = mois courant).
function buildMonths() {
  const now = new Date();
  const arr: string[] = [];
  for (let i = -12; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    arr.push(cap(d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })));
  }
  return arr;
}

/** Sélecteur de mois ‹ Mois AAAA ›, par défaut sur le mois courant (visuel). */
export function MonthSelector({ prefix }: { prefix?: string }) {
  const [months] = useState(buildMonths);
  const [index, setIndex] = useState(12); // mois courant

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
        {months[index]}
      </h1>
      <button
        type="button"
        aria-label="Mois suivant"
        onClick={() => setIndex((i) => Math.min(months.length - 1, i + 1))}
        disabled={index === months.length - 1}
        className="flex size-9 items-center justify-center rounded-full text-xl text-graphite/60 transition hover:bg-graphite/5 disabled:opacity-30"
      >
        ›
      </button>
    </header>
  );
}
