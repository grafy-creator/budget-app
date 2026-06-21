"use client";

import { useMemo, useState } from "react";
import { DayOfMonthPicker } from "@/components/DayOfMonthPicker";
import { DeleteButton } from "@/components/DeleteButton";
import { EditableAmount } from "@/components/EditableAmount";
import { MonthSelector } from "@/components/MonthSelector";
import {
  formatDateShort,
  formatDayOfMonth,
  formatEuro,
  todayISO,
} from "@/lib/format";
import { type Category } from "@/lib/mock";
import { ruleTargets, useData } from "@/lib/store";

const TABS = ["Dépenses", "Revenus", "Épargne"] as const;
type Tab = (typeof TABS)[number];

type ExpenseForm = {
  id: string | null;
  categoryId: string;
  label: string;
  amount: string;
  date: string;
};

const CHARGE_ICONS = ["🏠", "📺", "🎵", "📱", "💡", "🚗", "🏋️", "📦"];

type ChargeForm = {
  id: string | null;
  icon: string;
  label: string;
  dayOfMonth: number;
  amount: string;
};

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
  const pct = Math.min(100, Math.round((spent / (total || 1)) * 100));
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

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-plum text-white" : "bg-graphite/5 text-graphite/60"
      }`}
    >
      {label}
    </button>
  );
}

export function BudgetView() {
  const [tab, setTab] = useState<Tab>("Dépenses");
  const {
    charges,
    variables,
    categories,
    settings,
    addCharge,
    updateCharge,
    removeCharge,
    addVariable,
    updateVariable,
    removeVariable,
  } = useData();
  const targets = ruleTargets(settings);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm | null>(null);
  const [chargeForm, setChargeForm] = useState<ChargeForm | null>(null);
  const [depFilter, setDepFilter] = useState<string>("all"); // all | atrier | <categoryId>
  const [showAllCharges, setShowAllCharges] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const PREVIEW = 3;

  // Une dépense est « à trier » si sa catégorie est absente ou nommée « À trier ».
  const isATrier = (v: { categoryId?: string }) => {
    const c = categories.find((x) => x.id === v.categoryId);
    return !c || c.label.toLowerCase() === "à trier";
  };
  const aTrierCount = variables.filter(isATrier).length;
  const filteredVariables =
    depFilter === "all"
      ? variables
      : depFilter === "atrier"
        ? variables.filter(isATrier)
        : variables.filter((v) => v.categoryId === depFilter);
  const visibleCharges = showAllCharges ? charges : charges.slice(0, PREVIEW);
  const visibleExpenses = showAllExpenses
    ? filteredVariables
    : filteredVariables.slice(0, PREVIEW);

  function openNewCharge() {
    setChargeForm({
      id: null,
      icon: "🏠",
      label: "",
      dayOfMonth: 1,
      amount: "",
    });
  }
  function openEditCharge(id: string) {
    const c = charges.find((x) => x.id === id);
    if (!c) return;
    setChargeForm({
      id: c.id,
      icon: c.icon,
      label: c.label,
      dayOfMonth: c.dayOfMonth,
      amount: String(c.amount),
    });
  }
  function saveCharge() {
    if (!chargeForm || !chargeForm.label.trim()) return;
    const amount = parseFloat(chargeForm.amount.replace(",", ".")) || 0;
    const data = {
      icon: chargeForm.icon,
      label: chargeForm.label.trim(),
      dayOfMonth: chargeForm.dayOfMonth,
      amount,
    };
    if (chargeForm.id) updateCharge(chargeForm.id, data);
    else addCharge({ ...data, paid: false });
    setChargeForm(null);
  }

  function openNewExpense() {
    setExpenseForm({
      id: null,
      categoryId: categories[0]?.id ?? "",
      label: "",
      amount: "",
      date: todayISO(),
    });
  }
  function openEditExpense(id: string) {
    const e = variables.find((x) => x.id === id);
    if (!e) return;
    setExpenseForm({
      id: e.id,
      categoryId: e.categoryId ?? categories[0]?.id ?? "",
      label: e.label,
      amount: String(e.amount),
      date: e.date,
    });
  }
  function saveExpense() {
    if (!expenseForm) return;
    const amount = parseFloat(expenseForm.amount.replace(",", ".")) || 0;
    const cat = categories.find((c) => c.id === expenseForm.categoryId);
    const data = {
      label: expenseForm.label.trim() || cat?.label || "Dépense",
      date: expenseForm.date,
      amount,
      icon: cat?.icon ?? "📦",
      categoryId: expenseForm.categoryId,
    };
    if (expenseForm.id) updateVariable(expenseForm.id, data);
    else addVariable(data);
    setExpenseForm(null);
  }

  const fixedSpent = charges.reduce((s, c) => s + c.amount, 0);
  const variableSpent = variables.reduce((s, v) => s + v.amount, 0);
  const resteAPayer = useMemo(
    () => charges.filter((c) => !c.paid).reduce((s, c) => s + c.amount, 0),
    [charges],
  );

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <MonthSelector />

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
              total={targets.fixes}
              barClass="bg-plum"
            />
            <SummaryBar
              label="Charges variables"
              spent={variableSpent}
              total={targets.variables}
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

            {!chargeForm && (
              <button
                type="button"
                onClick={openNewCharge}
                className="rounded-lg bg-lavender/30 py-2.5 text-[13px] font-semibold text-plum transition active:scale-[0.99]"
              >
                + Ajouter une charge fixe
              </button>
            )}

            {chargeForm && chargeForm.id === null && (
              <ChargeFormPanel
                form={chargeForm}
                setForm={setChargeForm}
                onSave={saveCharge}
              />
            )}

            {visibleCharges.map((c) =>
              chargeForm && chargeForm.id === c.id ? (
                <ChargeFormPanel
                  key={c.id}
                  form={chargeForm}
                  setForm={setChargeForm}
                  onSave={saveCharge}
                />
              ) : (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 rounded-xl p-2.5 shadow-sm ${
                    c.paid ? "bg-success/5" : "bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openEditCharge(c.id)}
                    aria-label={`Modifier ${c.label}`}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-lavender/30 text-base"
                      aria-hidden
                    >
                      {c.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-graphite">
                        {c.label}
                      </span>
                      <span className="block truncate text-[11px] text-graphite/55">
                        {formatDayOfMonth(c.dayOfMonth)}
                      </span>
                    </span>
                  </button>
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
                  <DeleteButton
                    label={c.label}
                    onClick={() => removeCharge(c.id)}
                  />
                </div>
              ),
            )}
            {charges.length > PREVIEW && (
              <button
                type="button"
                onClick={() => setShowAllCharges((v) => !v)}
                className="self-center text-xs font-semibold text-plum"
              >
                {showAllCharges
                  ? "Voir moins"
                  : `Voir plus (${charges.length - PREVIEW})`}
              </button>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-graphite/50">
              Dépenses variables
            </h2>

            {/* Filtre */}
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              <FilterChip
                label="Toutes"
                active={depFilter === "all"}
                onClick={() => setDepFilter("all")}
              />
              <FilterChip
                label={`🗂️ À trier${aTrierCount ? ` (${aTrierCount})` : ""}`}
                active={depFilter === "atrier"}
                onClick={() => setDepFilter("atrier")}
              />
              {categories
                .filter((c) => c.label.toLowerCase() !== "à trier")
                .map((c) => (
                  <FilterChip
                    key={c.id}
                    label={`${c.icon} ${c.label}`}
                    active={depFilter === c.id}
                    onClick={() => setDepFilter(c.id)}
                  />
                ))}
            </div>

            {!expenseForm && (
              <button
                type="button"
                onClick={openNewExpense}
                className="rounded-lg bg-lavender/30 py-2.5 text-[13px] font-semibold text-plum transition active:scale-[0.99]"
              >
                + Ajouter une dépense
              </button>
            )}

            {expenseForm && expenseForm.id === null && (
              <ExpenseFormPanel
                form={expenseForm}
                setForm={setExpenseForm}
                categories={categories}
                onSave={saveExpense}
              />
            )}

            {visibleExpenses.map((e) =>
              expenseForm && expenseForm.id === e.id ? (
                <ExpenseFormPanel
                  key={e.id}
                  form={expenseForm}
                  setForm={setExpenseForm}
                  categories={categories}
                  onSave={saveExpense}
                />
              ) : (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => openEditExpense(e.id)}
                    aria-label={`Modifier ${e.label}`}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-lavender/30 text-base"
                      aria-hidden
                    >
                      {e.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-graphite">
                        {e.label}
                      </span>
                      <span className="block truncate text-[11px] text-graphite/55">
                        {formatDateShort(e.date)}
                      </span>
                    </span>
                  </button>
                  <EditableAmount
                    value={e.amount}
                    onCommit={(n) => updateVariable(e.id, { amount: n })}
                    sign="minus"
                    ariaLabel={`Montant de ${e.label}`}
                    className="shrink-0 text-sm font-bold text-violet"
                  />
                  <DeleteButton
                    label={e.label}
                    onClick={() => removeVariable(e.id)}
                  />
                </div>
              ),
            )}
            {filteredVariables.length === 0 && !expenseForm && (
              <p className="py-2 text-center text-xs text-graphite/40">
                {depFilter === "all"
                  ? "Aucune dépense variable. Ajoute-en une avec le bouton ci-dessus."
                  : "Aucune dépense dans ce filtre."}
              </p>
            )}
            {filteredVariables.length > PREVIEW && (
              <button
                type="button"
                onClick={() => setShowAllExpenses((v) => !v)}
                className="self-center text-xs font-semibold text-plum"
              >
                {showAllExpenses
                  ? "Voir moins"
                  : `Voir plus (${filteredVariables.length - PREVIEW})`}
              </button>
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

// Palette de couleurs pour les natures de revenu (par ordre d'apparition).
const TYPE_PALETTE = [
  { bar: "bg-plum", dot: "bg-plum", chipBg: "bg-plum/10", chipText: "text-plum" },
  { bar: "bg-violet", dot: "bg-violet", chipBg: "bg-violet/15", chipText: "text-violet" },
  { bar: "bg-success", dot: "bg-success", chipBg: "bg-success/15", chipText: "text-success" },
  { bar: "bg-warning", dot: "bg-warning", chipBg: "bg-warning/15", chipText: "text-warning" },
  { bar: "bg-lavender", dot: "bg-lavender", chipBg: "bg-lavender/50", chipText: "text-plum" },
];
const paletteFor = (i: number) =>
  TYPE_PALETTE[((i % TYPE_PALETTE.length) + TYPE_PALETTE.length) % TYPE_PALETTE.length];

type IncomeForm = {
  id: string | null;
  icon: string;
  label: string;
  source: string;
  typeId: string;
  amount: string;
  date: string;
};

/** Onglet Revenus : répartition par nature (natures gérées dans les Réglages). */
function RevenusTab() {
  const { income, incomeTypes, addIncome, updateIncome, removeIncome } =
    useData();
  const [form, setForm] = useState<IncomeForm | null>(null);

  const grandTotal = income.reduce((s, r) => s + r.amount, 0);
  const total = grandTotal || 1;
  const perType = incomeTypes
    .map((t, i) => ({
      type: t,
      palette: paletteFor(i),
      amount: income
        .filter((r) => r.typeId === t.id)
        .reduce((s, r) => s + r.amount, 0),
    }))
    .filter((x) => x.amount > 0);

  const typeIndex = (id: string) => incomeTypes.findIndex((t) => t.id === id);
  const typeLabel = (id: string) =>
    incomeTypes.find((t) => t.id === id)?.label ?? "Autre";

  function openNew() {
    setForm({
      id: null,
      icon: "💻",
      label: "",
      source: "",
      typeId: incomeTypes[0]?.id ?? "",
      amount: "",
      date: todayISO(),
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
      typeId: r.typeId,
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
      typeId: form.typeId || incomeTypes[0]?.id || "",
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
            {formatEuro(grandTotal)}
          </span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-graphite/10">
          {perType.map((p) => (
            <div
              key={p.type.id}
              className={`h-full ${p.palette.bar}`}
              style={{ width: `${(p.amount / total) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          {perType.map((p) => (
            <span key={p.type.id} className="flex items-center gap-1.5 text-graphite/60">
              <span className={`size-2 rounded-sm ${p.palette.dot}`} /> {p.type.label}{" "}
              {formatEuro(p.amount)}
            </span>
          ))}
          {perType.length === 0 && (
            <span className="text-graphite/40">Aucune entrée ce mois.</span>
          )}
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

        {form && form.id === null && (
          <IncomeFormPanel
            form={form}
            setForm={setForm}
            incomeTypes={incomeTypes}
            onSave={save}
          />
        )}

        {income.map((r) => {
          if (form && form.id === r.id) {
            return (
              <IncomeFormPanel
                key={r.id}
                form={form}
                setForm={setForm}
                incomeTypes={incomeTypes}
                onSave={save}
              />
            );
          }
          const pal = paletteFor(Math.max(0, typeIndex(r.typeId)));
          return (
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
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${pal.chipBg} ${pal.chipText}`}
                    >
                      {typeLabel(r.typeId)}
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
              <DeleteButton label={r.label} onClick={() => removeIncome(r.id)} />
            </div>
          );
        })}
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
  incomeTypes,
  onSave,
}: {
  form: IncomeForm;
  setForm: (f: IncomeForm | null) => void;
  incomeTypes: { id: string; label: string }[];
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-cloud p-3">
      {/* Nature du revenu (gérée dans les Réglages) */}
      <div className="flex flex-wrap gap-1.5">
        {incomeTypes.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={form.typeId === t.id}
            onClick={() => setForm({ ...form, typeId: t.id })}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              form.typeId === t.id
                ? "bg-lavender/50 text-plum"
                : "bg-white text-graphite/60"
            }`}
          >
            {t.label}
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
  const { accounts, settings, updateAccount, addContribution } = useData();
  const [versementFor, setVersementFor] = useState<string | null>(null);
  const [versementAmt, setVersementAmt] = useState("");
  const actual = accounts.reduce((s, a) => s + a.added, 0);
  const target = ruleTargets(settings).epargne;
  const pct = Math.min(100, Math.round((actual / (target || 1)) * 100));

  function commitVersement(id: string) {
    const n = parseFloat(versementAmt.replace(",", ".")) || 0;
    if (n > 0) addContribution(id, n);
    setVersementFor(null);
    setVersementAmt("");
  }

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
            className="flex flex-col gap-2 rounded-xl bg-white p-2.5 shadow-sm"
          >
            <div className="flex items-center gap-3">
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
                ariaLabel={`Versement du mois ${a.label}`}
                className="shrink-0 text-sm font-bold text-plum"
              />
            </div>

            {versementFor === a.id ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-1 rounded-lg bg-graphite/5 px-3 py-1.5">
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
                  className="rounded-lg bg-plum px-3 py-1.5 text-xs font-bold text-white"
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
                className="self-start text-[11px] font-semibold text-plum"
              >
                + Ajouter un versement
              </button>
            )}
          </div>
        ))}
      </section>
    </>
  );
}

/** Formulaire d'ajout / modification d'une dépense variable. */
function ExpenseFormPanel({
  form,
  setForm,
  categories,
  onSave,
}: {
  form: ExpenseForm;
  setForm: (f: ExpenseForm | null) => void;
  categories: Category[];
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-cloud p-3">
      {/* Catégorie */}
      <div className="grid grid-cols-3 gap-2">
        {categories.map((c) => {
          const active = form.categoryId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => setForm({ ...form, categoryId: c.id })}
              className={`flex flex-col items-center gap-1 rounded-lg py-2 transition ${
                active ? "bg-lavender/50 ring-1 ring-plum/30" : "bg-white"
              }`}
            >
              <span className="text-lg" aria-hidden>
                {c.icon}
              </span>
              <span
                className={`text-[10px] ${
                  active ? "font-bold text-plum" : "text-graphite/60"
                }`}
              >
                {c.label}
              </span>
            </button>
          );
        })}
      </div>
      <input
        value={form.label}
        onChange={(e) => setForm({ ...form, label: e.target.value })}
        placeholder="Libellé (optionnel)"
        aria-label="Libellé de la dépense"
        className="rounded-lg bg-white px-3 py-2 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
      />
      <div className="flex gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-white px-3 py-2">
          <span className="text-xs font-semibold text-graphite/50">📅</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            aria-label="Date de la dépense"
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
          className="flex-1 rounded-lg bg-plum py-2 text-sm font-bold text-white"
        >
          {form.id ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
    </div>
  );
}

/** Formulaire d'ajout / modification d'une charge fixe (synchronisé avec Réglages). */
function ChargeFormPanel({
  form,
  setForm,
  onSave,
}: {
  form: ChargeForm;
  setForm: (f: ChargeForm | null) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-cloud p-3">
      <div className="flex flex-wrap gap-1">
        {CHARGE_ICONS.map((ic) => (
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
        placeholder="Nom (ex : Assurance)"
        aria-label="Nom de la charge"
        className="rounded-lg bg-white px-3 py-2 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
      />
      <DayOfMonthPicker
        value={form.dayOfMonth}
        onChange={(d) => setForm({ ...form, dayOfMonth: d })}
      />
      <div className="flex items-center gap-2">
        <span className="text-xs text-graphite/55">Montant</span>
        <div className="ml-auto flex items-center gap-1 rounded-lg bg-white px-3 py-2">
          <input
            inputMode="decimal"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value.replace(/[^0-9.,]/g, "") })
            }
            placeholder="0"
            aria-label="Montant"
            className="w-20 bg-transparent text-right text-sm font-bold text-graphite outline-none"
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
