/** Écran provisoire pour les onglets pas encore implémentés. */
export function PlaceholderScreen({
  icon,
  title,
  note,
}: {
  icon: string;
  title: string;
  note: string;
}) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-center">
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      <h1 className="text-2xl font-bold text-plum">{title}</h1>
      <p className="max-w-xs text-sm text-graphite/60">{note}</p>
      <span className="mt-2 rounded-full bg-lavender/30 px-3 py-1 text-xs font-medium text-violet">
        À venir
      </span>
    </div>
  );
}
