import Link from "next/link";
import { redirect } from "next/navigation";
import { Grade } from "@/components/Grade";
import { Icon } from "@/components/Icon";
import { NewSubjectForm } from "@/components/NewSubjectForm";
import { gradeDoCurso, meusCursos } from "@/lib/catalogo";
import { sessao, type Subject } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const FUSO = "America/Sao_Paulo";

function saudacao(agora: Date) {
  const hora = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: FUSO }).format(agora));
  return hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
}

export default async function Home() {
  const cursos = await meusCursos();
  // Primeiro acesso: ainda sem curso.
  if (cursos.length === 0) redirect("/app/escolher-curso");

  const { db, userId, user } = await sessao();
  const [grades, proprias, materiais, resumos] = await Promise.all([
    Promise.all(cursos.map((c) => gradeDoCurso(c.id))),
    db.from("subjects").select("id, name").eq("user_id", userId).order("created_at", { ascending: true }),
    db.from("materials").select("*", { count: "exact", head: true }).eq("user_id", userId),
    db.from("summaries").select("*", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  // Primeiro nome, vindo do cadastro.
  const nome = String(user.user_metadata?.nome ?? "").split(" ")[0];
  const minhas = (proprias.data ?? []) as Pick<Subject, "id" | "name">[];
  const agora = new Date();
  const hoje = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: FUSO }).format(agora);

  const stats = [
    { label: "Matérias no curso", value: grades.reduce((n, g) => n + g.length, 0) },
    { label: "Materiais enviados", value: materiais.count ?? 0 },
    { label: "Resumos gerados", value: resumos.count ?? 0 },
  ];

  return (
    <div className="space-y-12">
      <section>
        <p className="text-sm text-texto-suave first-letter:uppercase">{hoje}</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">
          {saudacao(agora)}
          {nome && `, ${nome}`}
        </h1>
      </section>

      <section className="grid gap-5 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-texto-suave">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold">{s.value.toLocaleString("pt-BR")}</p>
          </div>
        ))}
      </section>

      {cursos.map((c, i) => (
        <section key={c.id}>
          <h2 className="text-xl">{c.nome}</h2>
          <div className="mt-5">
            <Grade materias={grades[i]} />
          </div>
        </section>
      ))}

      <section className="space-y-4 border-t border-borda pt-8">
        {minhas.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-texto-suave">Minhas matérias</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {minhas.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/app/materias/${s.id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-borda px-3 py-2 text-sm hover:border-azul-principal"
                  >
                    <Icon name="livro" className="size-4 text-azul-principal" />
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <details className="group">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm text-texto-suave hover:text-azul-principal [&::-webkit-details-marker]:hidden">
            <Icon name="mais" className="size-4" />
            Criar matéria própria
          </summary>
          <div className="mt-4 max-w-2xl">
            <NewSubjectForm />
          </div>
        </details>
      </section>
    </div>
  );
}
