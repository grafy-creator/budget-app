import Link from "next/link";
import { MonthSelector } from "@/components/MonthSelector";
import { formatEuro } from "@/lib/format";
import { bilan } from "@/lib/mock";

function signedEuro(amount: number) {
  const sign = amount >= 0 ? "+" : "−";
  return `${sign}${formatEuro(Math.abs(amount))}`;
}

export default function BilanPage() {
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <MonthSelector initial={bilan.monthLabel} prefix="Bilan — " />

      {/* Bandeau de synthèse */}
      <section className="rounded-xl bg-success/10 px-4 py-3">
        <p className="text-sm font-semibold text-success">{bilan.banner.title}</p>
        <p className="text-xs text-success/80">{bilan.banner.sub}</p>
      </section>

      {/* Tableau Prévu / Réel / Écart */}
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border-b border-graphite/10 px-3 py-2.5 text-[10px] font-bold text-graphite/50">
          <span />
          <span className="w-16 text-right">PRÉVU</span>
          <span className="w-16 text-right">RÉEL</span>
          <span className="w-16 text-right">ÉCART</span>
        </div>

        {bilan.rows.map((row, i) => (
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
              {signedEuro(row.ecart)}
            </span>
          </div>
        ))}

        <div className="flex items-center justify-between border-t border-graphite/10 px-3 py-3">
          <span className="text-[13px] font-bold text-graphite">💼 Reste</span>
          <span className="text-[13px] font-bold text-success">
            {signedEuro(bilan.reste)}
          </span>
        </div>
      </section>

      {/* Analyse */}
      <section className="flex flex-col gap-2.5 rounded-2xl bg-white p-4 shadow-sm">
        {bilan.analysis.map((line, i) => (
          <p
            key={i}
            className={`text-[13px] font-medium ${
              line.bad ? "text-error" : "text-graphite"
            }`}
          >
            {line.icon} {line.text}
          </p>
        ))}
        <div className="h-px bg-graphite/10" />
        <p className="text-xs font-medium text-graphite/60">
          💡 {formatEuro(bilan.unallocated)} non affectés. Que veux-tu faire ?
        </p>
      </section>

      {/* Actions */}
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
    </div>
  );
}
