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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
      <head>
        <link rel="icon" type="image/png" href="/icon.png?v=3" />
        <link rel="shortcut icon" href="/icon.png?v=3" />
        <link rel="apple-touch-icon" href="/apple-icon.png?v=3" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-text overflow-x-hidden w-full max-w-[100vw]">
        {children}
      </body>
    </html>
  );
}
