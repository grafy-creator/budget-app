# Budget App — Guide projet (CLAUDE.md)

> Référence unique pour toute personne ou IA qui développe ce projet.
> Sources : `CDC_Budget_App_Rin.docx` (cahier des charges V1.0, mai 2026) + maquette Figma (`Lien maquette figma.txt`).
> **En cas de doute, le cahier des charges fait foi.** Toute fonctionnalité non listée ici est hors scope V1.

## 1. Le projet en une phrase

Application **web + mobile (PWA)** de **gestion financière personnelle**, pour une **utilisatrice unique** (Rin) à revenus mixtes : salaire d'alternance fixe (~800–900 €/mois) + revenus freelance variables. Objectif : voir clair sur entrées/sorties, piloter un budget par enveloppes et suivre l'épargne, sans friction de saisie.

- **Statut** : **projet échafaudé** (Next.js 16 + Tailwind v4 + Supabase + PWA en place). Écrans non encore implémentés — prochaine étape : intégration de la maquette Figma.
- **Langue de l'app** : français uniquement.
- **Échéance** : prototype fonctionnel avant **septembre 2026** (contrainte dure : lancement studio Rin).
- **Budget** : zéro (build perso IA) ; dev externe envisageable si devis < 1 500 €.

## 2. Stack technique (imposée par le CDC)

| Couche | Techno |
|---|---|
| Frontend | **Next.js (React) — App Router** |
| Auth | **Supabase Auth** (email + mot de passe) |
| Base de données | **Supabase PostgreSQL + Row Level Security** |
| Hébergement front | **Vercel** (free tier) |
| Hébergement BDD | **Supabase** (free tier, < 500 Mo) |
| PWA | plugin PWA Next.js (manifest + service worker) |
| Graphiques | **Recharts** ou Chart.js |
| Déploiement | GitHub + Vercel CI/CD |

**Contraintes dures :**
- Coût d'hébergement < 15 €/mois (idéalement gratuit).
- Toutes les dépendances doivent être **open source** (MIT / Apache 2.0 / équivalent). Pas de framework propriétaire.
- Le code appartient intégralement à Rin.
- HTTPS obligatoire ; chaque donnée liée à `user_id` via **RLS** ; aucune donnée financière accessible sans auth valide.
- **Pas d'analytics comportementaux, pas de partage de données tierces.**

## 3. Design system (charte Rin Studio — à respecter strictement)

Le design soigné est **non négociable** : niveau visé « professionnel à premium ».

**Couleurs :**
| Rôle | Hex |
|---|---|
| Primaire (Deep Plum) | `#3D2B52` |
| Secondaire (Soft Violet) | `#7B65A6` |
| Accent (Lavender) | `#C8B8E6` |
| Fond (Cloud) | `#F4F1FA` |
| Texte (Graphite) | `#2D2433` |
| Succès | `#3B7D5E` |
| Alerte | `#C4871F` |
| Erreur | `#C0392B` |

**Typographies :** Cabinet Grotesk (titres), Satoshi (corps).

**Accessibilité :**
- Contrastes **WCAG 2.1 AA** minimum sur tous les textes.
- Police mobile ≥ **16px**.
- Jamais la couleur seule pour une info critique → toujours doublée d'un label ou d'une icône.

**Cible responsive :** mobile-first, **largeur de référence 390px** (maquette), minimum **375px** (iPhone SE). Le dashboard doit tenir sans scroll horizontal sur 375px.

## 4. Écrans (d'après la maquette Figma)

Maquette : frames de **390 × 844**. 5 onglets de navigation basse + 1 feuille modale + 2 vues calendrier.

**Navigation basse (5 onglets) :** `Aujourd'hui` · `Budget` · `Épargne` · `Bilan` · `Réglages`. Un **FAB `+`** ouvre la saisie rapide.

1. **01 — Aujourd'hui** (accueil/dashboard) : salutation + date ; **carte solde** (« Il te reste X € disponibles maintenant » + projection fin de mois) ; section « Ce qui se passe aujourd'hui » (charges récurrentes du jour avec bouton **Payer**) ; bandeau d'alerte (« X € vont partir aujourd'hui ») ; bloc « Ce mois-ci » (Revenus / Dépenses / Épargne avec barres de progression).
2. **02 — Budget** : sélecteur de mois ; onglets (3) ; barres résumé (budget / dépensé / reste) ; **Charges fixes** (Loyer, Netflix, Spotify, Téléphone… avec case « payé ») ; **Variables** (Courses, Restaurant…).
3. **03 — Épargne** : carte total épargné ; cartes par produit (**Livret A**, **PEL**) avec objectif, barre de progression et projection ; **simulateur** d'épargne.
4. **04 — Bilan** : sélecteur de mois ; bandeau ; **tableau Prévu / Réel / Écart** par catégorie + reste ; bloc d'analyse ; CTAs.
5. **05 — Réglages** : revenus (config) ; **règles de répartition** (type 50/30/20, barres) ; **récurrences** (ajouter/gérer les transactions récurrentes) ; toggle notifications ; bouton reset.
6. **06 — Saisie rapide** (bottom sheet modale) : sélecteur de type (dépense / revenu / …) ; saisie du montant ; grille de catégories (6) ; bouton valider. **Cible : < 3 taps, < 10 s.**
7. **07a / 07b — Calendrier** : calendrier mensuel avec pastilles sur les jours à transactions + légende ; vue « jour sélectionné » détaillant les dépenses du jour (statut payé/à venir, bouton Payer).

> ⚠️ **Divergences maquette ↔ CDC à clarifier avec Rin avant de coder** :
> - Le CDC place « notifications push » en **WON'T V1**, mais Réglages affiche un toggle notifications → confirmer s'il s'agit de simples rappels locaux ou si c'est hors scope.
> - Les écrans **Calendrier** et **règles de répartition (50/30/20)** apparaissent dans la maquette mais ne sont pas explicitement priorisés MoSCoW dans le CDC → confirmer leur statut (MUST/SHOULD/COULD).

## 5. Périmètre V1 (MoSCoW)

**MUST** — Auth (email/mdp) · dashboard mensuel (solde, dépenses, revenus) · saisie transaction (dépense/revenu) · catégories personnalisables · **distinction revenu fixe / freelance variable** · budget alloué par catégorie · suivi objectif épargne (création + progression) · historique filtrable par mois · graphique de répartition des dépenses · responsive web (desktop + mobile).

**SHOULD** — évolution des revenus sur 6 mois · prévision du mois suivant · récurrences (loyer, abonnements) · notes libres par transaction · dark mode (OLED).

**COULD** — tags libres · export CSV basique · widget résumé PWA · comparaison prévu vs réel sur graphique.

**WON'T V1** — connexion bancaire auto (API Bankin'/Plaid) · import CSV de relevés · multi-comptes bancaires · multi-utilisateurs / partage · app native iOS/Android · comptabilité freelance (TVA, charges URSSAF) · export PDF/Excel.

## 6. Concepts métier clés

- **Deux types de revenus distincts** : fixe (alternance) vs **freelance variable** (montant, date, source/client). La distinction doit être **visible dans la liste ET dans les graphiques**.
- **Budget par enveloppes** : montant alloué par catégorie, suivi du dépensé et du reste.
- **Charges fixes récurrentes** : payables/cochables, visibles le jour J sur le dashboard.
- **Objectifs d'épargne** : création, montant mensuel affecté, progression (barre/jauge), modifiable en cours de route.
- **Saisie manuelle uniquement** (aucune connexion bancaire en V1).

## 7. Performance & compatibilité (critères d'acceptation)

- Chargement initial < **3 s** en 4G.
- Saisie d'une transaction (tap → confirmation) < **5 s**, **≤ 3 taps**.
- Mode offline basique (consultation du dernier état mis en cache).
- Cibles : iOS Safari 15+, Android Chrome 100+ ; desktop Chrome/Firefox/Safari (dernières stables).
- Accès à une URL de transaction sans être connectée → redirection login.

## 8. Modèle de données (esquisse à valider)

Toutes les tables portent un `user_id` (FK auth, RLS activée). À affiner lors de la conception :
- `transactions` (montant, type dépense/revenu, sous-type fixe/freelance, catégorie, date, source/client, note, tags, récurrence_id?).
- `categories` (nom, icône, couleur, budget alloué).
- `recurrences` (libellé, montant, jour du mois, catégorie, actif).
- `savings_goals` / `savings_accounts` (Livret A, PEL… : nom, objectif, solde, versement mensuel).
- `settings` (revenus de référence, règles de répartition, préférences).

## 9. Commandes & structure

**Versions clés :** Next.js 16 (App Router, **Turbopack** par défaut), React 19, Tailwind CSS **v4** (config via `@theme` dans le CSS, pas de `tailwind.config.js`), TypeScript 5.

**Scripts (`package.json`) :**
- `npm run dev` — serveur de développement (http://localhost:3000).
- `npm run build` — build de production (inclut le type-check).
- `npm start` — sert le build de production.
- `npm run lint` — ESLint.

**Configuration locale :** copier `.env.local.example` → `.env.local` et renseigner les clés Supabase. Tant qu'elles sont absentes, le `proxy` laisse passer toutes les routes (l'app démarre sans Supabase).

**Arborescence :**
```
src/
  app/
    layout.tsx        # locale fr, métadonnées, viewport/theme-color, enregistrement SW
    page.tsx          # placeholder d'accueil (à remplacer par l'écran 01)
    globals.css       # @theme : tokens charte Rin Studio + polices Fontshare
    manifest.ts       # manifest PWA natif (compatible Turbopack)
  components/
    ServiceWorkerRegister.tsx
  lib/supabase/
    client.ts         # client navigateur (Composants Client)
    server.ts         # client serveur (RSC / Route Handlers / Server Actions)
    middleware.ts     # updateSession() : refresh session + garde d'auth
  proxy.ts            # ex-middleware (convention Next 16) ; redirige vers /login si non connecté
public/
  sw.js               # service worker offline basique
  icon.svg            # icône PWA (placeholder — exporter des PNG 192/512 depuis Figma)
docs/                 # CDC + lien maquette (sources de référence)
```

**Décisions d'architecture (init) :**
- **PWA sans plugin webpack.** Next 16 utilise Turbopack par défaut ; les plugins type `next-pwa` (webpack) ne sont pas fiables. On utilise donc le `manifest.ts` natif de Next + un service worker écrit à la main (`public/sw.js`) → compatible tout bundler, couvre l'« offline basique » du CDC. Évolution possible : Serwist.
- **Polices via Fontshare** (`@import` dans `globals.css`) : Cabinet Grotesk + Satoshi y sont distribuées gratuitement. Pour la prod/l'offline, basculer en self-host via `next/font/local` (déposer les `.woff2`).
- **Auth Supabase via `@supabase/ssr`** (cookies). Le `proxy` rafraîchit la session et redirige les routes privées vers `/login` (routes publiques : `/login`, `/auth/*`). La page `/login` reste à créer.
- **Icônes PWA** : `icon.svg` est un placeholder ; exporter de vrais PNG 192×192 et 512×512 (dont une variante *maskable*) depuis Figma pour une installabilité optimale.

## 10. Conventions de travail

- **Écosystème Windows + PowerShell** (voir l'environnement) ; le shell Bash est aussi disponible pour les scripts POSIX.
- Communiquer et nommer l'UI **en français** (l'app est francophone).
- Respecter le scope : ne pas implémenter de fonctionnalité hors MoSCoW V1 sans validation de Rin.
- Rin est **seule décideuse** ; les évolutions se décident sur l'usage réel, pas sur l'ambition initiale.
