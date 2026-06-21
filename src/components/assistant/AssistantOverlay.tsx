"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditableAmount } from "@/components/EditableAmount";
import { currentMonthValue } from "@/components/MonthSelector";
import { formatDateShort, formatDayOfMonth, formatEuro } from "@/lib/format";
import { isMonthReviewed, markMonthReviewed } from "@/lib/assistant";
import { useAssistant } from "@/lib/assistantUi";
import { useData } from "@/lib/store";
import { useQuickEntry } from "@/lib/quickEntry";

type Screen =
  | "home"
  | "add"
  | "consult"
  | "month"
  | "todo"
  | "todoPay"
  | "todoSort";

const pad2 = (n: number) => String(n).padStart(2, "0");

export function AssistantOverlay() {
  const router = useRouter();
  const { openSheet } = useQuickEntry();
  const { visible, close } = useAssistant();
  const {
    income,
    charges,
    variables,
    accounts,
    settings,
    categories,
    incomeTypes,
    addIncome,
    updateIncome,
    removeIncome,
    addCategory,
    updateCategory,
    updateVariable,
    chargeState,
    setChargePaid,
    setChargeMonthAmount,
  } = useData();

  const cm = currentMonthValue();
  const [screen, setScreen] = useState<Screen>("home");
  const [step, setStep] = useState(1);
  const [reviewed, setReviewed] = useState(true);
  const [newCat, setNewCat] = useState<{ label: string; amount: string } | null>(
    null,
  );
  const [rangeFor, setRangeFor] = useState<string | null>(null); // dépense en cours de rangement

  useEffect(() => {
    setReviewed(isMonthReviewed(cm));
  }, [cm]);

  // À chaque réouverture, repartir de l'écran d'accueil.
  useEffect(() => {
    if (visible) {
      setScreen("home");
      setStep(1);
      setNewCat(null);
      setRangeFor(null);
    }
  }, [visible]);

  if (!visible) return null;

  /* ----- Données dérivées (mois courant) ----- */
  const inMonth = (d: string) => (d ?? "").startsWith(cm);
  const monthIncome = income.filter((r) => inMonth(r.date));
  const incomeSum = monthIncome.reduce((s, r) => s + r.amount, 0);
  const variablesSum = variables
    .filter((v) => inMonth(v.date))
    .reduce((s, v) => s + v.amount, 0);
  const paidCharges = charges.reduce((s, c) => {
    const st = chargeState(c.id, cm, c.amount);
    return s + (st.paid ? st.amount : 0);
  }, 0);
  const unpaidCharges = charges.reduce((s, c) => {
    const st = chargeState(c.id, cm, c.amount);
    return s + (st.paid ? 0 : st.amount);
  }, 0);
  const savingsSum = accounts.reduce((s, a) => s + a.added, 0);
  const available = incomeSum - paidCharges - variablesSum - savingsSum;

  // Mois précédent (base pour reprendre les revenus).
  const [yy, mm] = cm.split("-").map(Number);
  const prev = new Date(yy, mm - 2, 1);
  const pm = `${prev.getFullYear()}-${pad2(prev.getMonth() + 1)}`;
  const lastMonthIncome = income.filter((r) => (r.date ?? "").startsWith(pm));

  // « À traiter » : charges non payées (ce mois) + dépenses non rangées (ce mois).
  const realCats = categories.filter((c) => c.label.toLowerCase() !== "à trier");
  const isATrier = (v: { categoryId?: string }) => {
    const c = categories.find((x) => x.id === v.categoryId);
    return !c || c.label.toLowerCase() === "à trier";
  };
  const toPay = charges.filter((c) => !chargeState(c.id, cm, c.amount).paid);
  const toSort = variables.filter((v) => inMonth(v.date) && isATrier(v));
  const pendingCount = toPay.length + toSort.length;

  const typeLabel = (id: string) =>
    incomeTypes.find((t) => t.id === id)?.label ?? "Revenu";

  /* ----- Actions ----- */
  function skip() {
    setScreen("home");
    setStep(1);
    close();
  }
  function chooseAdd(type: "depense" | "charge" | "revenu") {
    openSheet(undefined, type);
    close();
  }
  function reprendreRevenus() {
    for (const r of lastMonthIncome) {
      addIncome({
        label: r.label,
        source: r.source,
        icon: r.icon,
        typeId: r.typeId,
        amount: r.amount,
        date: `${cm}-01`,
      });
    }
  }
  function createCat() {
    if (!newCat || !newCat.label.trim()) return;
    const budget = parseFloat(newCat.amount.replace(",", ".")) || 0;
    addCategory({ label: newCat.label.trim(), icon: "🏷️", budget });
    setNewCat(null);
  }
  function finishMonth() {
    markMonthReviewed(cm);
    setReviewed(true);
    setScreen("home");
    setStep(1);
    close();
    router.push("/");
  }

  /* ----- Rendu ----- */
  return (
    <div className="fixed inset-0 z-30 bg-background">
      <div className="mx-auto flex h-full w-full max-w-[440px] flex-col overflow-y-auto px-5 pb-10">
        {/* Barre haute : croix pour fermer (toujours visible) */}
        <div className="sticky top-0 z-10 -mx-5 flex justify-end bg-background/90 px-5 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
          <button
            type="button"
            onClick={skip}
            aria-label="Fermer l'assistant"
            className="flex size-9 items-center justify-center rounded-full bg-graphite/5 text-lg text-graphite/55 transition active:scale-90"
          >
            ✕
          </button>
        </div>

        {screen === "home" && (
          <div className="flex flex-1 flex-col">
            <header className="mb-6">
              <p className="text-[13px] font-medium text-graphite/55">Bonjour Rin 👋</p>
              <h1 className="font-display text-2xl font-extrabold text-graphite">
                Que souhaites-tu faire&nbsp;?
              </h1>
            </header>

            <div className="flex flex-col gap-3">
              <AssistantCard
                icon="➕"
                title="Ajouter un montant"
                subtitle="Dépense, charge ou revenu"
                onClick={() => setScreen("add")}
              />
              <AssistantCard
                icon="👀"
                title="Consulter"
                subtitle="Ce qu'il te reste, ce qui va partir"
                onClick={() => setScreen("consult")}
              />
              <AssistantCard
                icon="🗓️"
                title="Mettre à jour le mois"
                subtitle="Revenus, charges et budgets prévus"
                badge={!reviewed ? "à faire" : undefined}
                onClick={() => {
                  setStep(1);
                  setScreen("month");
                }}
              />
              <AssistantCard
                icon="🧹"
                title="À traiter"
                subtitle="Charges à payer, dépenses à ranger"
                badge={pendingCount > 0 ? String(pendingCount) : undefined}
                onClick={() => {
                  setRangeFor(null);
                  setScreen("todo");
                }}
              />
            </div>

            <button
              type="button"
              onClick={skip}
              className="mt-auto rounded-2xl border border-graphite/15 py-3 text-sm font-bold text-graphite/60 transition active:scale-[0.99]"
            >
              Passer et naviguer seule →
            </button>
          </div>
        )}

        {screen === "add" && (
          <div className="flex flex-1 flex-col">
            <BackButton onClick={() => setScreen("home")} />
            <h1 className="mb-6 font-display text-2xl font-extrabold text-graphite">
              Ajouter…
            </h1>
            <div className="flex flex-col gap-3">
              <AssistantCard
                icon="💸"
                title="Une dépense"
                subtitle="Courses, resto, shopping…"
                onClick={() => chooseAdd("depense")}
              />
              <AssistantCard
                icon="🏠"
                title="Une charge fixe"
                subtitle="Loyer, abonnement…"
                onClick={() => chooseAdd("charge")}
              />
              <AssistantCard
                icon="💰"
                title="Un revenu"
                subtitle="Salaire, freelance…"
                onClick={() => chooseAdd("revenu")}
              />
            </div>
          </div>
        )}

        {screen === "consult" && (
          <div className="flex flex-1 flex-col">
            <BackButton onClick={() => setScreen("home")} />
            <h1 className="mb-5 font-display text-2xl font-extrabold text-graphite">
              Où en es-tu&nbsp;?
            </h1>

            <section className="rounded-3xl bg-plum p-5 text-white shadow-lg shadow-plum/20">
              <p className="text-xs font-medium text-white/55">Il te reste</p>
              <p className="mt-1 font-display text-4xl font-extrabold leading-none">
                {formatEuro(available)}
              </p>
              <p className="mt-2 text-xs text-white/45">disponibles maintenant</p>
            </section>

            <div className="mt-3 flex flex-col gap-2">
              <ConsultRow icon="⚡" label="À payer ce mois" value={formatEuro(unpaidCharges)} />
              <ConsultRow icon="💰" label="Revenus du mois" value={formatEuro(incomeSum)} />
              <ConsultRow icon="📤" label="Dépenses du mois" value={formatEuro(paidCharges + variablesSum)} />
              <ConsultRow icon="🐷" label="Épargne du mois" value={formatEuro(savingsSum)} />
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  close();
                  router.push("/");
                }}
                className="rounded-2xl bg-plum py-3.5 text-[15px] font-bold text-white shadow-md shadow-plum/20 transition active:scale-[0.99]"
              >
                Voir le détail
              </button>
              <button
                type="button"
                onClick={() => setScreen("home")}
                className="rounded-2xl bg-graphite/5 py-3 text-sm font-medium text-graphite/60 transition active:scale-[0.99]"
              >
                Retour
              </button>
            </div>
          </div>
        )}

        {/* À traiter — écran de choix */}
        {screen === "todo" && (
          <div className="flex flex-1 flex-col">
            <BackButton onClick={() => setScreen("home")} />
            <h1 className="mb-1 font-display text-2xl font-extrabold text-graphite">
              À traiter
            </h1>
            <p className="mb-5 text-xs text-graphite/55">
              Que veux-tu traiter&nbsp;?
            </p>

            {pendingCount === 0 ? (
              <div className="rounded-2xl bg-success/10 p-5 text-center">
                <p className="text-2xl" aria-hidden>
                  ✅
                </p>
                <p className="mt-1 text-sm font-semibold text-success">
                  Tout est à jour&nbsp;!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <AssistantCard
                  icon="💸"
                  title="Charges à payer"
                  subtitle="Marquer tes charges du mois comme payées"
                  badge={toPay.length > 0 ? String(toPay.length) : undefined}
                  onClick={() => setScreen("todoPay")}
                />
                <AssistantCard
                  icon="🧹"
                  title="Dépenses à ranger"
                  subtitle="Classer les dépenses sans catégorie"
                  badge={toSort.length > 0 ? String(toSort.length) : undefined}
                  onClick={() => {
                    setRangeFor(null);
                    setScreen("todoSort");
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* À traiter — Charges à payer */}
        {screen === "todoPay" && (
          <div className="flex flex-1 flex-col">
            <BackButton onClick={() => setScreen("todo")} />
            <h1 className="mb-4 font-display text-xl font-extrabold text-graphite">
              Charges à payer ({toPay.length})
            </h1>
            <div className="flex flex-col gap-2">
              {toPay.map((c) => {
                const st = chargeState(c.id, cm, c.amount);
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm"
                  >
                    <span className="text-xl" aria-hidden>
                      {c.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-graphite">
                        {c.label}
                      </p>
                      <p className="truncate text-[11px] text-graphite/55">
                        {formatDayOfMonth(c.dayOfMonth)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-graphite">
                      {formatEuro(st.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setChargePaid(c.id, cm, true)}
                      className="shrink-0 rounded-full bg-success px-3 py-1.5 text-xs font-bold text-white transition active:scale-95"
                    >
                      Payer
                    </button>
                  </div>
                );
              })}
              {toPay.length === 0 && (
                <div className="rounded-2xl bg-success/10 p-5 text-center text-sm font-semibold text-success">
                  Toutes les charges sont payées ✅
                </div>
              )}
            </div>
          </div>
        )}

        {/* À traiter — Dépenses à ranger */}
        {screen === "todoSort" && (
          <div className="flex flex-1 flex-col">
            <BackButton onClick={() => setScreen("todo")} />
            <h1 className="mb-4 font-display text-xl font-extrabold text-graphite">
              Dépenses à ranger ({toSort.length})
            </h1>
            <div className="flex flex-col gap-2">
              {toSort.map((v) => (
                <div
                  key={v.id}
                  className="flex flex-col gap-2 rounded-xl bg-white p-2.5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl" aria-hidden>
                      {v.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-graphite">
                        {v.label}
                      </p>
                      <p className="truncate text-[11px] text-graphite/55">
                        {formatDateShort(v.date)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-violet">
                      {formatEuro(v.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRangeFor(rangeFor === v.id ? null : v.id)}
                      className="shrink-0 rounded-full bg-lavender/40 px-3 py-1.5 text-xs font-bold text-plum transition active:scale-95"
                    >
                      Ranger
                    </button>
                  </div>
                  {rangeFor === v.id && (
                    <div className="flex flex-wrap gap-1.5">
                      {realCats.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            updateVariable(v.id, {
                              categoryId: cat.id,
                              icon: cat.icon,
                            });
                            setRangeFor(null);
                          }}
                          className="flex items-center gap-1 rounded-full bg-graphite/5 px-3 py-1.5 text-xs font-semibold text-graphite/70 transition active:scale-95"
                        >
                          <span aria-hidden>{cat.icon}</span> {cat.label}
                        </button>
                      ))}
                      {realCats.length === 0 && (
                        <p className="text-[11px] text-graphite/45">
                          Crée d&apos;abord une catégorie dans les Réglages.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {toSort.length === 0 && (
                <div className="rounded-2xl bg-success/10 p-5 text-center text-sm font-semibold text-success">
                  Toutes les dépenses sont rangées ✅
                </div>
              )}
            </div>
          </div>
        )}

        {screen === "month" && (
          <div className="flex flex-1 flex-col">
            <BackButton
              onClick={() => (step > 1 ? setStep(step - 1) : setScreen("home"))}
            />

            {/* Progression */}
            <div className="mb-4 flex items-center gap-2">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`h-1.5 flex-1 rounded-full ${
                    n <= step ? "bg-plum" : "bg-graphite/15"
                  }`}
                />
              ))}
            </div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-graphite/45">
              Étape {step}/3
            </p>

            {step === 1 && (
              <>
                <h1 className="mb-4 font-display text-xl font-extrabold text-graphite">
                  Tes revenus ce mois
                </h1>
                {monthIncome.length === 0 && lastMonthIncome.length > 0 && (
                  <button
                    type="button"
                    onClick={reprendreRevenus}
                    className="mb-3 rounded-xl bg-lavender/30 py-3 text-[13px] font-semibold text-plum transition active:scale-[0.99]"
                  >
                    ↩︎ Reprendre le mois dernier ({lastMonthIncome.length})
                  </button>
                )}
                <div className="flex flex-col gap-2">
                  {monthIncome.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm"
                    >
                      <span className="text-xl" aria-hidden>
                        {r.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-graphite">
                          {r.label}
                        </p>
                        <p className="truncate text-[11px] text-graphite/55">
                          {typeLabel(r.typeId)}
                        </p>
                      </div>
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
                        className="flex size-6 shrink-0 items-center justify-center rounded-full text-graphite/40 transition hover:bg-error/10 hover:text-error"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {monthIncome.length === 0 && lastMonthIncome.length === 0 && (
                    <p className="py-2 text-center text-xs text-graphite/40">
                      Aucun revenu pour l&apos;instant.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => openSheet(`${cm}-01`, "revenu")}
                  className="mt-3 rounded-xl border border-dashed border-plum/30 py-3 text-[13px] font-semibold text-plum"
                >
                  + Ajouter un revenu
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="mb-1 font-display text-xl font-extrabold text-graphite">
                  Tes charges fixes
                </h1>
                <p className="mb-4 text-xs text-graphite/55">
                  Elles se reportent chaque mois. Ajuste un montant si besoin.
                </p>
                <div className="flex flex-col gap-2">
                  {charges.map((c) => {
                    const st = chargeState(c.id, cm, c.amount);
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm"
                      >
                        <span className="text-xl" aria-hidden>
                          {c.icon}
                        </span>
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-graphite">
                          {c.label}
                        </p>
                        <EditableAmount
                          value={st.amount}
                          onCommit={(n) => setChargeMonthAmount(c.id, cm, n)}
                          ariaLabel={`Montant de ${c.label} ce mois`}
                          className="shrink-0 text-sm font-bold text-graphite"
                        />
                      </div>
                    );
                  })}
                  {charges.length === 0 && (
                    <p className="py-2 text-center text-xs text-graphite/40">
                      Aucune charge fixe.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => openSheet(undefined, "charge")}
                  className="mt-3 rounded-xl border border-dashed border-plum/30 py-3 text-[13px] font-semibold text-plum"
                >
                  + Ajouter une charge
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="mb-1 font-display text-xl font-extrabold text-graphite">
                  Tes budgets prévus
                </h1>
                <p className="mb-4 text-xs text-graphite/55">
                  Le montant prévu par catégorie (modifiable).
                </p>
                <div className="flex flex-col gap-2">
                  {categories
                    .filter((c) => c.label.toLowerCase() !== "à trier")
                    .map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm"
                      >
                        <span className="text-xl" aria-hidden>
                          {c.icon}
                        </span>
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-graphite">
                          {c.label}
                        </p>
                        <EditableAmount
                          value={c.budget ?? 0}
                          onCommit={(n) => updateCategory(c.id, { budget: n })}
                          ariaLabel={`Budget prévu pour ${c.label}`}
                          className="shrink-0 text-sm font-bold text-violet"
                        />
                      </div>
                    ))}
                </div>

                {newCat === null ? (
                  <button
                    type="button"
                    onClick={() => setNewCat({ label: "", amount: "" })}
                    className="mt-3 rounded-xl border border-dashed border-plum/30 py-3 text-[13px] font-semibold text-plum"
                  >
                    + Ajouter une catégorie
                  </button>
                ) : (
                  <div className="mt-3 flex flex-col gap-2 rounded-xl bg-cloud p-3">
                    <input
                      autoFocus
                      value={newCat.label}
                      onChange={(e) =>
                        setNewCat({ ...newCat, label: e.target.value })
                      }
                      placeholder="Nom (ex : Shopping)"
                      aria-label="Nom de la catégorie"
                      className="rounded-lg bg-white px-3 py-2 text-sm text-graphite outline-none ring-plum/30 focus:ring-2"
                    />
                    <div className="flex items-center gap-1 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-graphite/55">Prévu / mois</span>
                      <input
                        inputMode="decimal"
                        value={newCat.amount}
                        onChange={(e) =>
                          setNewCat({
                            ...newCat,
                            amount: e.target.value.replace(/[^0-9.,]/g, ""),
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
                        onClick={() => setNewCat(null)}
                        className="flex-1 rounded-lg bg-graphite/5 py-2 text-sm font-medium text-graphite/60"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={createCat}
                        disabled={!newCat.label.trim()}
                        className="flex-1 rounded-lg bg-plum py-2 text-sm font-bold text-white disabled:opacity-40"
                      >
                        Créer
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Navigation bas du parcours */}
            <div className="mt-6 flex flex-col gap-2">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="rounded-2xl bg-plum py-3.5 text-[15px] font-bold text-white shadow-md shadow-plum/20 transition active:scale-[0.99]"
                >
                  {step === 1 ? "Valider les revenus" : "Valider les charges"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishMonth}
                  className="rounded-2xl bg-success py-3.5 text-[15px] font-bold text-white shadow-md transition active:scale-[0.99]"
                >
                  C&apos;est à jour ✅
                </button>
              )}
              <button
                type="button"
                onClick={skip}
                className="self-center px-6 py-2 text-sm font-medium text-graphite/45"
              >
                Passer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AssistantCard({
  icon,
  title,
  subtitle,
  badge,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
    >
      <span
        className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-lavender/30 text-2xl"
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-bold text-graphite">{title}</span>
          {badge && (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
              ● {badge}
            </span>
          )}
        </span>
        <span className="block truncate text-xs text-graphite/55">{subtitle}</span>
      </span>
      <span className="shrink-0 text-graphite/30" aria-hidden>
        →
      </span>
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Retour"
      className="mb-3 -ml-1 self-start rounded-full px-2 py-1 text-sm font-semibold text-graphite/50 transition active:scale-95"
    >
      ‹ Retour
    </button>
  );
}

function ConsultRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
      <span aria-hidden>{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-graphite/70">
        {label}
      </span>
      <span className="shrink-0 text-sm font-bold text-graphite">{value}</span>
    </div>
  );
}
