"use client";

import { EditableAmount } from "@/components/EditableAmount";
import { formatDayOfMonth, formatEuro, todayLabel } from "@/lib/format";
import { ruleTargets, useData } from "@/lib/store";

function SummaryRow({
  icon,
  label,
  amount,
  value,
  total,
  barClass,
  amountClass,
}: {
  icon: string;
  label: string;
  amount: number;
  value: number;
  total: number;
  barClass: string;
  amountClass: string;
}) {
  const pct = Math.min(100, Math.round((value / (total || 1)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[13px] font-medium text-graphite/70">
          <span aria-hidden>{icon}</span> {label}
        </span>
        <span className={`shrink-0 text-[13px] font-bold ${amountClass}`}>
          {formatEuro(amount)}
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

export function TodayView() {
  const { charges, variables, income, accounts, settings, updateCharge } =
    useData();

  // « Ce mois-ci » dérivé du magasin (se met à jour avec les saisies/réglages).
  const targets = ruleTargets(settings);
  const month = {
    income: income.reduce((s, r) => s + r.amount, 0),
    expenses:
      charges.reduce((s, c) => s + c.amount, 0) +
      variables.reduce((s, v) => s + v.amount, 0),
    savings: accounts.reduce((s, a) => s + a.added, 0),
    incomeTarget: settings.revenuCible,
    expensesBudget: targets.fixes + targets.variables,
    savingsTarget: targets.epargne,
  };

  // Charges « du jour » = celles dont l'échéance tombe aujourd'hui (jour du mois).
  const todayDay = new Date().getDate();
  const dueToday = charges.filter((c) => c.dayOfMonth === todayDay);
  const outflow = dueToday
    .filter((c) => !c.paid)
    .reduce((s, c) => s + c.amount, 0);

  // Solde dérivé du magasin :
  // disponible = revenus − charges déjà payées − dépenses variables − épargne mise de côté.
  const paidCharges = charges
    .filter((c) => c.paid)
    .reduce((s, c) => s + c.amount, 0);
  const unpaidCharges = charges
    .filter((c) => !c.paid)
    .reduce((s, c) => s + c.amount, 0);
  const variablesSum = variables.reduce((s, v) => s + v.amount, 0);
  const available = month.income - paidCharges - variablesSum - month.savings;
  // Projection fin de mois = disponible une fois les charges restantes payées.
  const projection = available - unpaidCharges;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header>
        <p className="text-[13px] font-medium text-graphite/55">Bonjour 👋</p>
        <h1 className="text-xl font-bold text-graphite">{todayLabel()}</h1>
      </header>

      {/* Carte solde */}
      <section
        aria-label="Solde disponible"
        className="relative overflow-hidden rounded-3xl bg-plum p-5 text-white shadow-lg shadow-plum/20"
      >
        <div className="absolute -right-10 -top-12 size-44 rounded-full bg-white/5" aria-hidden />
        <p className="text-xs font-medium text-white/55">Il te reste</p>
        <p className="mt-1 font-display text-5xl font-extrabold leading-none">
          {formatEuro(available)}
        </p>
        <p className="mt-2 text-xs text-white/45">disponibles maintenant</p>
        <div className="my-3 h-px bg-white/15" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/45">Projection fin de mois :</span>
          <span className="text-sm font-bold text-lavender">
            {formatEuro(projection)}
          </span>
        </div>
      </section>

      {/* Ce qui se passe aujourd'hui */}
      <section aria-labelledby="today-title" className="flex flex-col gap-3">
        <h2 id="today-title" className="text-[13px] font-semibold text-graphite/55">
          📅 Ce qui se passe aujourd&apos;hui
        </h2>
        {dueToday.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lavender/30 text-xl"
              aria-hidden
            >
              {c.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-graphite">{c.label}</p>
              <p className="truncate text-xs text-graphite/55">
                {formatDayOfMonth(c.dayOfMonth)} · Charge fixe
              </p>
            </div>
            <EditableAmount
              value={c.amount}
              onCommit={(n) => updateCharge(c.id, { amount: n })}
              ariaLabel={`Montant de ${c.label}`}
              className="shrink-0 font-bold text-graphite"
            />
            <button
              type="button"
              aria-pressed={c.paid}
              aria-label={
                c.paid
                  ? `${c.label} payé — annuler`
                  : `Marquer ${c.label} comme payé`
              }
              onClick={() => updateCharge(c.id, { paid: !c.paid })}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition active:scale-95 ${
                c.paid
                  ? "bg-success/15 text-success"
                  : "bg-success text-white"
              }`}
            >
              {c.paid ? "✓ Payé" : "Payer"}
            </button>
          </div>
        ))}

        {outflow > 0 && (
          <p className="flex items-center gap-2 rounded-xl bg-warning/10 px-3.5 py-2.5 text-xs font-medium text-warning">
            <span aria-hidden>⚡</span>
            <span>{`${formatEuro(outflow)} vont partir aujourd'hui`}</span>
          </p>
        )}
      </section>

      {/* Ce mois-ci */}
      <section aria-labelledby="month-title" className="flex flex-col gap-3">
        <h2 id="month-title" className="text-[13px] font-semibold text-graphite/55">
          Ce mois-ci
        </h2>
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
          <SummaryRow
            icon="💰"
            label="Revenus"
            amount={month.income}
            value={month.income}
            total={month.incomeTarget}
            barClass="bg-success"
            amountClass="text-success"
          />
          <SummaryRow
            icon="📤"
            label="Dépenses"
            amount={month.expenses}
            value={month.expenses}
            total={month.expensesBudget}
            barClass="bg-violet"
            amountClass="text-graphite"
          />
          <SummaryRow
            icon="🐷"
            label="Épargne"
            amount={month.savings}
            value={month.savings}
            total={month.savingsTarget}
            barClass="bg-plum"
            amountClass="text-plum"
          />
        </div>
      </section>
    </div>
  );
}
