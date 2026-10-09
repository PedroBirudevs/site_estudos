import { Sidebar } from "@/components/Sidebar";
import { sessao } from "@/lib/supabase";

async function sidebarSubjects() {
  try {
    const { db, userId } = await sessao();
    const { data } = await db
      .from("subjects")
      .select("id, name")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    return (data ?? []) as { id: string; name: string }[];
  } catch {
    return [];
  }
}

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Sidebar subjects={await sidebarSubjects()} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-8 lg:py-12">{children}</main>
        <footer className="mx-auto w-full max-w-[1200px] px-4 pb-8 sm:px-8">
          <p className="border-t border-borda pt-6 text-sm text-texto-suave">
            BiruStudy · resumos e perguntas feitos só com o seu material.
          </p>
        </footer>
      </div>
    </>
  );
}
