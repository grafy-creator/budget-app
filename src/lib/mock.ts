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
