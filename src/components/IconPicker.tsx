"use client";

/**
 * Choix d'icône : emojis proposés + un champ « le tien » pour saisir/coller
 * n'importe quel emoji (astuce : Windows = touche Win + « . »).
 */
export function IconPicker({
  value,
  onChange,
  presets,
}: {
  value: string;
  onChange: (icon: string) => void;
  presets: string[];
}) {
  const isCustom = value !== "" && !presets.includes(value);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {presets.map((ic) => (
        <button
          key={ic}
          type="button"
          aria-label={`Icône ${ic}`}
          aria-pressed={value === ic}
          onClick={() => onChange(ic)}
          className={`flex size-8 items-center justify-center rounded-lg text-base transition ${
            value === ic ? "bg-lavender/60" : "bg-white"
          }`}
        >
          {ic}
        </button>
      ))}
      <input
        value={isCustom ? value : ""}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="🙂"
        aria-label="Emoji personnalisé"
        title="Ton emoji (Win + . pour le clavier emoji)"
        className={`size-8 rounded-lg text-center text-base outline-none ring-plum/30 focus:ring-2 ${
          isCustom ? "bg-lavender/60" : "bg-white"
        }`}
      />
    </div>
  );
}
