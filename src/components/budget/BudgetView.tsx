"use client";

import { useMemo, useState } from "react";
import { formatEuro } from "@/lib/format";
import { budget } from "@/lib/mock";

const MONTHS = [
  "Février 2026",
  "Mars 2026",
  "Avril 2026",
  "Mai 2026",
  "Juin 2026",
];

const TABS = ["Dépenses", "Revenus", "Épargne"] as const;
type Tab = (typeof TABS)[number];

/** Barre résumé : libellé + « dépensé / budget » + progression. */
function SummaryBar({
  label,
  spent,
  total,
  barClass,
}: {
  label: string;
  spent: number;
  total: number;
  barClass: string;
}) {
  const pct = Math.min(100, Math.round((spent / total) * 100));
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs font-medium text-graphite/70">
          {label}
        </span>
        <span className="shrink-0 text-xs font-bold text-graphite">
          {formatEuro(spent)} / {formatEuro(total)}
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-graphite/10"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} : ${pct}%`}
      >
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function BudgetView() {
  const [monthIndex, setMonthIndex] = useState(
    Math.max(0, MONTHS.indexOf(budget.monthLabel)),
  );
  const [tab, setTab] = useState<Tab>("Dépenses");
  const [paid, setPaid] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(budget.fixedCharges.map((c) => [c.id, c.paid])),
  );

  const resteAPayer = useMemo(
    () =>
      budget.fixedCharges
        .filter((c) => !paid[c.id])
        .reduce((sum, c) => sum + c.amount, 0),
    [paid],
  );

  return (
    <div className="flex min-w-0 flex-col gap-5">
      {/* Sélecteur de mois */}
      <header className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Mois précédent"
          onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
          disabled={monthIndex === 0}
          className="flex size-9 items-center justify-center rounded-full text-xl text-graphite/60 transition hover:bg-graphite/5 disabled:opacity-30"
        >
          ‹
        </button>
        <h1 className="text-base font-bold text-graphite">{MONTHS[monthIndex]}</h1>
        <button
          type="button"
          aria-label="Mois suivant"
          onClick={() => setMonthIndex((i) => Math.min(MONTHS.length - 1, i + 1))}
          disabled={monthIndex === MONTHS.length - 1}
          className="flex size-9 items-center justify-center rounded-full text-xl text-graphite/60 transition hover:bg-graphite/5 disabled:opacity-30"
        >
          ›
        </button>
      </header>

      {/* Onglets */}
      <div
        role="tablist"
        aria-label="Type de budget"
        className="grid grid-cols-3 gap-1 rounded-xl bg-graphite/5 p-1"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-lg py-2 text-[13px] font-bold transition ${
              tab === t
                ? "bg-plum text-white shadow-sm"
                : "text-graphite/55 hover:text-graphite"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Dépenses" ? (
        <>
          {/* Carte résumé */}
          <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <SummaryBar
              label="Charges fixes"
              spent={budget.fixedSpent}
              total={budget.fixedBudget}
              barClass="bg-plum"
            />
            <SummaryBar
              label="Charges variables"
              spent={budget.variableSpent}
              total={budget.variableBudget}
              barClass="bg-violet"
            />
            <p className="text-[11px] font-semibold text-warning">
              Reste à payer : {formatEuro(resteAPayer)}
            </p>
          </section>

          {/* Charges fixes */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-graphite/50">
              Charges fixes
            </h2>
            {budget.fixedCharges.map((c) => {
              const isPaid = paid[c.id];
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 rounded-xl p-2.5 shadow-sm ${
                    isPaid ? "bg-success/5" : "bg-white"
                  }`}
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-lavender/30 text-base"
                    aria-hidden
                  >
                    {c.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-graphite">
                      {c.label}
                    </p>
                    <p className="truncate text-[11px] text-graphite/55">{c.day}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-graphite">
                    {formatEuro(c.amount)}
                  </span>
                  <button
                    type="button"
                    aria-pressed={isPaid}
                    aria-label={
                      isPaid
                        ? `${c.label} payé, marquer comme non payé`
                        : `Marquer ${c.label} comme payé`
                    }
                    onClick={() =>
                      setPaid((p) => ({ ...p, [c.id]: !p[c.id] }))
                    }
                    className={`flex size-7 shrink-0 items-center justify-center rounded-[14px] text-sm font-bold transition ${
                      isPaid
                        ? "bg-success text-white"
                        : "bg-graphite/10 text-graphite/40"
                    }`}
                  >
                    {isPaid ? "✓" : "○"}
                  </button>
                </div>
              );
            })}
          </section>

          {/* Dépenses variables */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-graphite/50">
              Dépenses variables
            </h2>
            {budget.variableExpenses.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm"
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-lavender/30 text-base"
                  aria-hidden
                >
                  {e.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-graphite">
                    {e.label}
                  </p>
                  <p className="truncate text-[11px] text-graphite/55">{e.date}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-violet">
                  −{formatEuro(e.amount)}
                </span>
              </div>
            ))}
          </section>
        </>
      ) : (
        <section className="flex min-h-[40dvh] flex-col items-center justify-center gap-2 text-center">
          <span className="text-3xl" aria-hidden>
            {tab === "Revenus" ? "💰" : "🐷"}
          </span>
          <p className="text-sm text-graphite/60">
            Vue « {tab} » à venir.
          </p>
        </section>
      )}
    </div>
  );
}
