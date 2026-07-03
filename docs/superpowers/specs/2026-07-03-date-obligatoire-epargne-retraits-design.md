# Design — Date obligatoire, solde d'épargne à la création, suivi des retraits

> Date : 2026-07-03 · Décideuse : Rin · App : Budget App (Next.js 16 + Supabase)
> Statut : **validé** (les 3 parties approuvées le 2026-07-03).

## Contexte

Trois demandes issues de l'usage réel :

1. **Bug/UX date** : la saisie rapide pré-remplit la date sur « aujourd'hui » en silence ; Rin oublie de la changer et enregistre une opération à la mauvaise date.
2. **Épargne — solde à la création** : impossible de saisir l'argent déjà présent dans un compte lors de sa création → l'épargne existante n'apparaît pas dans le total.
3. **Suivi des retraits** : Rin vire parfois de l'épargne vers son compte principal « pour dépanner » et veut savoir combien elle doit « rendre ».

État technique de référence :
- Le magasin `src/lib/store.tsx` est **branché sur Supabase** (RLS par `user_id`, écritures optimistes). Le CLAUDE.md §9 le décrit encore « en mémoire » — **périmé**.
- La saisie rapide vit dans `src/components/QuickEntry.tsx` (piloté par `src/lib/quickEntry.tsx`).
- L'écran Épargne vit dans `src/components/epargne/EpargneView.tsx`.
- Persistance nouvelle table = pattern de `charge_payments` (`docs/schema.sql` + `docs/migration-00X-*.sql`).

---

## Partie 1 — Date obligatoire à la saisie rapide

### Objectif
Rendre le choix de la date **conscient** : plus de date « aujourd'hui » injectée en silence.

### Comportement
- Ouverture par le **FAB (+)** : le champ Date part **vide** (`""`) au lieu de `todayISO()`.
- Ouverture depuis l'**Agenda** (appui long → `openSheet(dateISO)`) : la date reste **pré-remplie** avec le jour choisi (choix explicite, inchangé).
- Un bouton **« Aujourd'hui »** à côté du champ date remplit `todayISO()` en 1 tap.
- **Valider désactivé** tant que la date est vide, **pour les types `depense` et `revenu`** (les seules opérations stockant une `date`).
- **`charge`** : inchangé (jour d'échéance `dayOfMonth`, pas de date). **`epargne`** : versement = cumul non daté → date non requise ; le champ date n'est pas exigé pour ce type.

### Changements
- `src/components/QuickEntry.tsx`
  - `useEffect` d'ouverture : `setDate(initialDate ?? "")` (au lieu de `?? todayISO()`).
  - `reset()` : `setDate("")` (au lieu de `todayISO()`).
  - `canSubmit` : ajouter la contrainte date requise pour `depense`/`revenu` :
    `const dateOk = (type !== "depense" && type !== "revenu") || date.trim() !== "";`
    `canSubmit = !done && amountValue > 0 && dateOk;`
  - UI : ajouter un bouton **« Aujourd'hui »** dans le bloc date (visible pour depense/revenu/epargne). Optionnel : indiquer visuellement que la date est requise quand vide (ex. libellé « Date · requise »).
- `src/lib/format.ts` : `todayISO()` existe déjà, réutilisé.

### Hors périmètre
- Ne pas dater les versements d'épargne (resterait un cumul mensuel).

---

## Partie 2 — Solde actuel à la création d'un compte d'épargne

### Objectif
Saisir l'argent **déjà présent** dans un compte à sa création, sans le compter comme un « ajout du mois », pour que le total d'épargne soit juste.

### Modèle (rappel + clarification)
`SavingsAccount { before, added, balance, goal, projection, ... }`
- **`balance`** = **Solde actuel** = source de vérité, alimente le total (`total = Σ balance`).
- **`added`** = **Ajouté ce mois** = cumul des versements du mois (informatif ; déjà reflété dans `balance` via un versement).
- Un **versement** (`addContribution`) monte `balance` **et** `added` → le total grimpe (comportement déjà correct).

### Comportement
- Le formulaire « Nouveau compte » (`EpargneView`) gagne un champ **« Solde actuel »**.
- À la création : `balance = soldeActuel`, `before = soldeActuel`, `added = 0`.
  → L'argent existant compte dans le total **sans** gonfler « Ajouté ce mois ».
- Édition d'un compte existant : le champ « Solde actuel » du formulaire édite `balance` (les cartes ont déjà l'édition en ligne de `balance`, `added`, `goal` — inchangées, elles restent des échappatoires manuelles).
- Clarifier les libellés/aide : « Solde actuel = ce que tu as » / « Ajouté ce mois = versé ce mois-ci ».

### Changements
- `src/components/epargne/EpargneView.tsx`
  - `AccountForm` : ajouter `solde: string`.
  - `openNew()` : `solde: ""`. `openEdit(id)` : `solde: String(a.balance ?? "")`.
  - `renderAccountForm()` : champ « Solde actuel » (même style que le champ Objectif).
  - `saveForm()` :
    - création : `addAccount({ ..., before: solde, balance: solde, added: 0, goal, projection: "" })`.
    - édition : `updateAccount(form.id, { icon, label, goal, balance: solde })`.
- `QuickEntry.createAccount()` : inchangé (création éclair juste avant un versement → démarre à 0, le versement pose le solde).

### Hors périmètre
- Pas de refonte de la relation `before`/`added`/`balance` ; on comble juste le trou à la création.

---

## Partie 3 — Suivi des retraits (« à rendre »)

### Objectif
Enregistrer les retraits d'un compte d'épargne vers le compte principal, et suivre le **total à rendre** avec un **historique** remboursable ligne par ligne.

### Modèle de données
Nouvelle entité **`Withdrawal`** :
```
Withdrawal {
  id: string;
  accountId: string;   // FK accounts
  amount: number;
  date: string;        // 'YYYY-MM-DD'
  note: string;        // ex. « avance loyer » (optionnel)
  repaid: boolean;     // remboursé ou non
}
```

Table Supabase **`withdrawals`** (pattern `charge_payments`) :
```
id          uuid pk default gen_random_uuid()
user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade
account_id  uuid not null references public.accounts(id) on delete cascade
amount      numeric(12,2) not null default 0
date        text not null                 -- 'YYYY-MM-DD'
note        text not null default ''
repaid      boolean not null default false
created_at  timestamptz not null default now()
```
+ index `(user_id, date desc)`, RLS `withdrawals_owner` (auth.uid() = user_id).

### Comportement
- **Créer un retrait** (bouton « − Retrait » par compte) : mini-formulaire montant + date (défaut vide, cohérent Partie 1, avec « Aujourd'hui ») + note.
  → insertion `withdrawals` (`repaid=false`) **et** `balance -= amount` (le solde baisse).
- **Section « À rendre »** sur l'écran Épargne :
  - **Total à rendre** = `Σ amount des retraits non remboursés`, affiché en couleur **Alerte** (`#C4871F`) **doublée d'un libellé** (accessibilité : jamais la couleur seule). Masquée si total = 0.
  - **Liste datée** des retraits non remboursés (montant · compte · date · note) + bouton **« Rembourser »** + suppression.
- **Rembourser** : `repaid = true` **et** `balance += amount` (l'argent revient) → le retrait quitte « à rendre ».
- **Supprimer** un retrait **non remboursé** : `balance += amount` (annule la sortie) puis suppression. Supprimer un retrait **déjà remboursé** : suppression simple (le solde a déjà été restauré).

### Changements
- `docs/migration-003-retraits.sql` (nouveau, non destructif) + `docs/schema.sql` (nouvelle table pour les installs neuves).
- `src/lib/mock.ts` : type `Withdrawal` exporté.
- `src/lib/store.tsx` :
  - state `withdrawals: Withdrawal[]` ; chargement dans le `Promise.all` initial (`from("withdrawals").select("*").order("date", { ascending: false })`) + mapper `fromWithdrawal` / `withdrawalToRow`.
  - `addWithdrawal(accountId, amount, date, note)` : insert + `balance -= amount` (optimiste, comme `addContribution`).
  - `repayWithdrawal(id)` : `update repaid=true` + `balance += amount`.
  - `removeWithdrawal(id)` : si `!repaid` → `balance += amount` ; delete.
  - Exposer les 3 méthodes + `withdrawals` dans le type `Store`.
- `src/components/epargne/EpargneView.tsx` :
  - bouton « − Retrait » + mini-formulaire par compte (état local, comme `versementFor`).
  - ligne « À rendre » par compte (si le compte a des retraits non remboursés).
  - section globale « À rendre » (total + liste + Rembourser).

### Hors périmètre V1
- Pas de retrait via le FAB/QuickEntry (reste dans l'écran Épargne).
- Pas de remboursement partiel d'un retrait (on rembourse la ligne entière).
- Les retraits ne modifient pas « Ajouté ce mois » (concept distinct des versements).

---

## Découpage / interfaces

- **QuickEntry** (Partie 1) : autonome, aucune dépendance nouvelle.
- **EpargneView** (Parties 2 & 3) : consomme le magasin via `useData()`.
- **store.tsx** (Parties 2 & 3) : ajoute `withdrawals` + 3 actions ; l'interface `useData()` reste rétrocompatible.
- **SQL** : migration additive, sans destruction.

## Tests / vérification
- Date : impossible de valider une dépense/revenu sans date ; « Aujourd'hui » remplit ; Agenda pré-remplit toujours.
- Solde : créer un compte avec 2 000 € → total inclut 2 000 €, « Ajouté ce mois » = 0 ; un versement de 100 € → solde 2 100 €, ajouté 100 €, total +100 €.
- Retrait : retrait 150 € → solde −150 €, total à rendre +150 € ; Rembourser → solde +150 €, à rendre −150 € ; supprimer un retrait non remboursé → solde restauré.
- Build : `npm run build` (type-check) passe.
