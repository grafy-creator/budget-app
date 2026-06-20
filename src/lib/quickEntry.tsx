"use client";

import { createContext, useContext, useState } from "react";

/**
 * Contexte pour piloter la feuille « Saisie rapide » depuis n'importe quel
 * écran (le FAB, mais aussi un clic sur une date de l'agenda).
 */
type QuickEntryCtx = {
  open: boolean;
  initialDate: string | null;
  openSheet: (date?: string) => void;
  closeSheet: () => void;
};

const Ctx = createContext<QuickEntryCtx | null>(null);

export function QuickEntryProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialDate, setInitialDate] = useState<string | null>(null);

  return (
    <Ctx.Provider
      value={{
        open,
        initialDate,
        openSheet: (date) => {
          setInitialDate(date ?? null);
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
