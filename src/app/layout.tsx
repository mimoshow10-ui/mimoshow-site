import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MIMO Show | Sua Loja Completa",
  description: "Sua loja completa de produtos Pet, Brinquedos, Decoração e Acessórios com envio rápido em todo o Brasil!",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
};

import { getAnalyticsConfig } from "@/lib/analytics/config";
import AnalyticsScripts from "@/components/analytics/AnalyticsScripts";
import CustomerJourneyTracker from "@/components/analytics/CustomerJourneyTracker";
import CookieConsentBanner from "@/components/analytics/CookieConsentBanner";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analyticsConfig = await getAnalyticsConfig();

  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
      <head>
        <link rel="icon" type="image/png" href="/icon.png?v=3" />
        <link rel="shortcut icon" href="/icon.png?v=3" />
        <link rel="apple-touch-icon" href="/apple-icon.png?v=3" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-text overflow-x-hidden w-full max-w-[100vw]">
        <AnalyticsScripts config={analyticsConfig} />
        <CustomerJourneyTracker />
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
