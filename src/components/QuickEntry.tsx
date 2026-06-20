"use client";

import { useEffect, useRef, useState } from "react";

const TYPES = [
  { id: "depense", icon: "💸", label: "Dépense" },
  { id: "revenu", icon: "💰", label: "Revenu" },
  { id: "epargne", icon: "🐷", label: "Épargne" },
] as const;

const CATEGORIES = [
  { id: "courses", icon: "🛒", label: "Courses" },
  { id: "resto", icon: "🍽️", label: "Resto" },
  { id: "transport", icon: "🚗", label: "Transport" },
  { id: "sante", icon: "💊", label: "Santé" },
  { id: "loisirs", icon: "🎮", label: "Loisirs" },
  { id: "autre", icon: "📦", label: "Autre" },
];

type TypeId = (typeof TYPES)[number]["id"];

export function QuickEntry() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TypeId>("depense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const amountValue = parseFloat(amount.replace(",", "."));
  const canSubmit = !done && amountValue > 0 && (type !== "depense" || category);

  // Fermeture à la touche Échap.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus sur le montant à l'ouverture (saisie rapide).
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => amountRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  function reset() {
    setType("depense");
    setAmount("");
    setCategory(null);
    setDone(false);
  }

  function close() {
    setOpen(false);
  }

  function submit() {
    if (!canSubmit) return;
    // TODO: persister la transaction via Supabase.
    setDone(true);
    setTimeout(() => {
      close();
      // Laisse l'animation de fermeture se jouer avant le reset.
      setTimeout(reset, 250);
    }, 900);
  }

  return (
    <>
      {/* Bouton d'action flottant (+) */}
      <button
        type="button"
        aria-label="Ajouter une transaction"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="absolute bottom-[88px] right-5 z-30 flex size-14 items-center justify-center rounded-full bg-plum text-3xl font-bold leading-none text-white shadow-lg shadow-plum/30 transition active:scale-95"
      >
        <span className="-mt-1" aria-hidden>
          +
        </span>
      </button>

      {/* Voile */}
      <div
        onClick={close}
        aria-hidden
        className={`absolute inset-0 z-40 bg-graphite/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Feuille modale */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Saisie rapide d'une transaction"
        className={`absolute inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white p-5 shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="mx-auto mb-3 h-1 w-14 rounded-full bg-graphite/15" />

        {done ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-4xl" aria-hidden>
              ✅
            </span>
            <p className="text-lg font-bold text-success">Ajouté !</p>
          </div>
        ) : (
          <>
            <h2 className="text-[17px] font-bold text-graphite">
              Qu&apos;est-ce que tu ajoutes ?
            </h2>

            {/* Type */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {TYPES.map((t) => {
                const active = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setType(t.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl py-2.5 transition ${
                      active ? "bg-lavender/40" : "bg-graphite/5"
                    }`}
                  >
                    <span className="text-2xl" aria-hidden>
                      {t.icon}
                    </span>
                    <span
                      className={`text-xs ${
                        active ? "font-bold text-plum" : "font-medium text-graphite/60"
                      }`}
                    >
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Montant */}
            <div className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-graphite/5 py-4">
              <input
                ref={amountRef}
                inputMode="decimal"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9.,]/g, ""))
                }
                placeholder="0"
                aria-label="Montant en euros"
                className="w-32 bg-transparent text-right font-display text-3xl font-extrabold text-graphite outline-none placeholder:text-graphite/30"
              />
              <span className="font-display text-3xl font-extrabold text-graphite">
                €
              </span>
            </div>

            {/* Catégories (pour une dépense) */}
            {type === "depense" && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {CATEGORIES.map((c) => {
                  const active = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategory(c.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl py-3 transition ${
                        active ? "bg-lavender/40 ring-1 ring-plum/30" : "bg-graphite/5"
                      }`}
                    >
                      <span className="text-xl" aria-hidden>
                        {c.icon}
                      </span>
                      <span
                        className={`text-[11px] ${
                          active ? "font-bold text-plum" : "text-graphite/60"
                        }`}
                      >
                        {c.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Valider */}
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="mt-4 flex w-full items-center justify-center rounded-2xl bg-plum py-3.5 text-[17px] font-bold text-white shadow-md shadow-plum/20 transition active:scale-[0.99] disabled:opacity-40"
            >
              Valider
            </button>
          </>
        )}
      </div>
    </>
  );
}
