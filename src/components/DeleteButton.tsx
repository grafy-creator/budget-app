"use client";

/**
 * Bouton de suppression clair (icône corbeille) avec une bonne cible tactile.
 * Remplace l'ancien « ✕ ».
 */
export function DeleteButton({
  label,
  onClick,
  className = "",
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`Supprimer ${label}`}
      title={`Supprimer ${label}`}
      onClick={onClick}
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-graphite/40 transition hover:bg-error/10 hover:text-error active:scale-90 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
        <path d="M10 11v6M14 11v6" />
      </svg>
    </button>
  );
}
