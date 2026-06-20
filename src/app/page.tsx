export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-4xl" aria-hidden>
        💜
      </span>
      <h1 className="text-3xl font-bold text-plum">Budget App</h1>
      <p className="max-w-sm text-graphite/70">
        Projet initialisé. La gestion financière personnelle de Rin —
        dépenses, revenus, budget par enveloppes et épargne.
      </p>
      <p className="text-sm text-violet">
        Prochaine étape : intégration des écrans (maquette Figma).
      </p>
    </main>
  );
}
