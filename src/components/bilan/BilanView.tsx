"use client";

import Link from "next/link";
import { MonthSelector } from "@/components/MonthSelector";
import { formatEuro } from "@/lib/format";
import { budget as mockBudget } from "@/lib/mock";
import { useData } from "@/lib/store";

function signedEuro(amount: number) {
  const sign = amount >= 0 ? "+" : "−";
  return `${sign}${formatEuro(Math.abs(amount))}`;
}

export function BilanView() {
  const { income, charges, variables, accounts, settings } = useData();

  const realIncome = Math.round(income.reduce((s, r) => s + r.amount, 0));
  const realFixed = Math.round(charges.reduce((s, c) => s + c.amount, 0));
  const realVariable = Math.round(variables.reduce((s, v) => s + v.amount, 0));
  const realSavings = Math.round(accounts.reduce((s, a) => s + a.added, 0));

  const prevuIncome = settings.revenuCible;
  const prevuFixed = mockBudget.fixedBudget;
  const prevuVariable = mockBudget.variableBudget;
  const prevuSavings = mockBudget.savingsBudget;

  const rows = [
    {
      id: "revenus",
      icon: "💰",
      label: "Revenus",
      prevu: prevuIncome,
      reel: realIncome,
      good: realIncome >= prevuIncome,
    },
    {
      id: "fixes",
      icon: "🔒",
      label: "Fixes",
      prevu: prevuFixed,
      reel: realFixed,
      good: realFixed <= prevuFixed,
    },
    {
      id: "variables",
      icon: "🛒",
      label: "Variables",
      prevu: prevuVariable,
      reel: realVariable,
      good: realVariable <= prevuVariable,
    },
    {
      id: "epargne",
      icon: "🐷",
      label: "Épargne",
      prevu: prevuSavings,
      reel: realSavings,
      good: realSavings >= prevuSavings,
    },
  ];

  const reste = realIncome - realFixed - realVariable - realSavings;
  const positive = reste >= 0;

  const analysis = [
    realIncome >= prevuIncome
      ? {
          icon: "✅",
          text: `Revenus au rendez-vous (${signedEuro(realIncome - prevuIncome)} vs objectif).`,
          bad: false,
        }
      : {
          icon: "🔴",
          text: `Revenus sous l'objectif (${signedEuro(realIncome - prevuIncome)}).`,
          bad: true,
        },
    realFixed + realVariable <= prevuFixed + prevuVariable
      ? { icon: "✅", text: "Dépenses maîtrisées.", bad: false }
      : { icon: "🔴", text: "Dépenses au-dessus du budget.", bad: true },
    realSavings >= prevuSavings
      ? { icon: "✅", text: "Objectif d'épargne tenu.", bad: false }
      : {
          icon: "🔴",
          text: `Épargne sous l'objectif (${signedEuro(realSavings - prevuSavings)}).`,
          bad: true,
        },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <MonthSelector initial={mockBudget.monthLabel} prefix="Bilan — " />

      {/* Bandeau de synthèse */}
      <section
        className={`rounded-xl px-4 py-3 ${positive ? "bg-success/10" : "bg-warning/10"}`}
      >
        <p
          className={`text-sm font-semibold ${positive ? "text-success" : "text-warning"}`}
        >
          {positive ? "🎉 Bon mois ! Tu es dans les clous." : "⚠️ Mois un peu serré."}
        </p>
        <p
          className={`text-xs ${positive ? "text-success/80" : "text-warning/80"}`}
        >
          {positive
            ? `Il te reste ${formatEuro(reste)} non affectés.`
            : "Les sorties dépassent les entrées ce mois-ci."}
        </p>
      </section>

      {/* Tableau Prévu / Réel / Écart */}
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border-b border-graphite/10 px-3 py-2.5 text-[10px] font-bold text-graphite/50">
          <span />
          <span className="w-16 text-right">PRÉVU</span>
          <span className="w-16 text-right">RÉEL</span>
          <span className="w-16 text-right">ÉCART</span>
        </div>

        {rows.map((row, i) => (
          <div
            key={row.id}
            className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 px-3 py-2.5 ${
              i % 2 === 1 ? "bg-graphite/[0.02]" : ""
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden>{row.icon}</span>
              <span className="truncate text-[13px] font-semibold text-graphite">
                {row.label}
              </span>
            </span>
            <span className="w-16 text-right text-xs text-graphite/55">
              {formatEuro(row.prevu)}
            </span>
            <span className="w-16 text-right text-xs font-semibold text-graphite">
              {formatEuro(row.reel)}
            </span>
            <span
              className={`w-16 text-right text-[13px] font-bold ${
                row.good ? "text-success" : "text-error"
              }`}
            >
              {signedEuro(row.reel - row.prevu)}
            </span>
          </div>
        ))}

        <div className="flex items-center justify-between border-t border-graphite/10 px-3 py-3">
          <span className="text-[13px] font-bold text-graphite">💼 Reste</span>
          <span
            className={`text-[13px] font-bold ${
              reste >= 0 ? "text-success" : "text-error"
            }`}
          >
            {signedEuro(reste)}
          </span>
        </div>
      </section>

      {/* Analyse */}
      <section className="flex flex-col gap-2.5 rounded-2xl bg-white p-4 shadow-sm">
        {analysis.map((line, i) => (
          <p
            key={i}
            className={`text-[13px] font-medium ${
              line.bad ? "text-error" : "text-graphite"
            }`}
          >
            {line.icon} {line.text}
          </p>
        ))}
        {reste > 0 && (
          <>
            <div className="h-px bg-graphite/10" />
            <p className="text-xs font-medium text-graphite/60">
              💡 {formatEuro(reste)} non affectés. Que veux-tu faire ?
            </p>
          </>
        )}
      </section>

      {/* Actions */}
      {reste > 0 && (
        <div className="flex flex-col gap-2">
          <Link
            href="/epargne"
            className="flex h-12 items-center justify-center rounded-2xl bg-plum text-[15px] font-bold text-white shadow-md shadow-plum/20 transition active:scale-[0.99]"
          >
            → Virer à l&apos;épargne
          </Link>
          <button
            type="button"
            className="flex h-11 items-center justify-center rounded-2xl bg-white text-sm font-medium text-graphite/60 shadow-sm transition active:scale-[0.99]"
          >
            Laisser là
          </button>
        </div>
      )}
    </div>
  );
}
