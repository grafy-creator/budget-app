# Assistant à l'ouverture — Design (validé 2026-06-21)

## But
Faciliter au maximum la gestion : à l'ouverture, un assistant propose quoi faire,
pour éviter de naviguer sur toutes les pages. Réutilise l'existant (feuille « + »,
Accueil, store) plutôt que dupliquer.

## Décisions (cadrage avec Rin)
- **Fréquence** : à **chaque ouverture** de l'app.
- **Comportement** : **hybride** (réutilise quand c'est bien fait, fait sur place sinon).
- **Revenus au début du mois** : **ressaisir/valider chaque mois**, base = mois précédent
  (rien créé tant que non validé).
- **Passer** : ferme l'assistant pour cette session ; **interrupteur dans Réglages**
  (« Assistant à l'ouverture ») pour le couper complètement.

## Architecture
- **Overlay plein écran** monté dans `src/app/(tabs)/layout.tsx` (Accueil chargé derrière).
  Pas de route dédiée (évite les soucis de bouton retour).
- Réutilise `QuickEntry` (feuille « + ») et le store `useData()`.
- État local de l'assistant : écran d'accueil → branche choisie → (éventuellement) étapes.
- **Persistance légère en local (localStorage)**, pas de nouvelle table Supabase :
  - `assistant-enabled` (bool, défaut true) — piloté par l'interrupteur Réglages.
  - `assistant-reviewed-<YYYY-MM>` (bool) — mois déjà mis à jour → enlève le badge « à faire ».

## Écrans / flux
1. **Accueil assistant** : « Bonjour Rin 👋 Que souhaites-tu faire ? » + 3 cartes :
   - ➕ Ajouter un montant
   - 👀 Consulter
   - 🗓️ Mettre à jour le mois  (badge « ● à faire » si mois courant non révisé)
   - lien **Passer →** (ferme l'overlay pour cette session)
2. **Ajouter** : choix Dépense / Charge / Revenu → ouvre la feuille « + » pré-réglée
   sur le bon type (réutilise QuickEntry).
3. **Consulter** (réponse sur place) : « Il te reste X € · Y € à payer ce mois ·
   revenus/dépenses/épargne du mois ». Boutons : « Voir le détail » (→ Accueil) / « Retour ».
4. **Mettre à jour le mois** — parcours 3 étapes (barre 1/3) :
   - Étape 1 Revenus : liste du mois précédent comme base → par ligne Garder / Modifier /
     Supprimer + Ajouter ; « Valider les revenus » (crée les lignes validées sur le mois courant).
   - Étape 2 Charges fixes : liste (se reportent déjà) → ajuster un montant, en ajouter ;
     « Valider les charges ».
   - Étape 3 Budgets prévus : catégories + prévu → ajuster, en ajouter ; « Valider les budgets ».
   - Fin : « C'est à jour ✅ » → `markMonthReviewed(mois courant)`, le badge disparaît.
5. **Réglages** : interrupteur « Assistant à l'ouverture » (on/off → `assistant-enabled`).

## Hors périmètre (YAGNI)
Pas d'IA/voix, pas de notifications push, pas de nouvelle table Supabase.

## Itération
Implémentation d'abord, Rin teste, retours ensuite.
