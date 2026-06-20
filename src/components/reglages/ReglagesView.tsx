"use client";

import { useState } from "react";
import { EditableAmount } from "@/components/EditableAmount";
import { useData } from "@/lib/store";

const RULES = [
  { id: "besoins", label: "Charges fixes (Besoins)", pct: 50, bar: "bg-plum" },
  { id: "envies", label: "Variables (Envies)", pct: 30, bar: "bg-violet" },
  { id: "epargne", label: "Épargne", pct: 20, bar: "bg-success" },
];

const ICONS = ["🏠", "📺", "🎵", "📱", "💡", "🚗", "🏋️", "📦"];
const CAT_ICONS = ["🛒", "🍽️", "🚗", "💊", "🎮", "📦", "👕", "🎁", "☕", "🐾"];

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
  day: string;
  amount: string;
};

const EMPTY_FORM: FormState = {
  id: null,
  icon: "🏠",
  label: "",
  day: "Le 1er du mois",
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
    settings,
    setRevenuCible,
    setReminder,
  } = useData();

  const [revenuDraft, setRevenuDraft] = useState(String(settings.revenuCible));
  const [form, setForm] = useState<FormState | null>(null);
  const [catForm, setCatForm] = useState<{
    id: string | null;
    icon: string;
    label: string;
  } | null>(null);

  function saveCat() {
    if (!catForm || !catForm.label.trim()) return;
    if (catForm.id) {
      updateCategory(catForm.id, { icon: catForm.icon, label: catForm.label.trim() });
    } else {
      addCategory({ icon: catForm.icon, label: catForm.label.trim() });
    }
    setCatForm(null);
  }

  const total = RULES.reduce((sum, r) => sum + r.pct, 0);

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
      day: c.day,
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
        day: form.day.trim(),
        amount,
      });
    } else {
      addCharge({
        icon: form.icon,
        label: form.label.trim(),
        day: form.day.trim(),
        amount,
        paid: false,
      });
    }
    setForm(null);
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <h1 className="font-display text-2xl font-extrabold text-graphite">
        Réglages
      </h1>

      {/* Revenu cible */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Mon revenu cible</SectionTitle>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <span className="text-2xl" aria-hidden>
            💰
          </span>
          <div className="flex flex-1 items-center gap-1 rounded-lg bg-graphite/5 px-3 py-2">
            <input
              inputMode="numeric"
              value={revenuDraft}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                setRevenuDraft(v);
                setRevenuCible(parseInt(v || "0", 10));
              }}
              aria-label="Revenu mensuel cible en euros"
              className="w-full bg-transparent font-display text-xl font-extrabold text-success outline-none"
            />
            <span className="font-display text-xl font-extrabold text-success">€</span>
          </div>
        </div>
      </section>

      {/* Règle budgétaire */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Ma règle budgétaire</SectionTitle>
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
          {RULES.map((r) => (
            <div key={r.id}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-graphite/70">{r.label}</span>
                <span className="font-bold text-graphite">{r.pct}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-graphite/10">
                <div
                  className={`h-full rounded-full ${r.bar}`}
                  style={{ width: `${r.pct}%` }}
                />
              </div>
            </div>
          ))}
          <p className="text-xs font-bold text-success">Total : {total}% ✓</p>
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

          {/* Formulaire ajout / édition */}
          {form && (
            <div className="flex flex-col gap-2 rounded-xl bg-cloud p-3">
              <div className="flex flex-wrap gap-1">
                {ICONS.map((ic) => (
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
              <div className="flex gap-2">
                <input
                  value={form.day}
                  onChange={(e) => setForm({ ...form, day: e.target.value })}
                  placeholder="Le 1er du mois"
                  aria-label="Échéance"
                  className="min-w-0 flex-1 rounded-lg bg-white px-3 py-2 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
                />
                <div className="flex items-center gap-1 rounded-lg bg-white px-3 py-2">
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
                  onClick={save}
                  disabled={!form.label.trim()}
                  className="flex-1 rounded-lg bg-plum py-2 text-sm font-bold text-white disabled:opacity-40"
                >
                  {form.id ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </div>
          )}

          {charges.map((c) => (
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
                    {c.day} · modifier
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
                aria-label={`Supprimer ${c.label}`}
                onClick={() => removeCharge(c.id)}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-graphite/30 transition hover:bg-error/10 hover:text-error"
              >
                ✕
              </button>
            </div>
          ))}
          {charges.length === 0 && (
            <p className="py-2 text-center text-xs text-graphite/40">
              Aucune charge récurrente.
            </p>
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
              onClick={() => setCatForm({ id: null, icon: "🛒", label: "" })}
              className="rounded-lg bg-lavender/30 py-2.5 text-[13px] font-semibold text-plum transition active:scale-[0.99]"
            >
              + Ajouter une catégorie
            </button>
          )}

          {catForm && (
            <div className="flex flex-col gap-2 rounded-xl bg-cloud p-3">
              <div className="flex flex-wrap gap-1">
                {CAT_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setCatForm({ ...catForm, icon: ic })}
                    aria-label={`Icône ${ic}`}
                    aria-pressed={catForm.icon === ic}
                    className={`flex size-8 items-center justify-center rounded-lg text-base transition ${
                      catForm.icon === ic ? "bg-lavender/60" : "bg-white"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
              <input
                value={catForm.label}
                onChange={(e) => setCatForm({ ...catForm, label: e.target.value })}
                placeholder="Nom (ex : Abonnements)"
                aria-label="Nom de la catégorie"
                className="rounded-lg bg-white px-3 py-2 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
              />
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
                    setCatForm({ id: c.id, icon: c.icon, label: c.label })
                  }
                  aria-label={`Modifier ${c.label}`}
                  className="flex items-center gap-1.5 text-sm font-medium text-graphite"
                >
                  <span aria-hidden>{c.icon}</span>
                  {c.label}
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

      {/* Rappels */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Rappels</SectionTitle>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-graphite">Rappel quotidien</p>
            <p className="text-xs text-graphite/55">Tous les jours à 20:00</p>
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
        className="rounded-xl bg-error/10 py-3 text-sm font-medium text-error transition active:scale-[0.99]"
      >
        Effacer toutes les données
      </button>
    </div>
  );
}
