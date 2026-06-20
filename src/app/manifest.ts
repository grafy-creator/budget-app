import type { MetadataRoute } from "next";

/**
 * Manifest PWA généré nativement par Next (aucun plugin webpack requis —
 * compatible Turbopack). Voir CLAUDE.md §2 (PWA).
 *
 * TODO : remplacer icon.svg par de vrais PNG 192x192 et 512x512 (dont une
 * variante "maskable") exportés depuis la maquette Figma pour une
 * installabilité optimale sur tous les navigateurs.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Budget App",
    short_name: "Budget",
    description:
      "Gestion financière personnelle — dépenses, revenus, budget et épargne.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4F1FA", // Cloud
    theme_color: "#3D2B52", // Deep Plum
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
