import Link from "next/link";
import { NewSubjectForm } from "@/components/NewSubjectForm";
import { db, type Subject } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await db()
    .from("subjects")
    .select("*, materials(count)")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className="card text-sm">
        <p className="font-medium text-bad">Não consegui ler o banco de dados.</p>
        <p className="mt-2 text-muted">{error.message}</p>
        <p className="mt-2 text-muted">Confira as variáveis do Supabase e se você rodou supabase/schema.sql.</p>
      </div>
    );
  }

  const subjects = (data ?? []) as (Subject & { materials: { count: number }[] })[];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Matérias</h1>
        <p className="mt-1 text-sm text-muted">
          Suba o material de cada disciplina. A IA estuda com você usando só o que o professor já deu.
        </p>
      </section>

      {subjects.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {subjects.map((s) => (
            <li key={s.id}>
              <Link href={`/materias/${s.id}`} className="card block transition hover:border-accent">
                <p className="font-semibold">{s.name}</p>
                {s.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{s.description}</p>}
                <p className="mt-3 text-xs text-muted">
                  {s.materials[0]?.count ?? 0} {s.materials[0]?.count === 1 ? "material" : "materiais"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card text-sm text-muted">Nenhuma matéria ainda. Crie a primeira abaixo.</p>
      )}

      <NewSubjectForm />
    </div>
  );
}
