"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  FixedCharge,
  VariableExpense,
  IncomeEntry,
  SavingsAccount,
  Category,
  IncomeType,
} from "./mock";

/**
 * Magasin de données adossé à Supabase. Chargement au montage (par utilisateur,
 * via RLS), puis écritures persistées à chaque modification (mise à jour
 * optimiste de l'UI). Même interface `useData()` que la version prototype.
 */

export type RuleKey = "besoins" | "envies" | "epargne";

type Settings = {
  revenuCible: number;
  reminder: boolean;
  pctBesoins: number;
  pctEnvies: number;
  pctEpargne: number;
};

const DEFAULT_SETTINGS: Settings = {
  revenuCible: 0,
  reminder: true,
  pctBesoins: 50,
  pctEnvies: 30,
  pctEpargne: 20,
};

type Store = {
  loading: boolean;
  charges: FixedCharge[];
  variables: VariableExpense[];
  income: IncomeEntry[];
  accounts: SavingsAccount[];
  categories: Category[];
  incomeTypes: IncomeType[];
  settings: Settings;

  updateCharge: (id: string, patch: Partial<FixedCharge>) => void;
  addCharge: (data: Omit<FixedCharge, "id">) => void;
  removeCharge: (id: string) => void;

  addVariable: (data: Omit<VariableExpense, "id">) => void;
  updateVariable: (id: string, patch: Partial<VariableExpense>) => void;
  removeVariable: (id: string) => void;

  addIncome: (data: Omit<IncomeEntry, "id">) => void;
  updateIncome: (id: string, patch: Partial<IncomeEntry>) => void;
  removeIncome: (id: string) => void;

  addAccount: (data: Omit<SavingsAccount, "id">) => void;
  updateAccount: (id: string, patch: Partial<SavingsAccount>) => void;
  removeAccount: (id: string) => void;
  addContribution: (id: string, amount: number) => void;

  addCategory: (data: Omit<Category, "id">) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  removeCategory: (id: string) => void;

  addIncomeType: (data: Omit<IncomeType, "id">) => void;
  updateIncomeType: (id: string, patch: Partial<IncomeType>) => void;
  removeIncomeType: (id: string) => void;

  setRevenuCible: (n: number) => void;
  setReminder: (b: boolean) => void;
  setRulePct: (key: RuleKey, pct: number) => void;
};

const DataContext = createContext<Store | null>(null);

/* ------------------------------------------------------------------ */
/* Mappers ligne Supabase (snake_case) → modèle app (camelCase)       */
/* ------------------------------------------------------------------ */
const num = (v: unknown) => Number(v ?? 0);

type Row = Record<string, unknown>;

const fromCategory = (r: Row): Category => ({
  id: r.id as string,
  label: r.label as string,
  icon: r.icon as string,
});
const fromIncomeType = (r: Row): IncomeType => ({
  id: r.id as string,
  label: r.label as string,
});
const fromCharge = (r: Row): FixedCharge => ({
  id: r.id as string,
  label: r.label as string,
  icon: r.icon as string,
  dayOfMonth: num(r.day_of_month),
  amount: num(r.amount),
  paid: Boolean(r.paid),
  dueToday: Boolean(r.due_today),
});
const fromVariable = (r: Row): VariableExpense => ({
  id: r.id as string,
  label: r.label as string,
  icon: r.icon as string,
  categoryId: (r.category_id as string) ?? undefined,
  amount: num(r.amount),
  date: r.date as string,
});
const fromIncome = (r: Row): IncomeEntry => ({
  id: r.id as string,
  label: r.label as string,
  source: r.source as string,
  icon: r.icon as string,
  typeId: (r.type_id as string) ?? "",
  amount: num(r.amount),
  date: r.date as string,
});
const fromAccount = (r: Row): SavingsAccount => ({
  id: r.id as string,
  label: r.label as string,
  icon: r.icon as string,
  badge: (r.badge as string) ?? undefined,
  before: num(r.before_amount),
  added: num(r.added),
  balance: num(r.balance),
  goal: num(r.goal),
  projection: (r.projection as string) ?? "",
});

/* Modèle app → colonnes Supabase (uniquement les champs fournis) ---- */
function chargeToRow(p: Partial<FixedCharge>): Row {
  const r: Row = {};
  if (p.label !== undefined) r.label = p.label;
  if (p.icon !== undefined) r.icon = p.icon;
  if (p.dayOfMonth !== undefined) r.day_of_month = p.dayOfMonth;
  if (p.amount !== undefined) r.amount = p.amount;
  if (p.paid !== undefined) r.paid = p.paid;
  if (p.dueToday !== undefined) r.due_today = p.dueToday;
  return r;
}
function variableToRow(p: Partial<VariableExpense>): Row {
  const r: Row = {};
  if (p.label !== undefined) r.label = p.label;
  if (p.icon !== undefined) r.icon = p.icon;
  if (p.categoryId !== undefined) r.category_id = p.categoryId ?? null;
  if (p.amount !== undefined) r.amount = p.amount;
  if (p.date !== undefined) r.date = p.date;
  return r;
}
function incomeToRow(p: Partial<IncomeEntry>): Row {
  const r: Row = {};
  if (p.label !== undefined) r.label = p.label;
  if (p.source !== undefined) r.source = p.source;
  if (p.icon !== undefined) r.icon = p.icon;
  if (p.typeId !== undefined) r.type_id = p.typeId || null;
  if (p.amount !== undefined) r.amount = p.amount;
  if (p.date !== undefined) r.date = p.date;
  return r;
}
function accountToRow(p: Partial<SavingsAccount>): Row {
  const r: Row = {};
  if (p.label !== undefined) r.label = p.label;
  if (p.icon !== undefined) r.icon = p.icon;
  if (p.badge !== undefined) r.badge = p.badge ?? null;
  if (p.before !== undefined) r.before_amount = p.before;
  if (p.added !== undefined) r.added = p.added;
  if (p.balance !== undefined) r.balance = p.balance;
  if (p.goal !== undefined) r.goal = p.goal;
  if (p.projection !== undefined) r.projection = p.projection;
  return r;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const userId = useRef<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [charges, setCharges] = useState<FixedCharge[]>([]);
  const [variables, setVariables] = useState<VariableExpense[]>([]);
  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      userId.current = user.id;

      const [cat, it, ch, va, inc, acc, set] = await Promise.all([
        supabase.from("categories").select("*").order("created_at"),
        supabase.from("income_types").select("*").order("created_at"),
        supabase.from("charges").select("*").order("created_at"),
        supabase.from("variables").select("*").order("date", { ascending: false }),
        supabase.from("income").select("*").order("date", { ascending: false }),
        supabase.from("accounts").select("*").order("created_at"),
        supabase.from("settings").select("*").maybeSingle(),
      ]);

      if (!active) return;
      setCategories((cat.data ?? []).map(fromCategory));
      setIncomeTypes((it.data ?? []).map(fromIncomeType));
      setCharges((ch.data ?? []).map(fromCharge));
      setVariables((va.data ?? []).map(fromVariable));
      setIncome((inc.data ?? []).map(fromIncome));
      setAccounts((acc.data ?? []).map(fromAccount));
      if (set.data) {
        const sd = set.data as Row;
        setSettings({
          revenuCible: num(sd.revenu_cible),
          reminder: Boolean(sd.reminder),
          pctBesoins: num(sd.pct_besoins),
          pctEnvies: num(sd.pct_envies),
          pctEpargne: num(sd.pct_epargne),
        });
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase, router]);

  const value = useMemo<Store>(() => {
    // Accès dynamique aux tables (nom + payload variables) → typage souple.
    // La sécurité reste assurée par RLS côté base.
    const db = supabase as unknown as {
      from: (table: string) => {
        insert: (row: Row) => {
          select: () => { single: () => Promise<{ data: Row | null; error: { message: string } | null }> };
        };
        update: (row: Row) => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
        delete: () => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    };

    // Insère une ligne et l'ajoute à l'état local depuis la ligne renvoyée.
    const insert = async <T,>(
      table: string,
      row: Row,
      from: (r: Row) => T,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      prepend = false,
    ) => {
      const { data, error } = await db.from(table).insert(row).select().single();
      if (error || !data) {
        if (error) console.error(`insert ${table}`, error.message);
        return;
      }
      const mapped = from(data);
      setter((l) => (prepend ? [mapped, ...l] : [...l, mapped]));
    };

    const update = (table: string, id: string, row: Row) => {
      if (Object.keys(row).length === 0) return;
      db.from(table)
        .update(row)
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error(`update ${table}`, error.message);
        });
    };

    const remove = (table: string, id: string) => {
      db.from(table)
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error(`delete ${table}`, error.message);
        });
    };

    const updateSettings = (row: Row) => {
      const uid = userId.current;
      if (!uid) return;
      // upsert : crée la ligne si elle n'existe pas, sinon la met à jour.
      (
        supabase as unknown as {
          from: (t: string) => {
            upsert: (r: Row) => Promise<{ error: { message: string } | null }>;
          };
        }
      )
        .from("settings")
        .upsert({ user_id: uid, ...row })
        .then(({ error }) => {
          if (error) console.error("upsert settings", error.message);
        });
    };

    return {
      loading,
      charges,
      variables,
      income,
      accounts,
      categories,
      incomeTypes,
      settings,

      // Charges fixes
      addCharge: (data) =>
        insert("charges", chargeToRow(data), fromCharge, setCharges),
      updateCharge: (id, patch) => {
        setCharges((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)));
        update("charges", id, chargeToRow(patch));
      },
      removeCharge: (id) => {
        setCharges((l) => l.filter((c) => c.id !== id));
        remove("charges", id);
      },

      // Dépenses variables
      addVariable: (data) =>
        insert("variables", variableToRow(data), fromVariable, setVariables, true),
      updateVariable: (id, patch) => {
        setVariables((l) => l.map((v) => (v.id === id ? { ...v, ...patch } : v)));
        update("variables", id, variableToRow(patch));
      },
      removeVariable: (id) => {
        setVariables((l) => l.filter((v) => v.id !== id));
        remove("variables", id);
      },

      // Revenus
      addIncome: (data) =>
        insert("income", incomeToRow(data), fromIncome, setIncome, true),
      updateIncome: (id, patch) => {
        setIncome((l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r)));
        update("income", id, incomeToRow(patch));
      },
      removeIncome: (id) => {
        setIncome((l) => l.filter((r) => r.id !== id));
        remove("income", id);
      },

      // Comptes d'épargne
      addAccount: (data) =>
        insert("accounts", accountToRow(data), fromAccount, setAccounts),
      updateAccount: (id, patch) => {
        setAccounts((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));
        update("accounts", id, accountToRow(patch));
      },
      removeAccount: (id) => {
        setAccounts((l) => l.filter((a) => a.id !== id));
        remove("accounts", id);
      },
      addContribution: (id, amount) => {
        let next: SavingsAccount | undefined;
        setAccounts((l) =>
          l.map((a) => {
            if (a.id !== id) return a;
            next = { ...a, added: a.added + amount, balance: a.balance + amount };
            return next;
          }),
        );
        if (next) update("accounts", id, { added: next.added, balance: next.balance });
      },

      // Catégories
      addCategory: (data) =>
        insert("categories", { label: data.label, icon: data.icon }, fromCategory, setCategories),
      updateCategory: (id, patch) => {
        setCategories((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)));
        update("categories", id, patch as Row);
      },
      removeCategory: (id) => {
        setCategories((l) => l.filter((c) => c.id !== id));
        remove("categories", id);
      },

      // Natures de revenu
      addIncomeType: (data) =>
        insert("income_types", { label: data.label }, fromIncomeType, setIncomeTypes),
      updateIncomeType: (id, patch) => {
        setIncomeTypes((l) => l.map((t) => (t.id === id ? { ...t, ...patch } : t)));
        update("income_types", id, patch as Row);
      },
      removeIncomeType: (id) => {
        setIncomeTypes((l) => l.filter((t) => t.id !== id));
        remove("income_types", id);
      },

      // Réglages
      setRevenuCible: (n) => {
        setSettings((s) => ({ ...s, revenuCible: n }));
        updateSettings({ revenu_cible: n });
      },
      setReminder: (b) => {
        setSettings((s) => ({ ...s, reminder: b }));
        updateSettings({ reminder: b });
      },
      setRulePct: (key, pct) => {
        setSettings((s) => ({
          ...s,
          ...(key === "besoins"
            ? { pctBesoins: pct }
            : key === "envies"
              ? { pctEnvies: pct }
              : { pctEpargne: pct }),
        }));
        updateSettings(
          key === "besoins"
            ? { pct_besoins: pct }
            : key === "envies"
              ? { pct_envies: pct }
              : { pct_epargne: pct },
        );
      },
    };
  }, [
    loading,
    charges,
    variables,
    income,
    accounts,
    categories,
    incomeTypes,
    settings,
    supabase,
  ]);

  return (
    <DataContext.Provider value={value}>
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <span className="animate-pulse text-sm font-medium text-graphite/50">
            Chargement…
          </span>
        </div>
      ) : (
        children
      )}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData doit être utilisé dans <DataProvider>");
  return ctx;
}

/**
 * Objectifs (montants prévus) dérivés du revenu cible et de la règle de
 * répartition : Besoins (fixes), Envies (variables), Épargne.
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
