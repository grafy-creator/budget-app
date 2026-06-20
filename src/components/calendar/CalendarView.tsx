"use client";

import { useState } from "react";
import { MonthSelector } from "@/components/MonthSelector";
import { formatEuro } from "@/lib/format";
import { calendar, type DotKind } from "@/lib/mock";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const DOT_CLASS: Record<DotKind, string> = {
  fixe: "bg-plum",
  variable: "bg-violet",
  echeance: "bg-warning",
};

const LEGEND: { kind: DotKind; label: string }[] = [
  { kind: "fixe", label: "Charge fixe (abonnement, loyer…)" },
  { kind: "variable", label: "Dépense variable (courses, resto…)" },
  { kind: "echeance", label: "Échéance à venir aujourd'hui" },
];

export function CalendarView() {
  const [selected, setSelected] = useState<number | null>(calendar.today);
  const [paid, setPaid] = useState<Record<string, boolean>>({});

  const leading = calendar.firstWeekday - 1; // cellules vides avant le 1er
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: calendar.daysInMonth }, (_, i) => i + 1),
  ];

  const dayItems = selected ? calendar.details[selected] ?? [] : [];
  const dayTotal = dayItems.reduce((s, it) => s + it.amount, 0);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <MonthSelector initial={calendar.monthLabel} />

      {/* Grille du mois */}
      <section className="rounded-3xl bg-white p-3 shadow-sm">
        <div className="mb-1 grid grid-cols-7">
          {WEEKDAYS.map((d, i) => (
            <span
              key={i}
              className={`py-1 text-center text-[11px] font-bold ${
                i >= 5 ? "text-violet" : "text-graphite/45"
              }`}
            >
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <span key={`e${i}`} />;
            const dots = calendar.markers[day] ?? [];
            const hasDetail = Boolean(calendar.details[day]);
            const isSelected = selected === day;
            return (
              <button
                key={day}
                type="button"
                disabled={!hasDetail}
                aria-pressed={isSelected}
                aria-label={`${day} avril${
                  dots.length ? `, ${dots.length} opération(s)` : ""
                }`}
                onClick={() => setSelected(day)}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm transition ${
                  isSelected
                    ? "bg-plum font-bold text-white"
                    : "bg-graphite/[0.04] text-graphite enabled:hover:bg-lavender/30"
                } ${!hasDetail ? "cursor-default" : ""}`}
              >
                <span>{day}</span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {dots.map((kind, k) => (
                    <span
                      key={k}
                      className={`size-1.5 rounded-full ${
                        isSelected ? "bg-white/80" : DOT_CLASS[kind]
                      }`}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Légende */}
      <section>
        <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-graphite/50">
          Légende
        </h2>
        <ul className="flex flex-col gap-1.5">
          {LEGEND.map((l) => (
            <li key={l.kind} className="flex items-center gap-2">
              <span className={`size-2 rounded-sm ${DOT_CLASS[l.kind]}`} />
              <span className="text-xs text-graphite/60">{l.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Panneau du jour sélectionné */}
      {selected && dayItems.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-graphite">
              📅 {selected} avril
            </h2>
            <span className="rounded-full bg-lavender/30 px-2.5 py-1 text-[11px] font-bold text-plum">
              {dayItems.length} op.
            </span>
          </div>
          <p className="text-xs text-graphite/55">
            Total du jour : {formatEuro(dayTotal)}
          </p>

          {dayItems.map((it, idx) => {
            const key = `${selected}-${idx}`;
            const isPaid = paid[key] ?? it.paid;
            return (
              <div key={key} className="flex items-center gap-3">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-lavender/30 text-xl"
                  aria-hidden
                >
                  {it.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-graphite">
                    {it.label}
                  </p>
                  <span className="text-[11px] text-graphite/55">
                    {it.kind === "fixe" ? "Charge fixe" : "Dépense variable"}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-bold text-graphite">
                    {formatEuro(it.amount)}
                  </span>
                  {isPaid ? (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                      Payé
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPaid((p) => ({ ...p, [key]: true }))}
                      className="rounded-full bg-success px-3 py-1 text-[11px] font-bold text-white transition active:scale-95"
                    >
                      Payer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <p className="rounded-xl bg-lavender/25 px-3.5 py-3 text-xs font-medium text-plum">
          👆 Appuie sur un jour marqué pour voir le détail
        </p>
      )}
    </div>
  );
}
