"use client";

import { useEffect, useState } from "react";
import { getEmojiRecents, pushEmojiRecent } from "@/lib/emojiRecents";

/**
 * Choix d'icône : emojis récemment utilisés (en 1er), puis les propositions,
 * plus un champ « le tien » pour saisir/coller n'importe quel emoji
 * (astuce : Windows = touche Win + « . »).
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
  const [recents, setRecents] = useState<string[]>([]);
  useEffect(() => setRecents(getEmojiRecents()), []);

  // Récents d'abord, puis les présélections non déjà présentes (sans doublon).
  const ordered = [...recents, ...presets.filter((p) => !recents.includes(p))];
  const isCustom = value !== "" && !ordered.includes(value);

  function pick(ic: string) {
    onChange(ic);
    setRecents(pushEmojiRecent(ic));
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {ordered.map((ic) => (
        <button
          key={ic}
          type="button"
          aria-label={`Icône ${ic}`}
          aria-pressed={value === ic}
          onClick={() => pick(ic)}
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
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v) setRecents(pushEmojiRecent(v));
        }}
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
