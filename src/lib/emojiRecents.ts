/**
 * Emojis récemment utilisés (partagés entre tous les sélecteurs d'icône).
 * Stockés en local (localStorage) pour rester d'une session à l'autre, afin
 * d'afficher en premier les derniers choisis (saisie plus fluide).
 */
const KEY = "emoji-recents";
const MAX = 8;

export function getEmojiRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? (arr.filter((e) => typeof e === "string") as string[]) : [];
  } catch {
    return [];
  }
}

export function pushEmojiRecent(emoji: string): string[] {
  const e = emoji.trim();
  if (typeof window === "undefined" || !e) return getEmojiRecents();
  const next = [e, ...getEmojiRecents().filter((x) => x !== e)].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota / mode privé : on ignore */
  }
  return next;
}
