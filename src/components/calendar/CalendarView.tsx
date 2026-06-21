"use client";

import { useRef, useState } from "react";
import { MonthSelector, currentMonthValue } from "@/components/MonthSelector";
import { monthInfoFor, formatEuro } from "@/lib/format";
import { type DotKind } from "@/lib/mock";
import { useData } from "@/lib/store";
import { useQuickEntry } from "@/lib/quickEntry";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const DOT_CLASS: Record<DotKind, string> = {
  fixe: "bg-plum", // charge fixe — violet foncé
  variable: "bg-[#E0699F]", // dépense variable — rose
  echeance: "bg-[#E8842E]", // échéance du jour — orange
};

const LEGEND: { kind: DotKind; label: string }[] = [
  { kind: "fixe", label: "Charge fixe (abonnement, loyer…)" },
  { kind: "variable", label: "Dépense variable (courses, resto…)" },
  { kind: "echeance", label: "Échéance à venir aujourd'hui" },
];

type DayEntry = {
  id: string;
  icon: string;
  label: string;
  kind: "fixe" | "variable";
  amount: number;
  paid?: boolean;
  dot: DotKind;
};

export function CalendarView() {
  const { variables, charges, chargeState, setChargePaid } = useData();
  const { openSheet } = useQuickEntry();

  const [monthPrefix, setMonthPrefix] = useState(currentMonthValue());
  const m = monthInfoFor(monthPrefix);
  const monthName = new Date(m.year, m.month, 1).toLocaleDateString("fr-FR", {
    month: "long",
  });
  const isoOf = (day: number) => `${m.prefix}-${String(day).padStart(2, "0")}`;
  const parseMonthDay = (iso: string) => {
    const mm = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return mm && `${mm[1]}-${mm[2]}` === m.prefix ? Number(mm[3]) : null;
  };

  const [selected, setSelected] = useState<number | null>(m.todayDay);

  // Appui long sur un jour → ouvrir la saisie pré-remplie avec cette date.
  const longPressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);

  function startLongPress(day: number) {
    longPressed.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      setSelected(day);
      openSheet(isoOf(day));
    }, 450);
  }
  function cancelLongPress() {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }
  function handleDayClick(day: number) {
    // Si l'appui long vient de se déclencher, on ignore le clic qui suit.
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    setSelected(day);
  }

  // Regroupe les opérations du magasin par jour (avril 2026).
  const byDay: Record<number, DayEntry[]> = {};
  const push = (day: number, e: DayEntry) => {
    (byDay[day] ??= []).push(e);
  };
  for (const v of variables) {
    const d = parseMonthDay(v.date);
    if (d)
      push(d, {
        id: v.id,
        icon: v.icon,
        label: v.label,
        kind: "variable",
        amount: v.amount,
        dot: "variable",
      });
  }
  for (const c of charges) {
    const d = c.dayOfMonth;
    if (d) {
      const st = chargeState(c.id, monthPrefix, c.amount);
      const echeance = !st.paid && d === m.todayDay; // todayDay=0 hors mois courant
      push(d, {
        id: c.id,
        icon: c.icon,
        label: c.label,
        kind: "fixe",
        amount: st.amount,
        paid: st.paid,
        dot: echeance ? "echeance" : "fixe",
      });
    }
  }

  const leading = m.firstWeekday - 1;
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: m.daysInMonth }, (_, i) => i + 1),
  ];

  const dayItems = selected ? byDay[selected] ?? [] : [];
  const dayTotal = dayItems.reduce((s, it) => s + it.amount, 0);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <MonthSelector
        value={monthPrefix}
        onChange={(ym) => {
          setMonthPrefix(ym);
          setSelected(null);
        }}
      />

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
            const dots = (byDay[day] ?? []).map((e) => e.dot);
            const isSelected = selected === day;
            return (
              <button
                key={day}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${day} ${monthName}${
                  dots.length ? `, ${dots.length} opération(s)` : ""
                } — appui long pour ajouter`}
                onClick={() => handleDayClick(day)}
                onPointerDown={() => startLongPress(day)}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onPointerCancel={cancelLongPress}
                onPointerMove={cancelLongPress}
                onContextMenu={(e) => e.preventDefault()}
                className={`flex aspect-square select-none flex-col items-center justify-center gap-1 rounded-xl text-sm transition ${
                  isSelected
                    ? "bg-plum font-bold text-white"
                    : "bg-graphite/[0.04] text-graphite hover:bg-lavender/30"
                }`}
              >
                <span>{day}</span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {dots.slice(0, 3).map((kind, k) => (
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

      <p className="-mt-2 text-center text-[11px] text-graphite/45">
        👆 Touche un jour pour le voir · appui long pour y ajouter
      </p>

      {/* Panneau du jour sélectionné */}
      {selected && (
        <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-graphite">
              📅 {selected} {monthName}
            </h2>
            {dayItems.length > 0 && (
              <span className="rounded-full bg-lavender/30 px-2.5 py-1 text-[11px] font-bold text-plum">
                {dayItems.length} op.
              </span>
            )}
          </div>

          {dayItems.length > 0 ? (
            <>
              <p className="text-xs text-graphite/55">
                Total du jour : {formatEuro(dayTotal)}
              </p>
              {dayItems.map((it) => (
                <div key={it.id} className="flex items-center gap-3">
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
                    {it.kind === "fixe" &&
                      (it.paid ? (
                        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                          Payé
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setChargePaid(it.id, monthPrefix, true)}
                          className="rounded-full bg-success px-3 py-1 text-[11px] font-bold text-white transition active:scale-95"
                        >
                          Payer
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="text-xs text-graphite/50">
              Aucune opération ce jour-là. Appui long sur le {selected}{" "}
              {monthName} pour en ajouter une.
            </p>
          )}
        </section>
      )}

      {/* Légende (en bas) */}
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
    </div>
  );
}
