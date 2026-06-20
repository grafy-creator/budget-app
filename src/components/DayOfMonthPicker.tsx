"use client";

import { formatDayOfMonth } from "@/lib/format";

/**
 * Sélecteur de jour du mois sous forme de grille 1–31 (pas de scroll).
 * Pour l'échéance des charges récurrentes.
 */
export function DayOfMonthPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (day: number) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-graphite/55">
        Échéance : {formatDayOfMonth(value).toLowerCase()}
      </p>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
          const active = value === d;
          return (
            <button
              key={d}
              type="button"
              aria-pressed={active}
              aria-label={`Le ${d} du mois`}
              onClick={() => onChange(d)}
              className={`aspect-square rounded-md text-xs font-semibold transition ${
                active
                  ? "bg-plum text-white"
                  : "bg-white text-graphite hover:bg-lavender/40"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
