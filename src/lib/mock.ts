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

export type SavingsAccount = {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  before: number;
  added: number;
  balance: number;
  goal: number;
  projection: string;
};

export const savings = {
  monthLabel: "Avril 2026",
  total: 4400,
  accounts: [
    {
      id: "livret-a",
      label: "Livret A",
      icon: "🐷",
      badge: "Principal",
      before: 2400,
      added: 200,
      balance: 2600,
      goal: 5000,
      projection: "Dans 13 mois à ce rythme (mai 2027)",
    },
    {
      id: "pel",
      label: "PEL",
      icon: "🏦",
      before: 1700,
      added: 100,
      balance: 1800,
      goal: 5000,
      projection: "Dans 32 mois à ce rythme",
    },
  ] satisfies SavingsAccount[],
  simulator: {
    monthly: 300,
    target: 5000,
    eta: "8 mois (jan. 2027)",
    saved: "5 mois de gagnés",
  },
};

export type BilanRow = {
  id: string;
  icon: string;
  label: string;
  prevu: number;
  reel: number;
  ecart: number; // signé
  good: boolean; // l'écart est-il favorable ?
};

export const bilan = {
  monthLabel: "Avril 2026",
  banner: {
    title: "🎉 Bon mois ! Tu es dans les clous.",
    sub: "Quelques ajustements sur l'épargne.",
  },
  rows: [
    { id: "revenus", icon: "💰", label: "Revenus", prevu: 2500, reel: 2650, ecart: 150, good: true },
    { id: "fixes", icon: "🔒", label: "Fixes", prevu: 1000, reel: 880, ecart: -120, good: true },
    { id: "variables", icon: "🛒", label: "Variables", prevu: 500, reel: 420, ecart: -80, good: true },
    { id: "epargne", icon: "🐷", label: "Épargne", prevu: 500, reel: 300, ecart: -200, good: false },
  ] satisfies BilanRow[],
  reste: 1050,
  analysis: [
    { icon: "✅", text: "Tu as gagné 150 € de plus que prévu.", bad: false },
    { icon: "✅", text: "Tu as dépensé moins que prévu.", bad: false },
    { icon: "🔴", text: "Tu as épargné 200 € de moins.", bad: true },
  ],
  unallocated: 1050,
};

export type DotKind = "fixe" | "variable" | "echeance";

export type DayItem = {
  icon: string;
  label: string;
  kind: "fixe" | "variable";
  amount: number;
  paid: boolean;
};

export const calendar = {
  monthLabel: "Avril 2026",
  daysInMonth: 30,
  firstWeekday: 3, // 1 = lundi … 7 = dimanche ; avril 2026 démarre un mercredi
  today: 10,
  // Pastilles affichées sur chaque jour.
  markers: {
    1: ["fixe"],
    3: ["variable"],
    5: ["variable"],
    9: ["variable"],
    10: ["echeance", "fixe"],
    15: ["fixe"],
    18: ["variable"],
    22: ["variable"],
    28: ["variable"],
  } as Record<number, DotKind[]>,
  // Détail par jour (panneau « jour sélectionné »).
  details: {
    1: [{ icon: "🏠", label: "Loyer", kind: "fixe", amount: 800, paid: true }],
    3: [{ icon: "🛒", label: "Courses", kind: "variable", amount: 85, paid: true }],
    5: [{ icon: "🍽️", label: "Restaurant", kind: "variable", amount: 42, paid: true }],
    9: [{ icon: "🎮", label: "Jeu vidéo", kind: "variable", amount: 25, paid: true }],
    10: [
      { icon: "📺", label: "Netflix", kind: "fixe", amount: 13.99, paid: false },
      { icon: "🎵", label: "Spotify", kind: "fixe", amount: 9.99, paid: false },
    ],
    15: [{ icon: "📱", label: "Téléphone", kind: "fixe", amount: 20, paid: false }],
    18: [{ icon: "🍽️", label: "Restaurant", kind: "variable", amount: 38, paid: true }],
    22: [{ icon: "🛒", label: "Courses", kind: "variable", amount: 64, paid: true }],
    28: [{ icon: "🚗", label: "Essence", kind: "variable", amount: 50, paid: true }],
  } as Record<number, DayItem[]>,
};
