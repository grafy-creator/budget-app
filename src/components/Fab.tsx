"use client";

/**
 * Bouton d'action flottant (+) — ouvrira la feuille « Saisie rapide » (écran 06).
 * Non câblé pour l'instant : la bottom sheet sera implémentée plus tard.
 */
export function Fab() {
  return (
    <button
      type="button"
      aria-label="Ajouter une transaction"
      onClick={() => {
        // TODO: ouvrir la feuille modale « Saisie rapide » (écran 06).
      }}
      className="absolute bottom-[88px] right-5 z-30 flex size-14 items-center justify-center rounded-full bg-plum text-3xl font-bold leading-none text-white shadow-lg shadow-plum/30 transition active:scale-95"
    >
      <span className="-mt-1" aria-hidden>
        +
      </span>
    </button>
  );
}
