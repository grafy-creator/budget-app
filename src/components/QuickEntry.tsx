"use client";

import { useEffect, useRef, useState } from "react";
import { TODAY_ISO } from "@/lib/format";
import { useData } from "@/lib/store";

const TYPES = [
  { id: "depense", icon: "💸", label: "Dépense" },
  { id: "revenu", icon: "💰", label: "Revenu" },
  { id: "epargne", icon: "🐷", label: "Épargne" },
] as const;

type TypeId = (typeof TYPES)[number]["id"];

export function QuickEntry() {
  const {
    accounts,
    categories,
    incomeTypes,
    addVariable,
    addIncome,
    addContribution,
  } = useData();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TypeId>("depense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string>("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [date, setDate] = useState(TODAY_ISO);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const amountValue = parseFloat(amount.replace(",", "."));
  const canSubmit =
    !done &&
    amountValue > 0 &&
    (type !== "depense" || category) &&
    (type !== "epargne" || accountId);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => amountRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Pré-sélectionne la 1ère nature de revenu.
  useEffect(() => {
    if (type === "revenu" && !typeId && incomeTypes[0]) {
      setTypeId(incomeTypes[0].id);
    }
  }, [type, typeId, incomeTypes]);

  // Pré-sélectionne le 1er compte pour un versement d'épargne.
  useEffect(() => {
    if (type === "epargne" && !accountId && accounts[0]) {
      setAccountId(accounts[0].id);
    }
  }, [type, accountId, accounts]);

  function reset() {
    setType("depense");
    setAmount("");
    setCategory(null);
    setTypeId("");
    setAccountId(null);
    setDate(TODAY_ISO);
    setNote("");
    setDone(false);
  }

  function submit() {
    if (!canSubmit) return;

    if (type === "depense") {
      const cat = categories.find((c) => c.id === category)!;
      addVariable({
        label: note.trim() || cat.label,
        date: date.trim() || "—",
        amount: amountValue,
        icon: cat.icon,
        categoryId: cat.id,
      });
    } else if (type === "revenu") {
      const t = incomeTypes.find((x) => x.id === typeId);
      addIncome({
        label: note.trim() || t?.label || "Revenu",
        source: note.trim() || "—",
        date: date.trim() || "—",
        amount: amountValue,
        typeId: typeId || incomeTypes[0]?.id || "",
        icon: "💰",
      });
    } else if (type === "epargne" && accountId) {
      addContribution(accountId, amountValue);
    }

    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setTimeout(reset, 250);
    }, 900);
  }

  return (
    <>
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

      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`absolute inset-0 z-40 bg-graphite/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Saisie rapide d'une transaction"
        className={`absolute inset-x-0 bottom-0 z-50 max-h-[90%] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl transition-transform duration-300 ease-out ${
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
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder="0"
                aria-label="Montant en euros"
                className="w-32 bg-transparent text-right font-display text-3xl font-extrabold text-graphite outline-none placeholder:text-graphite/30"
              />
              <span className="font-display text-3xl font-extrabold text-graphite">
                €
              </span>
            </div>

            {/* Date + note (tous types) */}
            <div className="mt-3 flex flex-col gap-2">
              <label className="flex items-center gap-2 rounded-xl bg-graphite/5 px-3 py-2.5">
                <span className="text-xs font-semibold text-graphite/50">📅 Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-label="Date"
                  className="min-w-0 flex-1 bg-transparent text-right text-sm text-graphite outline-none [color-scheme:light]"
                />
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  type === "revenu"
                    ? "Note / client (ex : Studio Rin)"
                    : "Note (optionnel)"
                }
                aria-label="Note"
                className="rounded-xl bg-graphite/5 px-3 py-2.5 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
              />
            </div>

            {/* Catégories (dépense) */}
            {type === "depense" && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {categories.map((c) => {
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

            {/* Nature de revenu (gérée dans les Réglages) */}
            {type === "revenu" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {incomeTypes.map((t) => {
                  const active = typeId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTypeId(t.id)}
                      className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                        active ? "bg-lavender/40 text-plum" : "bg-graphite/5 text-graphite/60"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Compte (épargne) */}
            {type === "epargne" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {accounts.map((a) => {
                  const active = accountId === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setAccountId(a.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        active ? "bg-lavender/40 text-plum" : "bg-graphite/5 text-graphite/60"
                      }`}
                    >
                      <span aria-hidden>{a.icon}</span>
                      {a.label}
                    </button>
                  );
                })}
                {accounts.length === 0 && (
                  <p className="text-xs text-graphite/50">
                    Crée d&apos;abord un compte dans l&apos;onglet Épargne.
                  </p>
                )}
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
