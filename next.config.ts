import type { NextConfig } from "next";

// Les appels Supabase passent par le domaine de l'app (/sb/*) puis sont
// reverse-proxyés vers Supabase côté serveur. Le navigateur ne contacte donc
// jamais supabase.co directement → contourne les blocages réseau (VPN, filtres)
// qui ne visent que ce domaine. Le serveur Vercel, lui, joint Supabase sans VPN.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://rttkvjgzbmktfoataipo.supabase.co";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/sb/:path*", destination: `${SUPABASE_URL}/:path*` },
    ];
  },
};

export default nextConfig;
