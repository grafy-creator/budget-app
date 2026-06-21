"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { isAssistantEnabled } from "./assistant";

/**
 * Visibilité de l'assistant d'ouverture, pilotable depuis n'importe où
 * (affiché à l'ouverture si activé, ou rouvert via un bouton « Assistant »).
 */
type AssistantUiCtx = {
  visible: boolean;
  open: () => void;
  close: () => void;
};

const Ctx = createContext<AssistantUiCtx | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  // À l'ouverture : afficher si l'assistant est activé (préférence locale).
  useEffect(() => {
    if (isAssistantEnabled()) setVisible(true);
  }, []);

  return (
    <Ctx.Provider
      value={{ visible, open: () => setVisible(true), close: () => setVisible(false) }}
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
