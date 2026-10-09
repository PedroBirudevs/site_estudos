import { Icon } from "@/components/Icon";
import { listarCursos } from "@/lib/catalogo";
import { matricular } from "@/lib/matricula";

export const dynamic = "force-dynamic";

const ICONES: Record<string, "terminal" | "balanca" | "coracao"> = {
  "ciencia-da-computacao": "terminal",
  direito: "balanca",
  enfermagem: "coracao",
};

export default async function EscolherCurso() {
  const cursos = await listarCursos();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl">Escolha seu curso</h1>
        <p className="mt-2 text-texto-suave">A grade de matérias do curso aparece no seu início.</p>
      </div>
      <ul className="grid gap-5 md:grid-cols-3">
        {cursos.map((c) => (
          <li key={c.id} className={`card flex flex-col sm:p-8 ${c.ativo ? "" : "bg-superficie"}`}>
            <div className="flex items-start justify-between gap-3">
              <span
                className={`grid size-12 place-items-center rounded-lg ${
                  c.ativo ? "bg-azul-claro text-azul-principal" : "bg-borda text-texto-suave"
                }`}
              >
                <Icon name={ICONES[c.slug] ?? "capelo"} className="size-6" />
              </span>
              {!c.ativo && (
                <span className="rounded-full border border-borda bg-fundo px-3 py-1 text-xs font-medium text-texto-suave">
                  Em breve
                </span>
              )}
            </div>
            <h2 className={`mt-6 flex-1 text-lg ${c.ativo ? "" : "text-texto-suave"}`}>{c.nome}</h2>
            <form action={matricular} className="mt-6">
              <input type="hidden" name="curso_id" value={c.id} />
              <button className="btn w-full" disabled={!c.ativo}>
                {c.ativo ? "Escolher este curso" : "Indisponível"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
