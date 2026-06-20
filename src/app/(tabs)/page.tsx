import Link from "next/link";
import { ChargeRow } from "@/components/today/ChargeRow";
import { formatEuro } from "@/lib/format";
import { today, todayOutflow } from "@/lib/mock";

/** Une ligne du bloc « Ce mois-ci » : libellé + montant + barre de progression. */
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
  const pct = Math.min(100, Math.round((value / total) * 100));
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

export default function AujourdhuiPage() {
  const { month } = today;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* En-tête : salutation + date + accès calendrier */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-graphite/55">Bonjour 👋</p>
          <h1 className="text-xl font-bold text-graphite">{today.dateLabel}</h1>
        </div>
        <Link
          href="/calendrier"
          aria-label="Ouvrir le calendrier"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm transition active:scale-95"
        >
          📅
        </Link>
      </header>

      {/* Carte solde */}
      <section
        aria-label="Solde disponible"
        className="relative overflow-hidden rounded-3xl bg-plum p-5 text-white shadow-lg shadow-plum/20"
      >
        <div className="absolute -right-10 -top-12 size-44 rounded-full bg-white/5" aria-hidden />
        <p className="text-xs font-medium text-white/55">Il te reste</p>
        <p className="mt-1 font-display text-5xl font-extrabold leading-none">
          {formatEuro(today.available)}
        </p>
        <p className="mt-2 text-xs text-white/45">disponibles maintenant</p>
        <div className="my-3 h-px bg-white/15" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/45">Projection fin de mois :</span>
          <span className="text-sm font-bold text-lavender">
            {formatEuro(today.endOfMonthProjection)}
          </span>
        </div>
      </section>

      {/* Ce qui se passe aujourd'hui */}
      <section aria-labelledby="today-title" className="flex flex-col gap-3">
        <h2 id="today-title" className="text-[13px] font-semibold text-graphite/55">
          📅 Ce qui se passe aujourd&apos;hui
        </h2>
        {today.charges.map((charge) => (
          <ChargeRow key={charge.id} charge={charge} />
        ))}

        {todayOutflow > 0 && (
          <p className="flex items-center gap-2 rounded-xl bg-warning/10 px-3.5 py-2.5 text-xs font-medium text-warning">
            <span aria-hidden>⚡</span>
            <span>{`${formatEuro(todayOutflow)} vont partir aujourd'hui`}</span>
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
