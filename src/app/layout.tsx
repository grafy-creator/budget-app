import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Budget App",
  description:
    "Gestion financière personnelle — suivi des dépenses, revenus et épargne.",
  applicationName: "Budget App",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Budget App",
  },
};

export const viewport: Viewport = {
  themeColor: "#3D2B52", // Deep Plum (charte Rin Studio)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
