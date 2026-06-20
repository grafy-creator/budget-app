"use client";

import { useState } from "react";
import { formatEuro } from "@/lib/format";
import { budget } from "@/lib/mock";

const RULES = [
  { id: "besoins", label: "Charges fixes (Besoins)", pct: 50, bar: "bg-plum" },
  { id: "envies", label: "Variables (Envies)", pct: 30, bar: "bg-violet" },
  { id: "epargne", label: "Épargne", pct: 20, bar: "bg-success" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-wide text-graphite/50">
      {children}
    </h2>
  );
}

export function ReglagesView() {
  const [income, setIncome] = useState("2500");
  const [reminder, setReminder] = useState(true);
  const [recurrences, setRecurrences] = useState(budget.fixedCharges);

  const total = RULES.reduce((sum, r) => sum + r.pct, 0);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <h1 className="font-display text-2xl font-extrabold text-graphite">
        Réglages
      </h1>

      {/* Revenu cible */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Mon revenu cible</SectionTitle>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <span className="text-2xl" aria-hidden>
            💰
          </span>
          <div className="flex flex-1 items-center gap-1 rounded-lg bg-graphite/5 px-3 py-2">
            <input
              inputMode="numeric"
              value={income}
              onChange={(e) => setIncome(e.target.value.replace(/[^0-9]/g, ""))}
              aria-label="Revenu mensuel cible en euros"
              className="w-full bg-transparent font-display text-xl font-extrabold text-success outline-none"
            />
            <span className="font-display text-xl font-extrabold text-success">€</span>
          </div>
        </div>
      </section>

      {/* Règle budgétaire */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Ma règle budgétaire</SectionTitle>
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
          {RULES.map((r) => (
            <div key={r.id}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-graphite/70">{r.label}</span>
                <span className="font-bold text-graphite">{r.pct}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-graphite/10">
                <div
                  className={`h-full rounded-full ${r.bar}`}
                  style={{ width: `${r.pct}%` }}
                />
              </div>
            </div>
          ))}
          <p className="text-xs font-bold text-success">Total : {total}% ✓</p>
        </div>
      </section>

      {/* Charges récurrentes */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Mes charges récurrentes</SectionTitle>
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm">
          <button
            type="button"
            className="rounded-lg bg-lavender/30 py-2.5 text-[13px] font-semibold text-plum transition active:scale-[0.99]"
          >
            + Ajouter une charge
          </button>
          {recurrences.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-1">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-graphite/5 text-base"
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
                aria-label={`Supprimer ${c.label}`}
                onClick={() =>
                  setRecurrences((list) => list.filter((x) => x.id !== c.id))
                }
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-graphite/30 transition hover:bg-error/10 hover:text-error"
              >
                ✕
              </button>
            </div>
          ))}
          {recurrences.length === 0 && (
            <p className="py-2 text-center text-xs text-graphite/40">
              Aucune charge récurrente.
            </p>
          )}
        </div>
      </section>

      {/* Notifications (rappel local) */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Rappels</SectionTitle>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-graphite">Rappel quotidien</p>
            <p className="text-xs text-graphite/55">Tous les jours à 20:00</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reminder}
            aria-label="Activer le rappel quotidien"
            onClick={() => setReminder((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              reminder ? "bg-success" : "bg-graphite/20"
            }`}
          >
            <span
              className={`absolute top-1 size-4 rounded-full bg-white transition-all ${
                reminder ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Zone de réinitialisation */}
      <button
        type="button"
        className="rounded-xl bg-error/10 py-3 text-sm font-medium text-error transition active:scale-[0.99]"
      >
        Effacer toutes les données
      </button>
    </div>
  );
}
