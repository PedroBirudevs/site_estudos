import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PasswordModal } from "@/components/PasswordModal";
import { Sidebar } from "@/components/Sidebar";
import { db } from "@/lib/supabase";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "BiruStudy",
  description: "BiruStudy: estudo das matérias com resumos e perguntas feitos a partir do seu próprio material.",
  applicationName: "BiruStudy",
  // logo.png vem primeiro; o capelo em SVG fica de reserva enquanto a logo não existe.
  icons: { icon: [{ url: "/logo.png", type: "image/png" }, { url: "/icon.svg", type: "image/svg+xml" }] },
};

async function sidebarSubjects() {
  try {
    const { data } = await db().from("subjects").select("id, name").order("created_at", { ascending: true });
    return (data ?? []) as { id: string; name: string }[];
  } catch {
    return [];
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-fundo text-texto antialiased">
        <Sidebar subjects={await sidebarSubjects()} />
        <div className="flex min-h-screen flex-col lg:pl-64">
          <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-8 lg:py-12">{children}</main>
          <footer className="mx-auto w-full max-w-[1200px] px-4 pb-8 sm:px-8">
            <p className="border-t border-borda pt-6 text-sm text-texto-suave">
              BiruStudy · resumos e perguntas feitos só com o seu material.
            </p>
          </footer>
        </div>
        <PasswordModal />
      </body>
    </html>
  );
}
