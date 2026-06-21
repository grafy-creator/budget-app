"use client";

import { createContext, useContext, useState } from "react";

/** Types de saisie rapide (alignés sur QuickEntry). */
export type QuickType = "depense" | "revenu" | "epargne" | "charge";

/**
 * Contexte pour piloter la feuille « Saisie rapide » depuis n'importe quel
 * écran (le FAB, un clic sur une date de l'agenda, ou l'assistant d'ouverture).
 */
type QuickEntryCtx = {
  open: boolean;
  initialDate: string | null;
  initialType: QuickType | null;
  openSheet: (date?: string, type?: QuickType) => void;
  closeSheet: () => void;
};

const Ctx = createContext<QuickEntryCtx | null>(null);

export function QuickEntryProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialDate, setInitialDate] = useState<string | null>(null);
  const [initialType, setInitialType] = useState<QuickType | null>(null);

  return (
    <Ctx.Provider
      value={{
        open,
        initialDate,
        initialType,
        openSheet: (date, type) => {
          setInitialDate(date ?? null);
          setInitialType(type ?? null);
          setOpen(true);
        },
        closeSheet: () => setOpen(false),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useQuickEntry() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useQuickEntry doit être utilisé dans <QuickEntryProvider>");
  return ctx;
}
