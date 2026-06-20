"use client";

import { useEffect, useRef, useState } from "react";
import { formatEuro } from "@/lib/format";

/**
 * Montant éditable en ligne : on tape dessus pour le modifier (champ),
 * Entrée ou perte de focus pour valider, Échap pour annuler.
 * Le soulignement pointillé indique qu'il est modifiable.
 */
export function EditableAmount({
  value,
  onCommit,
  sign = "none",
  className = "",
  ariaLabel = "Modifier le montant",
}: {
  value: number;
  onCommit: (next: number) => void;
  sign?: "none" | "plus" | "minus";
  className?: string;
  ariaLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function start() {
    setDraft(String(value));
    setEditing(true);
  }

  function commit() {
    const n = parseFloat(draft.replace(",", "."));
    if (!Number.isNaN(n) && n >= 0) onCommit(n);
    setEditing(false);
  }

  const prefix = sign === "plus" ? "+" : sign === "minus" ? "−" : "";

  if (editing) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        {prefix}
        <input
          ref={inputRef}
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9.,]/g, ""))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          aria-label={ariaLabel}
          className="w-16 rounded bg-graphite/10 px-1 text-right outline-none ring-plum/40 focus:ring-2"
        />
        <span className="ml-0.5">€</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      aria-label={ariaLabel}
      className={`underline decoration-graphite/25 decoration-dotted underline-offset-4 transition active:scale-95 ${className}`}
    >
      {prefix}
      {formatEuro(value)}
    </button>
  );
}
