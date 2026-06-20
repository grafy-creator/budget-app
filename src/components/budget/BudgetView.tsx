"use client";

import { useMemo, useState } from "react";
import { EditableAmount } from "@/components/EditableAmount";
import { MonthSelector } from "@/components/MonthSelector";
import { formatDateShort, formatEuro, TODAY_ISO } from "@/lib/format";
import { budget as mockBudget } from "@/lib/mock";
import { useData } from "@/lib/store";

const TABS = ["Dépenses", "Revenus", "Épargne"] as const;
type Tab = (typeof TABS)[number];

function SummaryBar({
  label,
  spent,
  total,
  barClass,
}: {
  label: string;
  spent: number;
  total: number;
  barClass: string;
}) {
  const pct = Math.min(100, Math.round((spent / total) * 100));
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs font-medium text-graphite/70">
          {label}
        </span>
        <span className="shrink-0 text-xs font-bold text-graphite">
          {formatEuro(spent)} / {formatEuro(total)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-graphite/10">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function BudgetView() {
  const [tab, setTab] = useState<Tab>("Dépenses");
  const { charges, variables, updateCharge, updateVariable } = useData();

  const fixedSpent = charges.reduce((s, c) => s + c.amount, 0);
  const variableSpent = variables.reduce((s, v) => s + v.amount, 0);
  const resteAPayer = useMemo(
    () => charges.filter((c) => !c.paid).reduce((s, c) => s + c.amount, 0),
    [charges],
  );

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <MonthSelector initial={mockBudget.monthLabel} />

      <div
        role="tablist"
        aria-label="Type de budget"
        className="grid grid-cols-3 gap-1 rounded-xl bg-graphite/5 p-1"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-lg py-2 text-[13px] font-bold transition ${
              tab === t
                ? "bg-plum text-white shadow-sm"
                : "text-graphite/55 hover:text-graphite"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Dépenses" && (
        <>
          <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <SummaryBar
              label="Charges fixes"
              spent={fixedSpent}
              total={mockBudget.fixedBudget}
              barClass="bg-plum"
            />
            <SummaryBar
              label="Charges variables"
              spent={variableSpent}
              total={mockBudget.variableBudget}
              barClass="bg-violet"
            />
            <p className="text-[11px] font-semibold text-warning">
              Reste à payer : {formatEuro(resteAPayer)}
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-graphite/50">
              Charges fixes
            </h2>
            {charges.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 rounded-xl p-2.5 shadow-sm ${
                  c.paid ? "bg-success/5" : "bg-white"
                }`}
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-lavender/30 text-base"
                  aria-hidden
                >
                  {c.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-graphite">
                    {c.label}
                  </p>
                  <p className="truncate text-[11px] text-graphite/55">{c.day}</p>
                </div>
                <EditableAmount
                  value={c.amount}
                  onCommit={(n) => updateCharge(c.id, { amount: n })}
                  ariaLabel={`Montant de ${c.label}`}
                  className="shrink-0 text-sm font-bold text-graphite"
                />
                <button
                  type="button"
                  aria-pressed={c.paid}
                  aria-label={
                    c.paid
                      ? `${c.label} payé, marquer comme non payé`
                      : `Marquer ${c.label} comme payé`
                  }
                  onClick={() => updateCharge(c.id, { paid: !c.paid })}
                  className={`flex size-7 shrink-0 items-center justify-center rounded-[14px] text-sm font-bold transition ${
                    c.paid
                      ? "bg-success text-white"
                      : "bg-graphite/10 text-graphite/40"
                  }`}
                >
                  {c.paid ? "✓" : "○"}
                </button>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-graphite/50">
              Dépenses variables
            </h2>
            {variables.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm"
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-lavender/30 text-base"
                  aria-hidden
                >
                  {e.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-graphite">
                    {e.label}
                  </p>
                  <p className="truncate text-[11px] text-graphite/55">
                    {formatDateShort(e.date)}
                  </p>
                </div>
                <EditableAmount
                  value={e.amount}
                  onCommit={(n) => updateVariable(e.id, { amount: n })}
                  sign="minus"
                  ariaLabel={`Montant de ${e.label}`}
                  className="shrink-0 text-sm font-bold text-violet"
                />
              </div>
            ))}
            {variables.length === 0 && (
              <p className="py-2 text-center text-xs text-graphite/40">
                Aucune dépense variable. Ajoute-en avec le bouton +.
              </p>
            )}
          </section>
        </>
      )}

      {tab === "Revenus" && <RevenusTab />}

      {tab === "Épargne" && <EpargneTab />}
    </div>
  );
}

const INCOME_ICONS = ["🎓", "💻", "🎨", "💰", "🏦", "📈", "🎁", "📦"];

type IncomeForm = {
  id: string | null;
  icon: string;
  label: string;
  source: string;
  subtype: "fixe" | "freelance";
  amount: string;
  date: string;
};

/** Onglet Revenus : distinction fixe (alternance) / freelance variable. */
function RevenusTab() {
  const { income, addIncome, updateIncome, removeIncome } = useData();
  const [form, setForm] = useState<IncomeForm | null>(null);

  const fixe = income
    .filter((r) => r.subtype === "fixe")
    .reduce((s, r) => s + r.amount, 0);
  const freelance = income
    .filter((r) => r.subtype === "freelance")
    .reduce((s, r) => s + r.amount, 0);
  const total = fixe + freelance || 1;

  function openNew() {
    setForm({
      id: null,
      icon: "💻",
      label: "",
      source: "",
      subtype: "freelance",
      amount: "",
      date: TODAY_ISO,
    });
  }
  function openEdit(id: string) {
    const r = income.find((x) => x.id === id);
    if (!r) return;
    setForm({
      id: r.id,
      icon: r.icon,
      label: r.label,
      source: r.source,
      subtype: r.subtype,
      amount: String(r.amount),
      date: r.date,
    });
  }
  function save() {
    if (!form || !form.label.trim()) return;
    const amount = parseFloat(form.amount.replace(",", ".")) || 0;
    const data = {
      icon: form.icon,
      label: form.label.trim(),
      source: form.source.trim() || "—",
      subtype: form.subtype,
      amount,
      date: form.date,
    };
    if (form.id) updateIncome(form.id, data);
    else addIncome(data);
    setForm(null);
  }

  return (
    <>
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-graphite/60">
            Total des revenus
          </span>
          <span className="font-display text-xl font-extrabold text-success">
            {formatEuro(fixe + freelance)}
          </span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-graphite/10">
          <div className="h-full bg-plum" style={{ width: `${(fixe / total) * 100}%` }} />
          <div
            className="h-full bg-violet"
            style={{ width: `${(freelance / total) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-graphite/60">
            <span className="size-2 rounded-sm bg-plum" /> Fixe {formatEuro(fixe)}
          </span>
          <span className="flex items-center gap-1.5 text-graphite/60">
            <span className="size-2 rounded-sm bg-violet" /> Freelance{" "}
            {formatEuro(freelance)}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-graphite/50">
          Entrées du mois
        </h2>

        {!form && (
          <button
            type="button"
            onClick={openNew}
            className="rounded-lg bg-lavender/30 py-2.5 text-[13px] font-semibold text-plum transition active:scale-[0.99]"
          >
            + Ajouter un revenu
          </button>
        )}

        {form && <IncomeFormPanel form={form} setForm={setForm} onSave={save} />}

        {income.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm"
          >
            <button
              type="button"
              onClick={() => openEdit(r.id)}
              aria-label={`Modifier ${r.label}`}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-lavender/30 text-base"
                aria-hidden
              >
                {r.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-graphite">
                    {r.label}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      r.subtype === "fixe"
                        ? "bg-plum/10 text-plum"
                        : "bg-violet/15 text-violet"
                    }`}
                  >
                    {r.subtype === "fixe" ? "Fixe" : "Freelance"}
                  </span>
                </span>
                <span className="block truncate text-[11px] text-graphite/55">
                  {r.source} · {formatDateShort(r.date)}
                </span>
              </span>
            </button>
            <EditableAmount
              value={r.amount}
              onCommit={(n) => updateIncome(r.id, { amount: n })}
              sign="plus"
              ariaLabel={`Montant de ${r.label}`}
              className="shrink-0 text-sm font-bold text-success"
            />
            <button
              type="button"
              aria-label={`Supprimer ${r.label}`}
              onClick={() => removeIncome(r.id)}
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-graphite/30 transition hover:bg-error/10 hover:text-error"
            >
              ✕
            </button>
          </div>
        ))}
        {income.length === 0 && !form && (
          <p className="py-2 text-center text-xs text-graphite/40">
            Aucun revenu. Ajoute-en un avec le bouton ci-dessus.
          </p>
        )}
      </section>
    </>
  );
}

/** Formulaire d'ajout / modification d'un revenu. */
function IncomeFormPanel({
  form,
  setForm,
  onSave,
}: {
  form: IncomeForm;
  setForm: (f: IncomeForm | null) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-cloud p-3">
      {/* Nature : fixe / freelance */}
      <div className="grid grid-cols-2 gap-2">
        {(["fixe", "freelance"] as const).map((st) => (
          <button
            key={st}
            type="button"
            aria-pressed={form.subtype === st}
            onClick={() => setForm({ ...form, subtype: st })}
            className={`rounded-lg py-2 text-xs font-bold transition ${
              form.subtype === st
                ? "bg-lavender/50 text-plum"
                : "bg-white text-graphite/60"
            }`}
          >
            {st === "fixe" ? "Fixe (alternance)" : "Freelance"}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {INCOME_ICONS.map((ic) => (
          <button
            key={ic}
            type="button"
            onClick={() => setForm({ ...form, icon: ic })}
            aria-label={`Icône ${ic}`}
            aria-pressed={form.icon === ic}
            className={`flex size-8 items-center justify-center rounded-lg text-base transition ${
              form.icon === ic ? "bg-lavender/60" : "bg-white"
            }`}
          >
            {ic}
          </button>
        ))}
      </div>
      <input
        value={form.label}
        onChange={(e) => setForm({ ...form, label: e.target.value })}
        placeholder="Libellé (ex : Refonte logo)"
        aria-label="Libellé du revenu"
        className="rounded-lg bg-white px-3 py-2 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
      />
      <input
        value={form.source}
        onChange={(e) => setForm({ ...form, source: e.target.value })}
        placeholder="Source / client (ex : Studio Rin)"
        aria-label="Source du revenu"
        className="rounded-lg bg-white px-3 py-2 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
      />
      <div className="flex gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-white px-3 py-2">
          <span className="text-xs font-semibold text-graphite/50">📅</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            aria-label="Date du revenu"
            className="min-w-0 flex-1 bg-transparent text-sm text-graphite outline-none [color-scheme:light]"
          />
        </label>
        <div className="flex items-center gap-1 rounded-lg bg-white px-3 py-2">
          <input
            inputMode="decimal"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value.replace(/[^0-9.,]/g, "") })
            }
            placeholder="0"
            aria-label="Montant"
            className="w-16 bg-transparent text-right text-sm font-bold text-graphite outline-none"
          />
          <span className="text-sm font-bold text-graphite">€</span>
        </div>
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
          onClick={onSave}
          disabled={!form.label.trim()}
          className="flex-1 rounded-lg bg-plum py-2 text-sm font-bold text-white disabled:opacity-40"
        >
          {form.id ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
    </div>
  );
}

/** Onglet Épargne : versements du mois par compte (objectif vs réel). */
function EpargneTab() {
  const { accounts, updateAccount } = useData();
  const actual = accounts.reduce((s, a) => s + a.added, 0);
  const target = mockBudget.savingsBudget;
  const pct = Math.min(100, Math.round((actual / target) * 100));

  return (
    <>
      <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-graphite/60">
            Épargné ce mois
          </span>
          <span className="text-sm font-bold text-graphite">
            {formatEuro(actual)} / {formatEuro(target)}
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-graphite/10"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Épargne du mois : ${pct}%`}
        >
          <div className="h-full rounded-full bg-plum" style={{ width: `${pct}%` }} />
        </div>
        {actual < target && (
          <p className="text-[11px] font-semibold text-warning">
            {`Reste ${formatEuro(target - actual)} pour atteindre l'objectif du mois.`}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-graphite/50">
          Versements du mois
        </h2>
        {accounts.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm"
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-lavender/30 text-base"
              aria-hidden
            >
              {a.icon}
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-graphite">
              {a.label}
            </p>
            <EditableAmount
              value={a.added}
              onCommit={(n) =>
                updateAccount(a.id, {
                  added: n,
                  balance: a.balance - a.added + n,
                })
              }
              sign="plus"
              ariaLabel={`Versement ${a.label}`}
              className="shrink-0 text-sm font-bold text-plum"
            />
          </div>
        ))}
      </section>
    </>
  );
}
