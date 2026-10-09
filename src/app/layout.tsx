import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PasswordModal } from "@/components/PasswordModal";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "BiruStudy",
  description: "BiruStudy: estudo das matérias com resumos e perguntas feitos a partir do seu próprio material.",
  applicationName: "BiruStudy",
  // logo.png vem primeiro; o capelo em SVG fica de reserva enquanto a logo não existe.
  icons: { icon: [{ url: "/logo.png", type: "image/png" }, { url: "/icon.svg", type: "image/svg+xml" }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-fundo text-texto antialiased">
        {children}
        <PasswordModal />
      </body>
    </html>
  );
}
