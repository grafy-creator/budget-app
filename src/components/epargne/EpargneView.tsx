"use client";

import { useState } from "react";
import { DeleteButton } from "@/components/DeleteButton";
import { EditableAmount } from "@/components/EditableAmount";
import { IconPicker } from "@/components/IconPicker";
import { formatEuro, formatDateShort, todayISO } from "@/lib/format";
import { savings as mockSavings } from "@/lib/mock";
import { useData } from "@/lib/store";

const ICONS = ["🐷", "🏦", "💰", "🏠", "🚗", "✈️", "🎓", "💍"];

type AccountForm = {
  id: string | null;
  icon: string;
  label: string;
  goal: string;
  solde: string; // solde actuel (argent déjà présent)
};

export function EpargneView() {
  const {
    accounts,
    withdrawals,
    addAccount,
    updateAccount,
    removeAccount,
    addContribution,
    addWithdrawal,
    repayWithdrawal,
    removeWithdrawal,
  } = useData();

  const [form, setForm] = useState<AccountForm | null>(null);
  const [versementFor, setVersementFor] = useState<string | null>(null);
  const [versementAmt, setVersementAmt] = useState("");
  const [retraitFor, setRetraitFor] = useState<string | null>(null);
  const [retraitAmt, setRetraitAmt] = useState("");
  const [retraitDate, setRetraitDate] = useState("");
  const [retraitNote, setRetraitNote] = useState("");

  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const unpaid = withdrawals.filter((w) => !w.repaid);
  const toRepay = unpaid.reduce((s, w) => s + w.amount, 0);

  function openNew() {
    setForm({ id: null, icon: "🐷", label: "", goal: "", solde: "" });
  }
  function openEdit(id: string) {
    const a = accounts.find((x) => x.id === id);
    if (!a) return;
    setForm({
      id: a.id,
      icon: a.icon,
      label: a.label,
      goal: String(a.goal ?? ""),
      solde: String(a.balance ?? ""),
    });
  }
  function saveForm() {
    if (!form || !form.label.trim()) return;
    const goal = parseFloat(form.goal.replace(",", ".")) || 0;
    const solde = parseFloat(form.solde.replace(",", ".")) || 0;
    if (form.id) {
      updateAccount(form.id, {
        icon: form.icon,
        label: form.label.trim(),
        goal,
        balance: solde,
      });
    } else {
      // Solde actuel = argent déjà présent : compte dans le total, sans être
      // un « ajout du mois » (added reste à 0).
      addAccount({
        icon: form.icon,
        label: form.label.trim(),
        goal,
        before: solde,
        added: 0,
        balance: solde,
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

  function commitRetrait(id: string) {
    const n = parseFloat(retraitAmt.replace(",", ".")) || 0;
    if (n > 0 && retraitDate.trim()) addWithdrawal(id, n, retraitDate, retraitNote.trim());
    setRetraitFor(null);
    setRetraitAmt("");
    setRetraitDate("");
    setRetraitNote("");
  }

  function renderAccountForm() {
    if (!form) return null;
    return (
      <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-graphite">
          {form.id ? "Modifier le compte" : "Nouveau compte d'épargne"}
        </p>
        <IconPicker
          value={form.icon}
          onChange={(ic) => setForm({ ...form, icon: ic })}
          presets={ICONS}
        />
        <input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Nom (ex : Livret A)"
          aria-label="Nom du compte"
          className="rounded-lg bg-graphite/5 px-3 py-2 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
        />
        <div className="flex items-center gap-1 rounded-lg bg-graphite/5 px-3 py-2">
          <span className="text-xs text-graphite/55">Solde actuel</span>
          <input
            inputMode="decimal"
            value={form.solde}
            onChange={(e) =>
              setForm({ ...form, solde: e.target.value.replace(/[^0-9.,]/g, "") })
            }
            placeholder="0"
            aria-label="Solde actuel"
            className="ml-auto w-20 bg-transparent text-right text-sm font-bold text-graphite outline-none"
          />
          <span className="text-sm font-bold text-graphite">€</span>
        </div>
        <p className="text-[11px] text-graphite/55">
          L&apos;argent déjà présent. Il compte dans le total sans être un « ajout du mois ».
        </p>
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
    );
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

      {/* Formulaire d'ajout (en haut) */}
      {form && form.id === null && renderAccountForm()}

      {/* Comptes */}
      {accounts.map((a) => {
        if (form && form.id === a.id) {
          return <div key={a.id}>{renderAccountForm()}</div>;
        }
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
              <DeleteButton label={a.label} onClick={() => removeAccount(a.id)} />
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

            {(() => {
              const accToRepay = unpaid
                .filter((w) => w.accountId === a.id)
                .reduce((s, w) => s + w.amount, 0);
              if (accToRepay <= 0) return null;
              return (
                <div className="flex items-center justify-between rounded-lg bg-warning/10 px-3 py-2">
                  <span className="text-[11px] font-semibold text-warning">
                    ⚠️ À rendre
                  </span>
                  <span className="text-sm font-bold text-warning">
                    {formatEuro(accToRepay)}
                  </span>
                </div>
              );
            })()}

            {/* Versement / Retrait */}
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
            ) : retraitFor === a.id ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1 rounded-lg bg-graphite/5 px-3 py-2">
                  <input
                    autoFocus
                    inputMode="decimal"
                    value={retraitAmt}
                    onChange={(e) =>
                      setRetraitAmt(e.target.value.replace(/[^0-9.,]/g, ""))
                    }
                    placeholder="Montant à retirer"
                    aria-label="Montant du retrait"
                    className="w-full bg-transparent text-sm font-bold text-graphite outline-none"
                  />
                  <span className="text-sm font-bold text-graphite">€</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex flex-1 items-center gap-2 rounded-lg bg-graphite/5 px-3 py-2">
                    <span className="text-xs font-semibold text-graphite/50">
                      📅 Date · requise
                    </span>
                    <input
                      type="date"
                      value={retraitDate}
                      onChange={(e) => setRetraitDate(e.target.value)}
                      aria-label="Date du retrait"
                      className="min-w-0 flex-1 bg-transparent text-right text-sm text-graphite outline-none [color-scheme:light]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setRetraitDate(todayISO())}
                    className="shrink-0 rounded-lg bg-lavender/30 px-3 py-2 text-xs font-bold text-plum transition active:scale-95"
                  >
                    Aujourd&apos;hui
                  </button>
                </div>
                <input
                  value={retraitNote}
                  onChange={(e) => setRetraitNote(e.target.value)}
                  placeholder="Note (ex : avance loyer)"
                  aria-label="Note du retrait"
                  className="rounded-lg bg-graphite/5 px-3 py-2 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRetraitFor(null)}
                    className="flex-1 rounded-lg bg-graphite/5 py-2 text-sm font-medium text-graphite/60"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => commitRetrait(a.id)}
                    disabled={!retraitAmt.trim() || !retraitDate.trim()}
                    className="flex-1 rounded-lg bg-plum py-2 text-sm font-bold text-white disabled:opacity-40"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVersementFor(a.id);
                    setVersementAmt("");
                  }}
                  className="flex-1 rounded-lg bg-lavender/30 py-2.5 text-[13px] font-semibold text-plum transition active:scale-[0.99]"
                >
                  + Versement
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRetraitFor(a.id);
                    setRetraitAmt("");
                    setRetraitDate("");
                    setRetraitNote("");
                  }}
                  className="flex-1 rounded-lg bg-graphite/5 py-2.5 text-[13px] font-semibold text-graphite/70 transition active:scale-[0.99]"
                >
                  − Retrait
                </button>
              </div>
            )}
          </section>
        );
      })}

      {accounts.length === 0 && (
        <p className="rounded-xl bg-lavender/25 px-3.5 py-3 text-center text-xs font-medium text-plum">
          Aucun compte d&apos;épargne. Ajoute-en un avec « + Compte ».
        </p>
      )}

      {/* À rendre — retraits non remboursés */}
      {unpaid.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-graphite">💸 À rendre</h2>
            <span className="font-display text-xl font-extrabold text-warning">
              {formatEuro(toRepay)}
            </span>
          </div>
          <p className="text-[11px] text-graphite/55">
            Argent retiré de ton épargne, à remettre.
          </p>
          <div className="flex flex-col gap-2">
            {unpaid.map((w) => {
              const acc = accounts.find((x) => x.id === w.accountId);
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-2 rounded-xl bg-graphite/5 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-graphite">
                      {formatEuro(w.amount)} · {acc?.label ?? "Compte"}
                    </p>
                    <p className="truncate text-[11px] text-graphite/55">
                      {formatDateShort(w.date)}
                      {w.note ? ` · ${w.note}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => repayWithdrawal(w.id)}
                    className="shrink-0 rounded-lg bg-success/15 px-3 py-2 text-xs font-bold text-success transition active:scale-95"
                  >
                    Rembourser
                  </button>
                  <DeleteButton
                    label={`retrait de ${formatEuro(w.amount)}`}
                    onClick={() => removeWithdrawal(w.id)}
                  />
                </div>
              );
            })}
          </div>
        </section>
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
