# Date obligatoire, solde d'épargne à la création, suivi des retraits — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Forcer la saisie consciente d'une date, permettre de saisir le solde existant à la création d'un compte d'épargne, et suivre les retraits d'épargne (« à rendre ») avec historique remboursable.

**Architecture:** UI React (Next.js 16 App Router) sur un magasin `useData()` branché Supabase (écritures optimistes + RLS). On modifie 3 composants (`QuickEntry`, `EpargneView`), on étend le magasin (`store.tsx`) et le modèle (`mock.ts`), et on ajoute une table `withdrawals` (migration additive).

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind v4 (`@theme`), Supabase (PostgreSQL + RLS).

**Note vérification :** ce projet n'a **pas** de framework de test (scripts `lint` + `build` uniquement, aucun fichier de test). Conformément aux conventions du dépôt, la vérification de chaque tâche se fait par **`npm run build`** (inclut le type-check TypeScript), **`npm run lint`**, et une **vérification manuelle** dans l'app (`npm run dev`). On n'introduit pas de test runner (hors périmètre, YAGNI).

**Palette (tokens Tailwind existants) :** `plum` `#3d2b52`, `violet`, `lavender`, `graphite`, `success` `#3b7d5e`, `warning` `#c4871f` (= Alerte de la charte), `error`.

---

## File Structure

- `docs/migration-003-retraits.sql` — **Créer** : migration additive (table `withdrawals` + index + RLS).
- `docs/schema.sql` — **Modifier** : table `withdrawals` pour les installations neuves.
- `src/lib/mock.ts` — **Modifier** : type `Withdrawal`.
- `src/lib/store.tsx` — **Modifier** : state `withdrawals`, mapper, chargement, actions `addWithdrawal`/`repayWithdrawal`/`removeWithdrawal`, type `Store`.
- `src/components/QuickEntry.tsx` — **Modifier** : date obligatoire + bouton « Aujourd'hui ».
- `src/components/epargne/EpargneView.tsx` — **Modifier** : champ « Solde actuel » à la création + UI retraits (bouton, formulaire, section « À rendre »).
- `CLAUDE.md` — **Modifier** : note de suivi (§4) + correction §9 (magasin Supabase, non « en mémoire »).

---

## Task 1: Migration SQL `withdrawals`

**Files:**
- Create: `docs/migration-003-retraits.sql`
- Modify: `docs/schema.sql` (table après `charge_payments`, index dans le bloc index, RLS + policy dans le bloc RLS)

- [ ] **Step 1: Créer le fichier de migration**

Create `docs/migration-003-retraits.sql` :

```sql
-- ====================================================================
-- Budget App — Migration 003 : suivi des retraits d'épargne (« à rendre »)
-- ====================================================================
-- NON DESTRUCTIF : ne supprime AUCUNE donnée existante.
-- À exécuter UNE FOIS dans Supabase : SQL Editor > New query > coller > Run.
-- Pré-requis : schema.sql + migration 002 déjà en place.
-- ====================================================================

-- Retraits d'un compte d'épargne vers le compte principal (à rembourser) ----
create table if not exists public.withdrawals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  amount     numeric(12, 2) not null default 0,
  date       text not null,                 -- 'YYYY-MM-DD'
  note       text not null default '',
  repaid     boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists withdrawals_user_idx
  on public.withdrawals (user_id, date desc);

alter table public.withdrawals enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'withdrawals'
      and policyname = 'withdrawals_owner'
  ) then
    create policy "withdrawals_owner" on public.withdrawals
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
```

- [ ] **Step 2: Ajouter la table à `docs/schema.sql`**

Dans `docs/schema.sql`, juste après le bloc `create table public.charge_payments (...)` (ligne ~111), insérer :

```sql
-- Retraits d'épargne à rembourser (« à rendre ») ---------------------
create table public.withdrawals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  amount     numeric(12, 2) not null default 0,
  date       text not null,                 -- 'YYYY-MM-DD'
  note       text not null default '',
  repaid     boolean not null default false,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 3: Ajouter l'index, l'activation RLS et la policy à `docs/schema.sql`**

Dans le bloc `-- Index`, après `charge_payments_user_idx` (ligne ~131) :

```sql
create index withdrawals_user_idx on public.withdrawals (user_id, date desc);
```

Dans le bloc RLS, après `alter table public.charge_payments enable row level security;` (ligne ~142) :

```sql
alter table public.withdrawals enable row level security;
```

Après la policy `charge_payments_owner` (ligne ~158) :

```sql
create policy "withdrawals_owner" on public.withdrawals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- [ ] **Step 4: Vérifier la cohérence SQL (relecture)**

Relire les deux fichiers : la table `withdrawals` doit référencer `public.accounts (id) on delete cascade`, avoir `withdrawals_owner`, et l'index `withdrawals_user_idx`. (Pas d'exécution ici — la migration sera lancée par Rin dans Supabase.)

- [ ] **Step 5: Commit**

```bash
git add docs/migration-003-retraits.sql docs/schema.sql
git commit -m "SQL: table withdrawals (suivi des retraits d'epargne) + RLS"
```

---

## Task 2: Type `Withdrawal` dans le modèle

**Files:**
- Modify: `src/lib/mock.ts` (après le type `SavingsAccount`, ~ligne 189)

- [ ] **Step 1: Ajouter le type**

Dans `src/lib/mock.ts`, juste après la définition de `export type SavingsAccount = {...};` :

```ts
// Retrait d'un compte d'épargne vers le compte principal, à rembourser.
export type Withdrawal = {
  id: string;
  accountId: string;
  amount: number;
  date: string; // 'YYYY-MM-DD'
  note: string;
  repaid: boolean;
};
```

- [ ] **Step 2: Vérifier le type-check**

Run: `npm run build`
Expected: build réussi (aucune erreur TypeScript liée à `mock.ts`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/mock.ts
git commit -m "Modele: type Withdrawal (retrait d'epargne)"
```

---

## Task 3: Magasin `store.tsx` — state + actions retraits

**Files:**
- Modify: `src/lib/store.tsx`

- [ ] **Step 1: Importer le type `Withdrawal`**

Dans le bloc `import type { ... } from "./mock";` (lignes 13-21), ajouter `Withdrawal` à la liste :

```ts
import type {
  FixedCharge,
  VariableExpense,
  IncomeEntry,
  SavingsAccount,
  Category,
  IncomeType,
  ChargePayment,
  Withdrawal,
} from "./mock";
```

- [ ] **Step 2: Déclarer les entrées du type `Store`**

Dans le type `Store` (après le bloc `addContribution`, ~ligne 81), ajouter :

```ts
  withdrawals: Withdrawal[];
  addWithdrawal: (
    accountId: string,
    amount: number,
    date: string,
    note: string,
  ) => void;
  repayWithdrawal: (id: string) => void;
  removeWithdrawal: (id: string) => void;
```

- [ ] **Step 3: Ajouter le mapper ligne → modèle**

Après le mapper `fromAccount` (~ligne 155), ajouter :

```ts
const fromWithdrawal = (r: Row): Withdrawal => ({
  id: r.id as string,
  accountId: r.account_id as string,
  amount: num(r.amount),
  date: r.date as string,
  note: (r.note as string) ?? "",
  repaid: Boolean(r.repaid),
});
```

- [ ] **Step 4: Ajouter le state**

Après `const [accounts, setAccounts] = useState<SavingsAccount[]>([]);` (~ligne 209), ajouter :

```ts
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
```

- [ ] **Step 5: Charger les retraits au montage**

Dans le `Promise.all` (~ligne 227), ajouter une requête `withdrawals` et l'inclure dans le tuple destructuré. Remplacer :

```ts
      const [cat, it, ch, va, inc, acc, pay, set] = await Promise.all([
        supabase.from("categories").select("*").order("created_at"),
        supabase.from("income_types").select("*").order("created_at"),
        supabase.from("charges").select("*").order("created_at"),
        supabase.from("variables").select("*").order("date", { ascending: false }),
        supabase.from("income").select("*").order("date", { ascending: false }),
        supabase.from("accounts").select("*").order("created_at"),
        supabase.from("charge_payments").select("*"),
        supabase.from("settings").select("*").maybeSingle(),
      ]);
```

par :

```ts
      const [cat, it, ch, va, inc, acc, pay, wd, set] = await Promise.all([
        supabase.from("categories").select("*").order("created_at"),
        supabase.from("income_types").select("*").order("created_at"),
        supabase.from("charges").select("*").order("created_at"),
        supabase.from("variables").select("*").order("date", { ascending: false }),
        supabase.from("income").select("*").order("date", { ascending: false }),
        supabase.from("accounts").select("*").order("created_at"),
        supabase.from("charge_payments").select("*"),
        supabase.from("withdrawals").select("*").order("date", { ascending: false }),
        supabase.from("settings").select("*").maybeSingle(),
      ]);
```

Puis, après `setAccounts((acc.data ?? []).map(fromAccount));` (~ligne 244), ajouter :

```ts
      setWithdrawals((wd.data ?? []).map(fromWithdrawal));
```

- [ ] **Step 6: Ajouter les actions dans le `value` (useMemo)**

Après le bloc `addContribution: (id, amount) => {...},` (se termine ~ligne 469), ajouter :

```ts
      // Retraits d'épargne (« à rendre »)
      addWithdrawal: (accountId, amount, date, note) => {
        insert(
          "withdrawals",
          { account_id: accountId, amount, date, note, repaid: false },
          fromWithdrawal,
          setWithdrawals,
          true,
        );
        let next: SavingsAccount | undefined;
        setAccounts((l) =>
          l.map((a) => {
            if (a.id !== accountId) return a;
            next = { ...a, balance: a.balance - amount };
            return next;
          }),
        );
        if (next) update("accounts", accountId, { balance: next.balance });
      },
      repayWithdrawal: (id) => {
        const w = withdrawals.find((x) => x.id === id);
        if (!w || w.repaid) return;
        setWithdrawals((l) =>
          l.map((x) => (x.id === id ? { ...x, repaid: true } : x)),
        );
        update("withdrawals", id, { repaid: true });
        let next: SavingsAccount | undefined;
        setAccounts((l) =>
          l.map((a) => {
            if (a.id !== w.accountId) return a;
            next = { ...a, balance: a.balance + w.amount };
            return next;
          }),
        );
        if (next) update("accounts", w.accountId, { balance: next.balance });
      },
      removeWithdrawal: (id) => {
        const w = withdrawals.find((x) => x.id === id);
        if (!w) return;
        setWithdrawals((l) => l.filter((x) => x.id !== id));
        remove("withdrawals", id);
        if (!w.repaid) {
          let next: SavingsAccount | undefined;
          setAccounts((l) =>
            l.map((a) => {
              if (a.id !== w.accountId) return a;
              next = { ...a, balance: a.balance + w.amount };
              return next;
            }),
          );
          if (next) update("accounts", w.accountId, { balance: next.balance });
        }
      },
```

- [ ] **Step 7: Exposer `withdrawals` dans l'objet retourné**

Dans l'objet `return { loading, charges, variables, income, accounts, categories, incomeTypes, settings, ... }` (~ligne 374), ajouter `withdrawals,` à la liste des collections (par ex. juste après `accounts,`) :

```ts
      accounts,
      withdrawals,
```

- [ ] **Step 8: Ajouter `withdrawals` aux dépendances du useMemo**

Dans le tableau de dépendances du `useMemo` (~lignes 527-538), ajouter `withdrawals` (par ex. après `accounts,`) :

```ts
  }, [
    loading,
    charges,
    variables,
    income,
    accounts,
    withdrawals,
    categories,
    incomeTypes,
    payments,
    settings,
    supabase,
  ]);
```

- [ ] **Step 9: Vérifier le type-check**

Run: `npm run build`
Expected: build réussi, aucune erreur TypeScript.

- [ ] **Step 10: Lint**

Run: `npm run lint`
Expected: aucune erreur.

- [ ] **Step 11: Commit**

```bash
git add src/lib/store.tsx
git commit -m "Store: withdrawals (add/repay/remove) + solde ajuste de facon optimiste"
```

---

## Task 4: `QuickEntry` — date obligatoire + bouton « Aujourd'hui »

**Files:**
- Modify: `src/components/QuickEntry.tsx`

- [ ] **Step 1: Date vide à l'ouverture (au lieu d'aujourd'hui)**

Dans le `useEffect` d'ouverture (~ligne 65), remplacer :

```ts
      setDate(initialDate ?? todayISO());
```

par :

```ts
      setDate(initialDate ?? "");
```

- [ ] **Step 2: Date vide dans `reset()`**

Dans `reset()` (~ligne 108), remplacer :

```ts
    setDate(todayISO());
```

par :

```ts
    setDate("");
```

- [ ] **Step 3: Rendre la date obligatoire pour dépense/revenu**

Remplacer le bloc `canSubmit` (~lignes 50-52) :

```ts
  const amountValue = parseFloat(amount.replace(",", "."));
  // La catégorie / le compte sont OPTIONNELS : seul le montant est requis.
  const canSubmit = !done && amountValue > 0;
```

par :

```ts
  const amountValue = parseFloat(amount.replace(",", "."));
  // Date obligatoire pour les opérations datées (dépense / revenu).
  const dateRequired = type === "depense" || type === "revenu";
  // La catégorie / le compte sont OPTIONNELS : montant requis, date requise si datée.
  const canSubmit =
    !done && amountValue > 0 && (!dateRequired || date.trim() !== "");
```

- [ ] **Step 4: Ajouter le bouton « Aujourd'hui » à côté du champ date**

Remplacer le `<label>` de date (branche `else` du ternaire `type === "charge" ? ... : ...`, ~lignes 331-340) :

```tsx
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
```

par :

```tsx
                <div className="flex items-center gap-2">
                  <label className="flex flex-1 items-center gap-2 rounded-xl bg-graphite/5 px-3 py-2.5">
                    <span className="text-xs font-semibold text-graphite/50">
                      📅 Date{dateRequired ? " · requise" : ""}
                    </span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      aria-label="Date"
                      className="min-w-0 flex-1 bg-transparent text-right text-sm text-graphite outline-none [color-scheme:light]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setDate(todayISO())}
                    className="shrink-0 rounded-xl bg-lavender/30 px-3 py-2.5 text-xs font-bold text-plum transition active:scale-95"
                  >
                    Aujourd&apos;hui
                  </button>
                </div>
```

- [ ] **Step 5: Vérifier le type-check + lint**

Run: `npm run build && npm run lint`
Expected: build + lint réussis. (`todayISO` est déjà importé ligne 5.)

- [ ] **Step 6: Vérification manuelle**

Run: `npm run dev`, ouvrir http://localhost:3000, taper le FAB (+).
Attendu :
- Type « Dépense » ou « Revenu » : le champ Date est **vide**, le libellé indique « requise », **Valider est désactivé** tant qu'aucune date n'est choisie ; « Aujourd'hui » remplit la date.
- Type « Charge fixe » : sélecteur de jour, pas de date requise. Type « Épargne » : pas de date requise.
- Depuis l'Agenda (appui long sur un jour) : la saisie s'ouvre avec la date du jour pré-remplie.

- [ ] **Step 7: Commit**

```bash
git add src/components/QuickEntry.tsx
git commit -m "Saisie rapide: date obligatoire (depense/revenu) + bouton Aujourd'hui"
```

---

## Task 5: `EpargneView` — « Solde actuel » à la création/édition

**Files:**
- Modify: `src/components/epargne/EpargneView.tsx`

- [ ] **Step 1: Ajouter `solde` au type de formulaire**

Remplacer le type `AccountForm` (~lignes 13-18) :

```ts
type AccountForm = {
  id: string | null;
  icon: string;
  label: string;
  goal: string;
};
```

par :

```ts
type AccountForm = {
  id: string | null;
  icon: string;
  label: string;
  goal: string;
  solde: string; // solde actuel (argent déjà présent)
};
```

- [ ] **Step 2: Initialiser `solde` dans `openNew` / `openEdit`**

Remplacer `openNew` et `openEdit` (~lignes 30-37) :

```ts
  function openNew() {
    setForm({ id: null, icon: "🐷", label: "", goal: "" });
  }
  function openEdit(id: string) {
    const a = accounts.find((x) => x.id === id);
    if (!a) return;
    setForm({ id: a.id, icon: a.icon, label: a.label, goal: String(a.goal ?? "") });
  }
```

par :

```ts
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
```

- [ ] **Step 3: Utiliser `solde` dans `saveForm`**

Remplacer `saveForm` (~lignes 38-55) :

```ts
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
```

par :

```ts
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
```

- [ ] **Step 4: Ajouter le champ « Solde actuel » dans le formulaire**

Dans `renderAccountForm()`, juste après le champ `<input>` du nom (le bloc se termine ~ligne 82, avant le `<div>` « Objectif »), insérer :

```tsx
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
```

- [ ] **Step 5: Vérifier le type-check + lint**

Run: `npm run build && npm run lint`
Expected: build + lint réussis.

- [ ] **Step 6: Vérification manuelle**

Run: `npm run dev`, écran Épargne, « + Compte ».
Attendu : créer un compte « Livret A » avec Solde actuel 2000 → le **Total** inclut 2000 €, la carte affiche **Solde actuel 2 000 €** et **Ajouté ce mois 0 €**. Un versement de 100 € → Solde 2 100 €, Ajouté ce mois 100 €, Total +100 €.

- [ ] **Step 7: Commit**

```bash
git add src/components/epargne/EpargneView.tsx
git commit -m "Epargne: solde actuel saisissable a la creation/edition d'un compte"
```

---

## Task 6: `EpargneView` — suivi des retraits (« à rendre »)

**Files:**
- Modify: `src/components/epargne/EpargneView.tsx`

- [ ] **Step 1: Importer `formatDateShort` et les actions du magasin**

Remplacer l'import de `format` (~ligne 7) :

```ts
import { formatEuro } from "@/lib/format";
```

par :

```ts
import { formatEuro, formatDateShort, todayISO } from "@/lib/format";
```

Remplacer le `useData()` destructuré (~lignes 21-22) :

```ts
  const { accounts, addAccount, updateAccount, removeAccount, addContribution } =
    useData();
```

par :

```ts
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
```

- [ ] **Step 2: Ajouter l'état local du formulaire de retrait + les dérivés « à rendre »**

Après les états `versementFor` / `versementAmt` (~lignes 25-26), ajouter :

```ts
  const [retraitFor, setRetraitFor] = useState<string | null>(null);
  const [retraitAmt, setRetraitAmt] = useState("");
  const [retraitDate, setRetraitDate] = useState("");
  const [retraitNote, setRetraitNote] = useState("");
```

Après `const total = accounts.reduce((s, a) => s + a.balance, 0);` (~ligne 28), ajouter :

```ts
  const unpaid = withdrawals.filter((w) => !w.repaid);
  const toRepay = unpaid.reduce((s, w) => s + w.amount, 0);
```

- [ ] **Step 3: Ajouter le gestionnaire `commitRetrait`**

Après `commitVersement` (~lignes 57-62), ajouter :

```ts
  function commitRetrait(id: string) {
    const n = parseFloat(retraitAmt.replace(",", ".")) || 0;
    if (n > 0 && retraitDate.trim()) addWithdrawal(id, n, retraitDate, retraitNote.trim());
    setRetraitFor(null);
    setRetraitAmt("");
    setRetraitDate("");
    setRetraitNote("");
  }
```

- [ ] **Step 4: Afficher la ligne « À rendre » par compte**

Dans le rendu de chaque compte, juste après le bloc de progression `</div>` de l'objectif (le `<div>` qui contient la barre `role="progressbar"`, se termine ~ligne 237) et **avant** le bloc « Ajouter un versement », insérer :

```tsx
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
```

- [ ] **Step 5: Remplacer le pied de carte (versement) par versement + retrait**

Remplacer tout le bloc « Ajouter un versement » (`{versementFor === a.id ? (...) : (...)}`, ~lignes 239-279) par :

```tsx
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
```

- [ ] **Step 6: Ajouter la section globale « À rendre »**

Juste après la fermeture du `.map(...)` des comptes et le bloc `{accounts.length === 0 && (...)}` (~ligne 288), et **avant** la section « Simulateur », insérer :

```tsx
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
```

- [ ] **Step 7: Vérifier le type-check + lint**

Run: `npm run build && npm run lint`
Expected: build + lint réussis. (`DeleteButton` est déjà importé ligne 4.)

- [ ] **Step 8: Vérification manuelle**

Run: `npm run dev`, écran Épargne.
Attendu :
- Sur un compte (solde 1000 €), taper « − Retrait », montant 150, date requise (bouton « Retirer » désactivé sans date), note « avance loyer », valider → **solde 850 €**, la carte affiche « ⚠️ À rendre 150 € », et la section globale « 💸 À rendre » liste `150 € · <compte> · <date> · avance loyer` avec un total **150 €**.
- « Rembourser » → solde **1000 €**, la ligne disparaît, total à rendre 0 (section masquée).
- Refaire un retrait puis le **supprimer** (corbeille) → solde restauré à 1000 €.

- [ ] **Step 9: Commit**

```bash
git add src/components/epargne/EpargneView.tsx
git commit -m "Epargne: suivi des retraits (bouton Retrait, section A rendre, remboursement)"
```

---

## Task 7: Mettre à jour la doc projet (CLAUDE.md)

**Files:**
- Modify: `CLAUDE.md` (§4 note de suivi ; §9 correction « en mémoire » → Supabase)

- [ ] **Step 1: Ajouter une puce de suivi dans la section 4**

Dans le bloc `> **Divergences maquette ↔ CDC — suivi**` (section 4), ajouter une puce datée :

```markdown
> - **Date obligatoire + suivi des retraits d'épargne** (2026-07-03) :
>   - **Saisie rapide** : la date n'est plus pré-remplie sur aujourd'hui au FAB ; elle est **requise** pour dépense/revenu (bouton « Aujourd'hui » pour la remplir en 1 tap). L'Agenda continue de pré-remplir le jour choisi.
>   - **Épargne** : le **solde actuel** est saisissable à la création d'un compte (compte dans le total, sans être un « ajout du mois »).
>   - **Retraits** : nouvelle table **`withdrawals`** (compte, montant, date, note, remboursé) ; un retrait sort du solde, « Rembourser » le restaure. Section « À rendre » sur l'écran Épargne. Migration `docs/migration-003-retraits.sql` (non destructif).
```

- [ ] **Step 2: Corriger la description périmée du magasin (§9)**

Dans la section 9 (bloc `> **Données** : magasin **en mémoire**...`), remplacer l'affirmation « en mémoire … Non persistant : réinitialisé au rechargement » par la réalité actuelle : le magasin `src/lib/store.tsx` est **branché sur Supabase** (chargement par `user_id` via RLS, écritures optimistes persistées). Remplacer la phrase d'ouverture :

```markdown
> **Données** : magasin **en mémoire** `src/lib/store.tsx` (`DataProvider` + `useData()`), initialisé depuis `src/lib/mock.ts`.
```

par :

```markdown
> **Données** : magasin `src/lib/store.tsx` (`DataProvider` + `useData()`) **branché sur Supabase** (chargement par `user_id` via RLS au montage, écritures optimistes persistées). Les types du modèle restent dans `src/lib/mock.ts` (les données d'exemple ne servent plus qu'au **Bilan**).
```

Et supprimer, dans la suite du même paragraphe, la mention « ⚠️ **Non persistant** : réinitialisé au rechargement. Branchement Supabase prévu **à la toute fin** » (devenue fausse).

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Doc: note date obligatoire + retraits ; corrige la description du magasin (Supabase)"
```

---

## Récapitulatif de vérification finale

- [ ] **Build complet**

Run: `npm run build`
Expected: succès (type-check inclus).

- [ ] **Lint**

Run: `npm run lint`
Expected: aucune erreur.

- [ ] **Parcours manuel complet** (`npm run dev`) :
  - Date requise sur dépense/revenu au FAB ; « Aujourd'hui » remplit ; Agenda pré-remplit.
  - Création de compte avec solde initial → total juste, « Ajouté ce mois » = 0.
  - Retrait → solde baisse + « À rendre » ; Rembourser → solde restauré ; Suppression d'un retrait non remboursé → solde restauré.
- [ ] **Migration Supabase** : exécuter `docs/migration-003-retraits.sql` dans le SQL Editor Supabase (action de Rin, hors code).
