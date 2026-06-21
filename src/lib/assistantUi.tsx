"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { currentMonthValue } from "@/components/MonthSelector";
import { isAssistantEnabled, isMonthReviewed, markMonthReviewed } from "./assistant";

/**
 * Visibilité de l'assistant d'ouverture + état « mois mis à jour », pilotables
 * depuis n'importe où (l'Accueil insiste tant que le mois n'est pas fait ;
 * l'assistant le met en avant). Partagé pour réagir en direct.
 */
type AssistantUiCtx = {
  visible: boolean;
  open: () => void;
  close: () => void;
  monthReviewed: boolean;
  markReviewed: () => void;
};

const Ctx = createContext<AssistantUiCtx | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [monthReviewed, setMonthReviewed] = useState(true); // true par défaut (évite un flash)

  // À l'ouverture : afficher si activé + lire si le mois courant est déjà fait.
  useEffect(() => {
    if (isAssistantEnabled()) setVisible(true);
    setMonthReviewed(isMonthReviewed(currentMonthValue()));
  }, []);

  return (
    <Ctx.Provider
      value={{
        visible,
        open: () => setVisible(true),
        close: () => setVisible(false),
        monthReviewed,
        markReviewed: () => {
          markMonthReviewed(currentMonthValue());
          setMonthReviewed(true);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAssistant doit être utilisé dans <AssistantProvider>");
  return ctx;
}
