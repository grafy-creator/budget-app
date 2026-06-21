import { BottomNav } from "@/components/BottomNav";
import { QuickEntry } from "@/components/QuickEntry";
import { DataProvider } from "@/lib/store";
import { QuickEntryProvider } from "@/lib/quickEntry";

/**
 * Coquille des onglets de l'app (Aujourd'hui, Budget, Épargne, Bilan, Réglages).
 * Cadre mobile-first (réf. 390px) centré sur desktop. Le défilement se fait au
 * niveau du document (et non d'un conteneur interne) : la nav basse, le FAB et
 * la feuille de saisie sont en `position: fixed` ancrés au bas de l'écran du
 * téléphone (avec safe-area), donc ils ne bougent pas au scroll, sur tous les
 * téléphones. Le contenu réserve de la place en bas (pb) pour ne pas passer
 * sous la nav.
 */
export default function TabsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-graphite/5">
      <div className="relative mx-auto min-h-dvh w-full max-w-[440px] bg-background shadow-sm">
        <DataProvider>
          <QuickEntryProvider>
            <main className="min-w-0 px-5 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-12">
              {children}
            </main>
            <QuickEntry />
          </QuickEntryProvider>
        </DataProvider>
        <BottomNav />
      </div>
    </div>
  );
}
