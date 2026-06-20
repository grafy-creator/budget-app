import { BottomNav } from "@/components/BottomNav";
import { QuickEntry } from "@/components/QuickEntry";

/**
 * Coquille des onglets de l'app (Aujourd'hui, Budget, Épargne, Bilan, Réglages).
 * Cadre mobile-first (réf. 390px) centré sur desktop. Le cadre est un bloc
 * centré (mx-auto) — et non un flex-item — pour qu'il se réduise bien jusqu'à
 * 375px sans débordement horizontal (CDC §6.3). La nav basse et le FAB sont
 * ancrés au cadre ; le contenu défile sous eux.
 */
export default function TabsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-graphite/5">
      <div className="relative mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-background shadow-sm">
        <main className="min-w-0 flex-1 overflow-y-auto px-5 pb-28 pt-12">
          {children}
        </main>
        <QuickEntry />
        <BottomNav />
      </div>
    </div>
  );
}
