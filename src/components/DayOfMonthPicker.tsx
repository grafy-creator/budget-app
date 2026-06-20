"use client";

import { useState } from "react";
import { formatDayOfMonth } from "@/lib/format";

/**
 * Sélecteur de jour du mois, replié par défaut : un champ « Échéance : le X du
 * mois » qu'on clique pour dérouler une grille 1–31 (pas de scroll). La grille
 * se referme après sélection.
 */
export function DayOfMonthPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (day: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-sm text-graphite"
      >
        <span>
          <span className="text-graphite/55">Échéance : </span>
          <span className="font-semibold">
            {formatDayOfMonth(value).toLowerCase()}
          </span>
        </span>
        <span className={`text-graphite/40 transition ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="mt-2 grid grid-cols-7 gap-1 rounded-lg bg-graphite/5 p-2">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
            const active = value === d;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={active}
                aria-label={`Le ${d} du mois`}
                onClick={() => {
                  onChange(d);
                  setOpen(false);
                }}
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
      )}
    </div>
  );
}
