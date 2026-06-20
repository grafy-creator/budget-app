"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker (/sw.js) côté client après le chargement.
 * Inactif en développement pour éviter les soucis de cache pendant le dev.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Échec silencieux : l'app reste fonctionnelle sans offline.
      });
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
