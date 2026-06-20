import { formatEuro } from "@/lib/format";
import { savings, type SavingsAccount } from "@/lib/mock";

function pct(account: SavingsAccount) {
  return Math.min(100, Math.round((account.balance / account.goal) * 100));
}

/** Carte détaillée du compte principal. */
function PrimaryAccountCard({ account }: { account: SavingsAccount }) {
  const p = pct(account);
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>
          {account.icon}
        </span>
        <h2 className="text-lg font-bold text-graphite">{account.label}</h2>
        {account.badge && (
          <span className="rounded-full bg-lavender/40 px-2.5 py-1 text-[10px] font-bold text-plum">
            {account.badge}
          </span>
        )}
      </div>

      <div className="h-px bg-graphite/10" />

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-graphite/55">Avant ce mois</span>
        <span className="font-bold text-graphite/70">
          {formatEuro(account.before)}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-graphite/55">Ajouté ce mois</span>
        <span className="text-sm font-bold text-success">
          +{formatEuro(account.added)}
        </span>
      </div>

      <div className="h-px bg-graphite/10" />

      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-graphite/60">Solde actuel</span>
        <span className="font-display text-2xl font-extrabold text-plum">
          {formatEuro(account.balance)}
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-graphite/60">
            Objectif : {formatEuro(account.goal)}
          </span>
          <span className="font-bold text-plum">{p}%</span>
        </div>
        <div
          className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-graphite/10"
          role="progressbar"
          aria-valuenow={p}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progression vers l'objectif : ${p}%`}
        >
          <div className="h-full rounded-full bg-plum" style={{ width: `${p}%` }} />
        </div>
      </div>

      <p className="text-[11px] text-graphite/55">📈 {account.projection}</p>
    </section>
  );
}

/** Carte compacte pour les comptes secondaires. */
function SecondaryAccountCard({ account }: { account: SavingsAccount }) {
  const p = pct(account);
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>
          {account.icon}
        </span>
        <h2 className="flex-1 text-base font-bold text-graphite">{account.label}</h2>
        <span className="font-display text-lg font-extrabold text-plum">
          {formatEuro(account.balance)}
        </span>
      </div>
      <p className="text-[11px] font-medium text-success">
        Ce mois : +{formatEuro(account.added)}
      </p>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-graphite/10"
        role="progressbar"
        aria-valuenow={p}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progression vers l'objectif : ${p}%`}
      >
        <div className="h-full rounded-full bg-plum" style={{ width: `${p}%` }} />
      </div>
      <p className="text-[11px] text-graphite/55">
        Objectif : {formatEuro(account.goal)} · {p}%
      </p>
    </section>
  );
}

export default function EpargnePage() {
  const [primary, ...rest] = savings.accounts;
  const sim = savings.simulator;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-graphite">
          Mon Épargne
        </h1>
        <p className="text-[13px] font-medium text-graphite/55">
          {savings.monthLabel}
        </p>
      </header>

      {/* Total */}
      <section className="rounded-2xl bg-plum p-4 text-white shadow-lg shadow-plum/20">
        <p className="text-xs font-medium text-white/70">
          Total de toute ton épargne
        </p>
        <p className="mt-1 font-display text-3xl font-extrabold">
          {formatEuro(savings.total)}
        </p>
      </section>

      <PrimaryAccountCard account={primary} />

      {rest.map((account) => (
        <SecondaryAccountCard key={account.id} account={account} />
      ))}

      {/* Simulateur */}
      <section className="flex flex-col gap-1.5 rounded-2xl bg-lavender/25 p-4">
        <p className="text-[13px] font-semibold text-plum">
          💡 Et si tu épargnais {formatEuro(sim.monthly)}/mois ?
        </p>
        <p className="text-xs text-plum/80">
          Tu atteindrais {formatEuro(sim.target)} en {sim.eta}
        </p>
        <p className="text-[11px] font-medium text-success">Soit {sim.saved} 🎉</p>
      </section>
    </div>
  );
}
