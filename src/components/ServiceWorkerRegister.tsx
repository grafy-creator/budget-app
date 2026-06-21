"use client";

import { useEffect } from "react";

/**
 * Service worker DÉSACTIVÉ pour l'instant : l'ancien interceptait aussi les
 * appels à Supabase (cache hors-ligne trop large), ce qui bloquait les
 * enregistrements (ERR_INTERNET_DISCONNECTED). On désinscrit tout SW existant
 * et on vide ses caches. Un cache hors-ligne propre (même origine uniquement)
 * pourra être réintroduit plus tard.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
    }
    if (typeof caches !== "undefined") {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
    }
  }, []);

  return null;
}
