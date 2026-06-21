"use client";

import { useEffect, useRef, useState } from "react";
import { todayISO } from "@/lib/format";
import { useData } from "@/lib/store";
import { useQuickEntry } from "@/lib/quickEntry";

const TYPES = [
  { id: "depense", icon: "💸", label: "Dépense" },
  { id: "revenu", icon: "💰", label: "Revenu" },
  { id: "epargne", icon: "🐷", label: "Épargne" },
] as const;

type TypeId = (typeof TYPES)[number]["id"];

const A_TRIER = "À trier";

export function QuickEntry() {
  const {
    accounts,
    categories,
    incomeTypes,
    addVariable,
    addIncome,
    addContribution,
    addCategory,
    addAccount,
  } = useData();

  const { open, initialDate, openSheet, closeSheet } = useQuickEntry();
  const [type, setType] = useState<TypeId>("depense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string>("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [newCat, setNewCat] = useState<string | null>(null); // saisie nouvelle catégorie
  const [newAcc, setNewAcc] = useState<string | null>(null); // saisie nouveau compte
  const [done, setDone] = useState(false);
  const [dragY, setDragY] = useState(0); // glissement vers le bas (swipe to close)
  const dragStart = useRef<number | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const amountValue = parseFloat(amount.replace(",", "."));
  // La catégorie / le compte sont OPTIONNELS : seul le montant est requis.
  const canSubmit = !done && amountValue > 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeSheet]);

  useEffect(() => {
    if (open) {
      setDate(initialDate ?? todayISO());
      const t = setTimeout(() => amountRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open, initialDate]);

  // Réinitialise le glissement à la fermeture.
  useEffect(() => {
    if (!open) setDragY(0);
  }, [open]);

  function onDragStart(y: number) {
    dragStart.current = y;
  }
  function onDragMove(y: number) {
    if (dragStart.current != null) {
      const d = y - dragStart.current;
      if (d > 0) setDragY(d);
    }
  }
  function onDragEnd() {
    dragStart.current = null;
    if (dragY > 100) closeSheet();
    else setDragY(0);
  }

  // Pré-sélectionne la 1ère nature de revenu (toujours au moins une).
  useEffect(() => {
    if (type === "revenu" && !typeId && incomeTypes[0]) {
      setTypeId(incomeTypes[0].id);
    }
  }, [type, typeId, incomeTypes]);

  function reset() {
    setType("depense");
    setAmount("");
    setCategory(null);
    setTypeId("");
    setAccountId(null);
    setDate(todayISO());
    setNote("");
    setNewCat(null);
    setNewAcc(null);
    setDone(false);
  }

  // Crée une catégorie depuis la saisie et la sélectionne.
  async function createCategory() {
    const label = (newCat ?? "").trim();
    if (!label) return;
    const created = await addCategory({ label, icon: "🏷️" });
    if (created) setCategory(created.id);
    setNewCat(null);
  }

  async function createAccount() {
    const label = (newAcc ?? "").trim();
    if (!label) return;
    const created = await addAccount({
      label,
      icon: "🐷",
      before: 0,
      added: 0,
      balance: 0,
      goal: 0,
      projection: "",
    });
    if (created) setAccountId(created.id);
    setNewAcc(null);
  }

  // Repli « À trier » : retourne la catégorie à utiliser (existante, choisie, ou créée).
  async function resolveCategory() {
    if (category) {
      const c = categories.find((x) => x.id === category);
      if (c) return { id: c.id, icon: c.icon, label: c.label };
    }
    const existing = categories.find(
      (c) => c.label.toLowerCase() === A_TRIER.toLowerCase(),
    );
    if (existing) return { id: existing.id, icon: existing.icon, label: existing.label };
    const created = await addCategory({ label: A_TRIER, icon: "🗂️" });
    return { id: created?.id, icon: "🗂️", label: A_TRIER };
  }

  async function resolveAccountId() {
    if (accountId) return accountId;
    const existing = accounts.find(
      (a) => a.label.toLowerCase() === A_TRIER.toLowerCase(),
    );
    if (existing) return existing.id;
    const created = await addAccount({
      label: A_TRIER,
      icon: "🗂️",
      before: 0,
      added: 0,
      balance: 0,
      goal: 0,
      projection: "",
    });
    return created?.id;
  }

  async function submit() {
    if (!canSubmit) return;

    if (type === "depense") {
      const cat = await resolveCategory();
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
    } else if (type === "epargne") {
      const accId = await resolveAccountId();
      if (accId) addContribution(accId, amountValue);
    }

    setDone(true);
    setTimeout(() => {
      closeSheet();
      setTimeout(reset, 250);
    }, 900);
  }

  return (
    <>
      {/* Conteneur fixe centré sur la colonne (440px) pour ancrer le FAB au
          bas de l'écran du téléphone, au-dessus de la nav, sans bouger au scroll. */}
      <div className="pointer-events-none fixed bottom-0 left-1/2 z-30 h-0 w-full max-w-[440px] -translate-x-1/2">
        <button
          type="button"
          aria-label="Ajouter une transaction"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => openSheet()}
          className="pointer-events-auto absolute right-5 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] flex size-14 items-center justify-center rounded-full bg-plum text-3xl font-bold leading-none text-white shadow-lg shadow-plum/30 transition active:scale-95"
        >
          <span className="-mt-1" aria-hidden>
            +
          </span>
        </button>
      </div>

      <div
        onClick={closeSheet}
        aria-hidden
        className={`fixed inset-0 z-40 bg-graphite/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Saisie rapide d'une transaction"
        style={dragY ? { transform: `translate(-50%, ${dragY}px)` } : undefined}
        className={`fixed bottom-0 left-1/2 z-50 max-h-[90%] w-full max-w-[440px] -translate-x-1/2 overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl ${
          dragY ? "" : "transition-transform duration-300 ease-out"
        } ${open ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
      >
        {/* Poignée : glisser vers le bas pour fermer */}
        <div
          onTouchStart={(e) => onDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => onDragMove(e.touches[0].clientY)}
          onTouchEnd={onDragEnd}
          className="-mt-2 mb-1 flex cursor-grab justify-center py-2 active:cursor-grabbing"
        >
          <div className="h-1 w-14 rounded-full bg-graphite/20" />
        </div>

        {/* Croix de fermeture */}
        <button
          type="button"
          onClick={closeSheet}
          aria-label="Fermer"
          className="absolute right-4 top-3 flex size-8 items-center justify-center rounded-full bg-graphite/5 text-graphite/50 transition active:scale-90"
        >
          ✕
        </button>

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

            {/* Catégories (dépense) — optionnel, sinon « À trier » */}
            {type === "depense" && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-graphite/45">
                    Catégorie (optionnel)
                  </span>
                  {category && (
                    <button
                      type="button"
                      onClick={() => setCategory(null)}
                      className="text-[11px] font-medium text-graphite/45"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
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
                  {newCat === null && (
                    <button
                      type="button"
                      onClick={() => setNewCat("")}
                      className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-plum/30 py-3 text-plum"
                    >
                      <span className="text-xl" aria-hidden>
                        ➕
                      </span>
                      <span className="text-[11px] font-semibold">Nouvelle</span>
                    </button>
                  )}
                </div>
                {newCat !== null && (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") createCategory();
                        if (e.key === "Escape") setNewCat(null);
                      }}
                      placeholder="Nom de la catégorie"
                      aria-label="Nouvelle catégorie"
                      className="min-w-0 flex-1 rounded-lg bg-graphite/5 px-3 py-2 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
                    />
                    <button
                      type="button"
                      onClick={createCategory}
                      disabled={!newCat.trim()}
                      className="rounded-lg bg-plum px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                    >
                      Créer
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCat(null)}
                      className="rounded-lg bg-graphite/5 px-3 py-2 text-xs font-medium text-graphite/60"
                    >
                      Annuler
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-graphite/45">
                  Sans choix, la dépense ira dans « À trier ».
                </p>
              </div>
            )}

            {/* Nature de revenu */}
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

            {/* Compte (épargne) — optionnel, sinon « À trier » */}
            {type === "epargne" && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
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
                  {newAcc === null && (
                    <button
                      type="button"
                      onClick={() => setNewAcc("")}
                      className="flex items-center gap-1.5 rounded-xl border border-dashed border-plum/30 px-3 py-2 text-sm font-semibold text-plum"
                    >
                      <span aria-hidden>➕</span> Nouveau compte
                    </button>
                  )}
                </div>
                {newAcc !== null && (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={newAcc}
                      onChange={(e) => setNewAcc(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") createAccount();
                        if (e.key === "Escape") setNewAcc(null);
                      }}
                      placeholder="Nom du compte (ex : Livret A)"
                      aria-label="Nouveau compte"
                      className="min-w-0 flex-1 rounded-lg bg-graphite/5 px-3 py-2 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
                    />
                    <button
                      type="button"
                      onClick={createAccount}
                      disabled={!newAcc.trim()}
                      className="rounded-lg bg-plum px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                    >
                      Créer
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAcc(null)}
                      className="rounded-lg bg-graphite/5 px-3 py-2 text-xs font-medium text-graphite/60"
                    >
                      Annuler
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-graphite/45">
                  Sans choix, le versement ira dans « À trier ».
                </p>
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
