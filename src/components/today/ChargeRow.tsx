"use client";

import { useState } from "react";
import { formatEuro } from "@/lib/format";
import type { TodayCharge } from "@/lib/mock";

export function ChargeRow({ charge }: { charge: TodayCharge }) {
  const [paid, setPaid] = useState(charge.paid);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lavender/30 text-xl"
        aria-hidden
      >
        {charge.icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-graphite">{charge.label}</p>
        <p className="truncate text-xs text-graphite/55">{charge.meta}</p>
      </div>

      <span className="shrink-0 font-bold text-graphite">
        {formatEuro(charge.amount)}
      </span>

      {paid ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-3 py-1.5 text-xs font-bold text-success">
          <span aria-hidden>✓</span> Payé
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setPaid(true)}
          className="shrink-0 rounded-full bg-success px-4 py-1.5 text-xs font-bold text-white transition active:scale-95"
        >
          Payer
        </button>
      )}
    </div>
  );
}
