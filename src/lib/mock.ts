/**
 * Données d'exemple pour visualiser les écrans avant le branchement Supabase.
 * À remplacer par des requêtes réelles (transactions, récurrences, etc.).
 */

export type TodayCharge = {
  id: string;
  label: string;
  meta: string;
  amount: number;
  icon: string;
  paid: boolean;
};

export const today = {
  dateLabel: "Jeudi 10 avril 2026",
  available: 620,
  endOfMonthProjection: 180,
  charges: [
    {
      id: "netflix",
      label: "Netflix",
      meta: "10 avril · Charge fixe",
      amount: 13.99,
      icon: "📺",
      paid: false,
    },
    {
      id: "spotify",
      label: "Spotify",
      meta: "10 avril · Charge fixe",
      amount: 9.99,
      icon: "🎵",
      paid: false,
    },
  ] satisfies TodayCharge[],
  month: {
    income: 2650,
    expenses: 1300,
    savings: 200,
    // Budgets de référence pour les barres de progression.
    incomeTarget: 2650,
    expensesBudget: 2500,
    savingsTarget: 500,
  },
};

export const todayOutflow = today.charges
  .filter((c) => !c.paid)
  .reduce((sum, c) => sum + c.amount, 0);

export type FixedCharge = {
  id: string;
  label: string;
  day: string;
  amount: number;
  icon: string;
  paid: boolean;
};

export type VariableExpense = {
  id: string;
  label: string;
  date: string;
  amount: number;
  icon: string;
};

export const budget = {
  monthLabel: "Avril 2026",
  // Enveloppes (budgets alloués) — valeurs de référence.
  fixedBudget: 1000,
  variableBudget: 500,
  fixedSpent: 880,
  variableSpent: 420,
  fixedCharges: [
    { id: "loyer", label: "Loyer", day: "Le 1er du mois", amount: 800, icon: "🏠", paid: true },
    { id: "netflix", label: "Netflix", day: "Le 10 du mois", amount: 13.99, icon: "📺", paid: false },
    { id: "spotify", label: "Spotify", day: "Le 10 du mois", amount: 9.99, icon: "🎵", paid: false },
    { id: "telephone", label: "Téléphone", day: "Le 15 du mois", amount: 20, icon: "📱", paid: true },
  ] satisfies FixedCharge[],
  variableExpenses: [
    { id: "courses", label: "Courses", date: "3 avr", amount: 85, icon: "🛒" },
    { id: "restaurant", label: "Restaurant", date: "5 avr", amount: 42, icon: "🍽️" },
  ] satisfies VariableExpense[],
};
