/*
 * Service worker « kill-switch » : remplace l'ancien SW qui mettait en cache
 * l'app et interceptait les appels Supabase. À l'activation, il vide tous les
 * caches, se désinscrit, et recharge les onglets ouverts avec la version
 * fraîche (réseau). Plus aucun cache hors-ligne pour l'instant.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});

// Ne rien intercepter : tout passe directement au réseau.
