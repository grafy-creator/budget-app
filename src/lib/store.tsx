"use client";

import { createContext, useContext, useMemo, useState } from "react";
import {
  budget as mockBudget,
  savings as mockSavings,
  categories as mockCategories,
  incomeTypes as mockIncomeTypes,
  type FixedCharge,
  type VariableExpense,
  type IncomeEntry,
  type SavingsAccount,
  type Category,
  type IncomeType,
} from "./mock";

/**
 * Magasin de données en mémoire (prototype). Source unique pour les écrans :
 * une modification (montant, ajout, suppression) se reflète partout pendant la
 * session. NON persistant : tout est réinitialisé au rechargement de la page.
 * À remplacer par Supabase pour la persistance.
 */

export type RuleKey = "besoins" | "envies" | "epargne";

type Settings = {
  revenuCible: number;
  reminder: boolean;
  // Règle de répartition (pourcentages).
  pctBesoins: number;
  pctEnvies: number;
  pctEpargne: number;
};

type Store = {
  charges: FixedCharge[];
  variables: VariableExpense[];
  income: IncomeEntry[];
  accounts: SavingsAccount[];
  categories: Category[];
  incomeTypes: IncomeType[];
  settings: Settings;

  // Charges fixes (= récurrences)
  updateCharge: (id: string, patch: Partial<FixedCharge>) => void;
  addCharge: (data: Omit<FixedCharge, "id">) => void;
  removeCharge: (id: string) => void;

  // Dépenses variables
  addVariable: (data: Omit<VariableExpense, "id">) => void;
  updateVariable: (id: string, patch: Partial<VariableExpense>) => void;
  removeVariable: (id: string) => void;

  // Revenus
  addIncome: (data: Omit<IncomeEntry, "id">) => void;
  updateIncome: (id: string, patch: Partial<IncomeEntry>) => void;
  removeIncome: (id: string) => void;

  // Comptes d'épargne
  addAccount: (data: Omit<SavingsAccount, "id">) => void;
  updateAccount: (id: string, patch: Partial<SavingsAccount>) => void;
  removeAccount: (id: string) => void;
  addContribution: (id: string, amount: number) => void;

  // Catégories de dépenses
  addCategory: (data: Omit<Category, "id">) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  removeCategory: (id: string) => void;

  // Natures de revenu
  addIncomeType: (data: Omit<IncomeType, "id">) => void;
  updateIncomeType: (id: string, patch: Partial<IncomeType>) => void;
  removeIncomeType: (id: string) => void;

  setRevenuCible: (n: number) => void;
  setReminder: (b: boolean) => void;
  setRulePct: (key: RuleKey, pct: number) => void;
};

const DataContext = createContext<Store | null>(null);

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

const clone = <T,>(arr: T[]): T[] => arr.map((x) => ({ ...x }));

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [charges, setCharges] = useState<FixedCharge[]>(() =>
    clone(mockBudget.fixedCharges),
  );
  const [variables, setVariables] = useState<VariableExpense[]>(() =>
    clone(mockBudget.variableExpenses),
  );
  const [income, setIncome] = useState<IncomeEntry[]>(() =>
    clone(mockBudget.income),
  );
  const [accounts, setAccounts] = useState<SavingsAccount[]>(() =>
    clone(mockSavings.accounts),
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    clone(mockCategories),
  );
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>(() =>
    clone(mockIncomeTypes),
  );
  const [settings, setSettings] = useState<Settings>({
    revenuCible: 2500,
    reminder: true,
    pctBesoins: 50,
    pctEnvies: 30,
    pctEpargne: 20,
  });

  const value = useMemo<Store>(
    () => ({
      charges,
      variables,
      income,
      accounts,
      categories,
      incomeTypes,
      settings,

      updateCharge: (id, patch) =>
        setCharges((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c))),
      addCharge: (data) => setCharges((l) => [...l, { ...data, id: uid() }]),
      removeCharge: (id) => setCharges((l) => l.filter((c) => c.id !== id)),

      addVariable: (data) =>
        setVariables((l) => [{ ...data, id: uid() }, ...l]),
      updateVariable: (id, patch) =>
        setVariables((l) =>
          l.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        ),
      removeVariable: (id) =>
        setVariables((l) => l.filter((v) => v.id !== id)),

      addIncome: (data) => setIncome((l) => [{ ...data, id: uid() }, ...l]),
      updateIncome: (id, patch) =>
        setIncome((l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r))),
      removeIncome: (id) => setIncome((l) => l.filter((r) => r.id !== id)),

      addAccount: (data) => setAccounts((l) => [...l, { ...data, id: uid() }]),
      updateAccount: (id, patch) =>
        setAccounts((l) =>
          l.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        ),
      removeAccount: (id) => setAccounts((l) => l.filter((a) => a.id !== id)),
      addContribution: (id, amount) =>
        setAccounts((l) =>
          l.map((a) =>
            a.id === id
              ? { ...a, added: a.added + amount, balance: a.balance + amount }
              : a,
          ),
        ),

      addCategory: (data) => setCategories((l) => [...l, { ...data, id: uid() }]),
      updateCategory: (id, patch) =>
        setCategories((l) =>
          l.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        ),
      removeCategory: (id) => setCategories((l) => l.filter((c) => c.id !== id)),

      addIncomeType: (data) =>
        setIncomeTypes((l) => [...l, { ...data, id: uid() }]),
      updateIncomeType: (id, patch) =>
        setIncomeTypes((l) =>
          l.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        ),
      removeIncomeType: (id) =>
        setIncomeTypes((l) => l.filter((t) => t.id !== id)),

      setRevenuCible: (n) => setSettings((s) => ({ ...s, revenuCible: n })),
      setReminder: (b) => setSettings((s) => ({ ...s, reminder: b })),
      setRulePct: (key, pct) =>
        setSettings((s) => ({
          ...s,
          ...(key === "besoins"
            ? { pctBesoins: pct }
            : key === "envies"
              ? { pctEnvies: pct }
              : { pctEpargne: pct }),
        })),
    }),
    [charges, variables, income, accounts, categories, incomeTypes, settings],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData doit être utilisé dans <DataProvider>");
  return ctx;
}

/**
 * Objectifs (montants prévus) dérivés du revenu cible et de la règle de
 * répartition : Besoins (fixes), Envies (variables), Épargne.
 * Source unique pour le Budget, l'Accueil et le Bilan.
 */
export function ruleTargets(s: {
  revenuCible: number;
  pctBesoins: number;
  pctEnvies: number;
  pctEpargne: number;
}) {
  return {
    fixes: Math.round((s.revenuCible * s.pctBesoins) / 100),
    variables: Math.round((s.revenuCible * s.pctEnvies) / 100),
    epargne: Math.round((s.revenuCible * s.pctEpargne) / 100),
  };
}
