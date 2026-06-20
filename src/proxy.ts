import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 : convention « proxy » (ex-« middleware »).
export async function proxy(request: NextRequest) {
  // Tant que Supabase n'est pas configuré (clés absentes), on laisse passer :
  // l'app reste démarrable avant que Rin renseigne ses identifiants.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf :
     * - _next/static, _next/image (assets build)
     * - favicon, manifest, service worker, icônes
     * - fichiers d'images statiques
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
