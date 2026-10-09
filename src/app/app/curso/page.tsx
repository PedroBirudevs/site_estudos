import Link from "next/link";
import { redirect } from "next/navigation";
import { Grade } from "@/components/Grade";
import { gradeDoCurso, meusCursos } from "@/lib/catalogo";

export const dynamic = "force-dynamic";

export default async function MeuCurso() {
  const cursos = await meusCursos();
  if (cursos.length === 0) redirect("/app/escolher-curso");
  const grades = await Promise.all(cursos.map((c) => gradeDoCurso(c.id)));

  return (
    <div className="space-y-12">
      {cursos.map((c, i) => (
        <section key={c.id}>
          <p className="text-sm text-texto-suave">Meu curso</p>
          <h1 className="mt-1 text-3xl">{c.nome}</h1>
          <p className="mt-2 text-texto-suave">
            {grades[i].length} matérias em {new Set(grades[i].map((m) => m.periodo)).size} períodos.
          </p>
          <div className="mt-8">
            <Grade materias={grades[i]} />
          </div>
        </section>
      ))}
      <Link href="/app/escolher-curso" className="text-sm text-texto-suave hover:text-azul-principal">
        Ver outros cursos
      </Link>
    </div>
  );
}
