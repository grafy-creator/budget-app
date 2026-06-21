"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DayOfMonthPicker } from "@/components/DayOfMonthPicker";
import { DeleteButton } from "@/components/DeleteButton";
import { EditableAmount } from "@/components/EditableAmount";
import { IconPicker } from "@/components/IconPicker";
import { formatDayOfMonth, formatEuro } from "@/lib/format";
import { isAssistantEnabled, setAssistantEnabled } from "@/lib/assistant";
import { createClient } from "@/lib/supabase/client";
import { useData, type RuleKey } from "@/lib/store";

const RULES: { key: RuleKey; label: string; accent: string }[] = [
  { key: "besoins", label: "Charges fixes (Besoins)", accent: "accent-plum" },
  { key: "envies", label: "Variables (Envies)", accent: "accent-violet" },
  { key: "epargne", label: "Épargne", accent: "accent-success" },
];

const ICONS = ["🏠", "📺", "🎵", "📱", "💡", "🚗", "🏋️", "📦"];
const CAT_ICONS = ["🛒", "🍽️", "🚗", "💊", "🎮", "📦", "👕", "🎁", "☕", "🐾"];

/** Ligne de règle : pourcentage et montant liés (calculés sur le revenu cible). */
function RuleRow({
  label,
  accent,
  pct,
  revenu,
  onChangePct,
}: {
  label: string;
  accent: string;
  pct: number;
  revenu: number;
  onChangePct: (pct: number) => void;
}) {
  const amount = Math.round((revenu * pct) / 100);
  const [pctDraft, setPctDraft] = useState(String(pct));
  const [amtDraft, setAmtDraft] = useState(String(amount));

  useEffect(() => {
    setPctDraft(String(pct));
    setAmtDraft(String(Math.round((revenu * pct) / 100)));
  }, [pct, revenu]);

  const clamp = (n: number) => Math.max(0, Math.min(100, n));

  function commitPct() {
    onChangePct(clamp(parseInt(pctDraft || "0", 10) || 0));
  }
  function commitAmt() {
    const a = parseFloat(amtDraft.replace(",", ".")) || 0;
    onChangePct(revenu > 0 ? clamp(Math.round((a / revenu) * 100)) : 0);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs font-medium text-graphite/70">
          {label}
        </span>
        <div className="flex shrink-0 items-center gap-2 text-xs font-bold text-graphite">
          <span className="flex items-center rounded-md bg-graphite/5 px-2 py-1">
            <input
              inputMode="numeric"
              value={pctDraft}
              onChange={(e) => setPctDraft(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={commitPct}
              onKeyDown={(e) => e.key === "Enter" && commitPct()}
              aria-label={`Pourcentage ${label}`}
              className="w-7 bg-transparent text-right outline-none"
            />
            %
          </span>
          <span className="text-graphite/25">·</span>
          <span className="flex items-center rounded-md bg-graphite/5 px-2 py-1">
            <input
              inputMode="numeric"
              value={amtDraft}
              onChange={(e) => setAmtDraft(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={commitAmt}
              onKeyDown={(e) => e.key === "Enter" && commitAmt()}
              aria-label={`Montant ${label}`}
              className="w-12 bg-transparent text-right outline-none"
            />
            €
          </span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={(e) => onChangePct(Number(e.target.value))}
        aria-label={`Curseur ${label}`}
        className={`mt-2 h-2 w-full cursor-pointer ${accent}`}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-wide text-graphite/50">
      {children}
    </h2>
  );
}

type FormState = {
  id: string | null; // null = nouvelle charge
  icon: string;
  label: string;
  dayOfMonth: number;
  amount: string;
};

const EMPTY_FORM: FormState = {
  id: null,
  icon: "🏠",
  label: "",
  dayOfMonth: 1,
  amount: "",
};

export function ReglagesView() {
  const {
    charges,
    addCharge,
    updateCharge,
    removeCharge,
    categories,
    addCategory,
    updateCategory,
    removeCategory,
    incomeTypes,
    addIncomeType,
    updateIncomeType,
    removeIncomeType,
    settings,
    setRevenuCible,
    setReminder,
    setRulePct,
  } = useData();

  const router = useRouter();
  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const [assistantOn, setAssistantOn] = useState(true);
  useEffect(() => setAssistantOn(isAssistantEnabled()), []);
  function toggleAssistant() {
    const v = !assistantOn;
    setAssistantOn(v);
    setAssistantEnabled(v);
  }

  const [revenuDraft, setRevenuDraft] = useState(String(settings.revenuCible));
  const [revenuSaved, setRevenuSaved] = useState(false);
  const parseAmount = (s: string) => parseFloat(s.replace(",", ".")) || 0;
  const revenuDirty = parseAmount(revenuDraft) !== settings.revenuCible;

  function commitRevenu() {
    setRevenuCible(parseAmount(revenuDraft));
    setRevenuSaved(true);
    window.setTimeout(() => setRevenuSaved(false), 1600);
  }

  const [form, setForm] = useState<FormState | null>(null);
  const [showAllCharges, setShowAllCharges] = useState(false);
  const CHARGES_PREVIEW = 4;
  const [catForm, setCatForm] = useState<{
    id: string | null;
    icon: string;
    label: string;
    budget: string;
  } | null>(null);

  function saveCat() {
    if (!catForm || !catForm.label.trim()) return;
    const budget = parseFloat(catForm.budget.replace(",", ".")) || 0;
    if (catForm.id) {
      updateCategory(catForm.id, {
        icon: catForm.icon,
        label: catForm.label.trim(),
        budget,
      });
    } else {
      addCategory({ icon: catForm.icon, label: catForm.label.trim(), budget });
    }
    setCatForm(null);
  }

  const pctByKey: Record<RuleKey, number> = {
    besoins: settings.pctBesoins,
    envies: settings.pctEnvies,
    epargne: settings.pctEpargne,
  };
  const total = settings.pctBesoins + settings.pctEnvies + settings.pctEpargne;
  const totalAmount = Math.round((settings.revenuCible * total) / 100);

  const [typeForm, setTypeForm] = useState<{ id: string | null; label: string } | null>(
    null,
  );
  function saveType() {
    if (!typeForm || !typeForm.label.trim()) return;
    if (typeForm.id) updateIncomeType(typeForm.id, { label: typeForm.label.trim() });
    else addIncomeType({ label: typeForm.label.trim() });
    setTypeForm(null);
  }

  function openNew() {
    setForm({ ...EMPTY_FORM });
  }
  function openEdit(id: string) {
    const c = charges.find((x) => x.id === id);
    if (!c) return;
    setForm({
      id: c.id,
      icon: c.icon,
      label: c.label,
      dayOfMonth: c.dayOfMonth,
      amount: String(c.amount),
    });
  }
  function save() {
    if (!form) return;
    const amount = parseFloat(form.amount.replace(",", ".")) || 0;
    if (!form.label.trim()) return;
    if (form.id) {
      updateCharge(form.id, {
        icon: form.icon,
        label: form.label.trim(),
        dayOfMonth: form.dayOfMonth,
        amount,
      });
    } else {
      addCharge({
        icon: form.icon,
        label: form.label.trim(),
        dayOfMonth: form.dayOfMonth,
        amount,
        paid: false,
      });
    }
    setForm(null);
  }

  function renderChargeForm() {
    if (!form) return null;
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-cloud p-3">
        <IconPicker
          value={form.icon}
          onChange={(ic) => setForm({ ...form, icon: ic })}
          presets={ICONS}
        />
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
                setForm({
                  ...form,
                  amount: e.target.value.replace(/[^0-9.,]/g, ""),
                })
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
            onClick={save}
            disabled={!form.label.trim()}
            className="flex-1 rounded-lg bg-plum py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            {form.id ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <h1 className="font-display text-2xl font-extrabold text-graphite">
        Réglages
      </h1>

      {/* Revenu cible */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Mon revenu cible</SectionTitle>
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>
              💰
            </span>
            <div className="flex flex-1 items-center gap-1 rounded-lg bg-graphite/5 px-3 py-2">
              <input
                inputMode="decimal"
                value={revenuDraft}
                onChange={(e) =>
                  setRevenuDraft(e.target.value.replace(/[^0-9.,]/g, ""))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    commitRevenu();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                aria-label="Revenu mensuel cible en euros"
                className="w-full bg-transparent font-display text-xl font-extrabold text-success outline-none"
              />
              <span className="font-display text-xl font-extrabold text-success">
                €
              </span>
            </div>
            <button
              type="button"
              onClick={commitRevenu}
              disabled={!revenuDirty}
              className="shrink-0 rounded-lg bg-plum px-4 py-2 text-sm font-bold text-white transition active:scale-95 disabled:opacity-40"
            >
              Valider
            </button>
          </div>
          {revenuSaved ? (
            <p className="text-[11px] font-semibold text-success">
              ✓ Revenu cible enregistré — répercuté sur le budget et le bilan.
            </p>
          ) : revenuDirty ? (
            <p className="text-[11px] font-medium text-warning">
              Appuie sur « Valider » pour enregistrer.
            </p>
          ) : null}
        </div>
      </section>

      {/* Règle budgétaire */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Ma règle budgétaire</SectionTitle>
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
          {RULES.map((r) => (
            <RuleRow
              key={r.key}
              label={r.label}
              accent={r.accent}
              pct={pctByKey[r.key]}
              revenu={settings.revenuCible}
              onChangePct={(pct) => setRulePct(r.key, pct)}
            />
          ))}
          <p
            className={`text-xs font-bold ${
              total === 100 ? "text-success" : "text-warning"
            }`}
          >
            Total : {total}% · {formatEuro(totalAmount)}{" "}
            {total === 100 ? "✓" : "⚠️ (vise 100 %)"}
          </p>
        </div>
      </section>

      {/* Charges récurrentes */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Mes charges récurrentes</SectionTitle>
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm">
          {!form && (
            <button
              type="button"
              onClick={openNew}
              className="rounded-lg bg-lavender/30 py-2.5 text-[13px] font-semibold text-plum transition active:scale-[0.99]"
            >
              + Ajouter une charge
            </button>
          )}

          {/* Formulaire d'ajout (en haut) */}
          {form && form.id === null && renderChargeForm()}

          {(showAllCharges ? charges : charges.slice(0, CHARGES_PREVIEW)).map((c) =>
            form && form.id === c.id ? (
              <div key={c.id}>{renderChargeForm()}</div>
            ) : (
              <div key={c.id} className="flex items-center gap-3 py-1">
                <button
                  type="button"
                  onClick={() => openEdit(c.id)}
                  aria-label={`Modifier ${c.label}`}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-graphite/5 text-base"
                    aria-hidden
                  >
                    {c.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-graphite">
                      {c.label}
                    </span>
                    <span className="block truncate text-[11px] text-graphite/55">
                      {formatDayOfMonth(c.dayOfMonth)} · modifier
                    </span>
                  </span>
                </button>
                <EditableAmount
                  value={c.amount}
                  onCommit={(n) => updateCharge(c.id, { amount: n })}
                  ariaLabel={`Montant de ${c.label}`}
                  className="shrink-0 text-sm font-bold text-graphite"
                />
                <DeleteButton label={c.label} onClick={() => removeCharge(c.id)} />
              </div>
            ),
          )}
          {charges.length === 0 && (
            <p className="py-2 text-center text-xs text-graphite/40">
              Aucune charge récurrente.
            </p>
          )}
          {charges.length > CHARGES_PREVIEW && (
            <button
              type="button"
              onClick={() => setShowAllCharges((v) => !v)}
              className="self-center text-xs font-semibold text-plum"
            >
              {showAllCharges
                ? "Voir moins"
                : `Voir plus (${charges.length - CHARGES_PREVIEW})`}
            </button>
          )}
        </div>
      </section>

      {/* Catégories de dépenses */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Mes catégories de dépenses</SectionTitle>
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm">
          {!catForm && (
            <button
              type="button"
              onClick={() => setCatForm({ id: null, icon: "🛒", label: "", budget: "" })}
              className="rounded-lg bg-lavender/30 py-2.5 text-[13px] font-semibold text-plum transition active:scale-[0.99]"
            >
              + Ajouter une catégorie
            </button>
          )}

          {catForm && (
            <div className="flex flex-col gap-2 rounded-xl bg-cloud p-3">
              <IconPicker
                value={catForm.icon}
                onChange={(ic) => setCatForm({ ...catForm, icon: ic })}
                presets={CAT_ICONS}
              />
              <input
                value={catForm.label}
                onChange={(e) => setCatForm({ ...catForm, label: e.target.value })}
                placeholder="Nom (ex : Abonnements)"
                aria-label="Nom de la catégorie"
                className="rounded-lg bg-white px-3 py-2 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
              />
              <div className="flex items-center gap-1 rounded-lg bg-white px-3 py-2">
                <span className="text-xs text-graphite/55">Prévu / mois</span>
                <input
                  inputMode="decimal"
                  value={catForm.budget}
                  onChange={(e) =>
                    setCatForm({
                      ...catForm,
                      budget: e.target.value.replace(/[^0-9.,]/g, ""),
                    })
                  }
                  placeholder="0"
                  aria-label="Budget prévu par mois"
                  className="ml-auto w-20 bg-transparent text-right text-sm font-bold text-graphite outline-none"
                />
                <span className="text-sm font-bold text-graphite">€</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCatForm(null)}
                  className="flex-1 rounded-lg bg-graphite/5 py-2 text-sm font-medium text-graphite/60"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={saveCat}
                  disabled={!catForm.label.trim()}
                  className="flex-1 rounded-lg bg-plum py-2 text-sm font-bold text-white disabled:opacity-40"
                >
                  {catForm.id ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 rounded-full bg-graphite/5 py-1.5 pl-3 pr-1.5"
              >
                <button
                  type="button"
                  onClick={() =>
                    setCatForm({
                      id: c.id,
                      icon: c.icon,
                      label: c.label,
                      budget: c.budget ? String(c.budget) : "",
                    })
                  }
                  aria-label={`Modifier ${c.label}`}
                  className="flex items-center gap-1.5 text-sm font-medium text-graphite"
                >
                  <span aria-hidden>{c.icon}</span>
                  {c.label}
                  {c.budget ? (
                    <span className="text-[10px] font-bold text-plum/60">
                      · {formatEuro(c.budget)}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  aria-label={`Supprimer ${c.label}`}
                  onClick={() => removeCategory(c.id)}
                  className="flex size-5 items-center justify-center rounded-full text-graphite/40 transition hover:bg-error/10 hover:text-error"
                >
                  ✕
                </button>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="py-2 text-center text-xs text-graphite/40">
                Aucune catégorie.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Types de revenus */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Mes natures de revenu</SectionTitle>
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm">
          {!typeForm && (
            <button
              type="button"
              onClick={() => setTypeForm({ id: null, label: "" })}
              className="rounded-lg bg-lavender/30 py-2.5 text-[13px] font-semibold text-plum transition active:scale-[0.99]"
            >
              + Ajouter une nature de revenu
            </button>
          )}

          {typeForm && (
            <div className="flex flex-col gap-2 rounded-xl bg-cloud p-3">
              <input
                value={typeForm.label}
                onChange={(e) => setTypeForm({ ...typeForm, label: e.target.value })}
                placeholder="Nom (ex : Aides, Loyers perçus…)"
                aria-label="Nom de la nature de revenu"
                className="rounded-lg bg-white px-3 py-2 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTypeForm(null)}
                  className="flex-1 rounded-lg bg-graphite/5 py-2 text-sm font-medium text-graphite/60"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={saveType}
                  disabled={!typeForm.label.trim()}
                  className="flex-1 rounded-lg bg-plum py-2 text-sm font-bold text-white disabled:opacity-40"
                >
                  {typeForm.id ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {incomeTypes.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-1.5 rounded-full bg-graphite/5 py-1.5 pl-3 pr-1.5"
              >
                <button
                  type="button"
                  onClick={() => setTypeForm({ id: t.id, label: t.label })}
                  aria-label={`Modifier ${t.label}`}
                  className="text-sm font-medium text-graphite"
                >
                  {t.label}
                </button>
                <button
                  type="button"
                  aria-label={`Supprimer ${t.label}`}
                  onClick={() => removeIncomeType(t.id)}
                  className="flex size-5 items-center justify-center rounded-full text-graphite/40 transition hover:bg-error/10 hover:text-error"
                >
                  ✕
                </button>
              </div>
            ))}
            {incomeTypes.length === 0 && (
              <p className="py-2 text-center text-xs text-graphite/40">
                Aucune nature de revenu.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Assistant */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Assistant</SectionTitle>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-graphite">
              Assistant à l&apos;ouverture
            </p>
            <p className="text-xs text-graphite/55">
              T&apos;accueille à l&apos;ouverture pour ajouter, consulter ou
              mettre à jour le mois.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={assistantOn}
            aria-label="Afficher l'assistant à l'ouverture"
            onClick={toggleAssistant}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              assistantOn ? "bg-success" : "bg-graphite/20"
            }`}
          >
            <span
              className={`absolute top-1 size-4 rounded-full bg-white transition-all ${
                assistantOn ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Rappels */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Rappels</SectionTitle>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-graphite">Rappel du soir</p>
            <p className="text-xs text-graphite/55">
              Si tu ouvres l&apos;app après 20h sans avoir rien noté
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.reminder}
            aria-label="Activer le rappel quotidien"
            onClick={() => setReminder(!settings.reminder)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              settings.reminder ? "bg-success" : "bg-graphite/20"
            }`}
          >
            <span
              className={`absolute top-1 size-4 rounded-full bg-white transition-all ${
                settings.reminder ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={logout}
        className="rounded-xl bg-graphite/5 py-3 text-sm font-semibold text-graphite transition active:scale-[0.99]"
      >
        Se déconnecter
      </button>
    </div>
  );
}
