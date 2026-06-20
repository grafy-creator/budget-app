"use client";

import { useState } from "react";
import { EditableAmount } from "@/components/EditableAmount";
import { formatEuro } from "@/lib/format";
import { savings as mockSavings } from "@/lib/mock";
import { useData } from "@/lib/store";

const ICONS = ["🐷", "🏦", "💰", "🏠", "🚗", "✈️", "🎓", "💍"];

type AccountForm = {
  id: string | null;
  icon: string;
  label: string;
  goal: string;
};

export function EpargneView() {
  const { accounts, addAccount, updateAccount, removeAccount, addContribution } =
    useData();

  const [form, setForm] = useState<AccountForm | null>(null);
  const [versementFor, setVersementFor] = useState<string | null>(null);
  const [versementAmt, setVersementAmt] = useState("");

  const total = accounts.reduce((s, a) => s + a.balance, 0);

  function openNew() {
    setForm({ id: null, icon: "🐷", label: "", goal: "" });
  }
  function openEdit(id: string) {
    const a = accounts.find((x) => x.id === id);
    if (!a) return;
    setForm({ id: a.id, icon: a.icon, label: a.label, goal: String(a.goal ?? "") });
  }
  function saveForm() {
    if (!form || !form.label.trim()) return;
    const goal = parseFloat(form.goal.replace(",", ".")) || 0;
    if (form.id) {
      updateAccount(form.id, { icon: form.icon, label: form.label.trim(), goal });
    } else {
      addAccount({
        icon: form.icon,
        label: form.label.trim(),
        goal,
        before: 0,
        added: 0,
        balance: 0,
        projection: "",
      });
    }
    setForm(null);
  }

  function commitVersement(id: string) {
    const n = parseFloat(versementAmt.replace(",", ".")) || 0;
    if (n > 0) addContribution(id, n);
    setVersementFor(null);
    setVersementAmt("");
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-graphite">
            Mon Épargne
          </h1>
          <p className="text-[13px] font-medium text-graphite/55">
            {mockSavings.monthLabel}
          </p>
        </div>
        {!form && (
          <button
            type="button"
            onClick={openNew}
            className="shrink-0 rounded-full bg-lavender/30 px-3 py-2 text-xs font-bold text-plum transition active:scale-95"
          >
            + Compte
          </button>
        )}
      </header>

      {/* Total */}
      <section className="rounded-2xl bg-plum p-4 text-white shadow-lg shadow-plum/20">
        <p className="text-xs font-medium text-white/70">
          Total de toute ton épargne
        </p>
        <p className="mt-1 font-display text-3xl font-extrabold">
          {formatEuro(total)}
        </p>
      </section>

      {/* Formulaire ajout / édition de compte */}
      {form && (
        <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-graphite">
            {form.id ? "Modifier le compte" : "Nouveau compte d'épargne"}
          </p>
          <div className="flex flex-wrap gap-1">
            {ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setForm({ ...form, icon: ic })}
                aria-label={`Icône ${ic}`}
                aria-pressed={form.icon === ic}
                className={`flex size-8 items-center justify-center rounded-lg text-base transition ${
                  form.icon === ic ? "bg-lavender/60" : "bg-graphite/5"
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Nom (ex : Livret A)"
            aria-label="Nom du compte"
            className="rounded-lg bg-graphite/5 px-3 py-2 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
          />
          <div className="flex items-center gap-1 rounded-lg bg-graphite/5 px-3 py-2">
            <span className="text-xs text-graphite/55">Objectif</span>
            <input
              inputMode="decimal"
              value={form.goal}
              onChange={(e) =>
                setForm({ ...form, goal: e.target.value.replace(/[^0-9.,]/g, "") })
              }
              placeholder="0"
              aria-label="Objectif"
              className="ml-auto w-20 bg-transparent text-right text-sm font-bold text-graphite outline-none"
            />
            <span className="text-sm font-bold text-graphite">€</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm(null)}
              className="flex-1 rounded-lg bg-graphite/5 py-2 text-sm font-medium text-graphite/60"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={saveForm}
              disabled={!form.label.trim()}
              className="flex-1 rounded-lg bg-plum py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              {form.id ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </section>
      )}

      {/* Comptes */}
      {accounts.map((a) => {
        const pct = a.goal
          ? Math.min(100, Math.round((a.balance / a.goal) * 100))
          : 0;
        return (
          <section
            key={a.id}
            className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>
                {a.icon}
              </span>
              <h2 className="flex-1 truncate text-lg font-bold text-graphite">
                {a.label}
              </h2>
              {a.badge && (
                <span className="rounded-full bg-lavender/40 px-2.5 py-1 text-[10px] font-bold text-plum">
                  {a.badge}
                </span>
              )}
              <button
                type="button"
                onClick={() => openEdit(a.id)}
                aria-label={`Modifier ${a.label}`}
                className="flex size-7 items-center justify-center rounded-full text-graphite/40 transition hover:bg-graphite/5"
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={() => removeAccount(a.id)}
                aria-label={`Supprimer ${a.label}`}
                className="flex size-7 items-center justify-center rounded-full text-graphite/30 transition hover:bg-error/10 hover:text-error"
              >
                ✕
              </button>
            </div>

            <div className="h-px bg-graphite/10" />

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-graphite/55">Ajouté ce mois</span>
              <EditableAmount
                value={a.added}
                onCommit={(n) => updateAccount(a.id, { added: n })}
                sign="plus"
                ariaLabel={`Ajouté ce mois sur ${a.label}`}
                className="text-sm font-bold text-success"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-graphite/60">
                Solde actuel
              </span>
              <EditableAmount
                value={a.balance}
                onCommit={(n) => updateAccount(a.id, { balance: n })}
                ariaLabel={`Solde de ${a.label}`}
                className="font-display text-2xl font-extrabold text-plum"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-graphite/60">
                  Objectif :{" "}
                  <EditableAmount
                    value={a.goal ?? 0}
                    onCommit={(n) => updateAccount(a.id, { goal: n })}
                    ariaLabel={`Objectif de ${a.label}`}
                    className="font-bold text-graphite/70"
                  />
                </span>
                <span className="font-bold text-plum">{pct}%</span>
              </div>
              <div
                className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-graphite/10"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progression de ${a.label} : ${pct}%`}
              >
                <div className="h-full rounded-full bg-plum" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Ajouter un versement */}
            {versementFor === a.id ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-1 rounded-lg bg-graphite/5 px-3 py-2">
                  <input
                    autoFocus
                    inputMode="decimal"
                    value={versementAmt}
                    onChange={(e) =>
                      setVersementAmt(e.target.value.replace(/[^0-9.,]/g, ""))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitVersement(a.id);
                      if (e.key === "Escape") setVersementFor(null);
                    }}
                    placeholder="Montant à ajouter"
                    aria-label="Montant du versement"
                    className="w-full bg-transparent text-sm font-bold text-graphite outline-none"
                  />
                  <span className="text-sm font-bold text-graphite">€</span>
                </div>
                <button
                  type="button"
                  onClick={() => commitVersement(a.id)}
                  className="rounded-lg bg-plum px-4 py-2 text-sm font-bold text-white"
                >
                  Ajouter
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setVersementFor(a.id);
                  setVersementAmt("");
                }}
                className="rounded-lg bg-lavender/30 py-2.5 text-[13px] font-semibold text-plum transition active:scale-[0.99]"
              >
                + Ajouter un versement
              </button>
            )}
          </section>
        );
      })}

      {accounts.length === 0 && (
        <p className="rounded-xl bg-lavender/25 px-3.5 py-3 text-center text-xs font-medium text-plum">
          Aucun compte d&apos;épargne. Ajoute-en un avec « + Compte ».
        </p>
      )}

      {/* Simulateur */}
      <section className="flex flex-col gap-1.5 rounded-2xl bg-lavender/25 p-4">
        <p className="text-[13px] font-semibold text-plum">
          💡 Et si tu épargnais {formatEuro(mockSavings.simulator.monthly)}/mois ?
        </p>
        <p className="text-xs text-plum/80">
          Tu atteindrais {formatEuro(mockSavings.simulator.target)} en{" "}
          {mockSavings.simulator.eta}
        </p>
        <p className="text-[11px] font-medium text-success">
          Soit {mockSavings.simulator.saved} 🎉
        </p>
      </section>
    </div>
  );
}
