import Link from "next/link";
import type { MateriaNaGrade } from "@/lib/catalogo";
import { Icon } from "./Icon";

// Período atual: o primeiro com matéria que já tem tópicos (por enquanto, o 2º).
// ponytail: chute pela grade; quando existir "período atual" na matrícula, use-o aqui.
function periodoAtual(materias: MateriaNaGrade[]) {
  return materias.find((m) => (m.topicos[0]?.count ?? 0) > 0)?.periodo ?? 1;
}

export function Grade({ materias }: { materias: MateriaNaGrade[] }) {
  const periodos = [...new Set(materias.map((m) => m.periodo))];
  const atual = periodoAtual(materias);

  return (
    <div className="space-y-3">
      {periodos.map((p) => {
        const doPeriodo = materias.filter((m) => m.periodo === p);
        return (
          <details key={p} open={p === atual} className="card group p-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3">
                <span className="font-semibold">{p}º período</span>
                {p === atual && (
                  <span className="rounded-full bg-azul-claro px-2.5 py-0.5 text-xs font-medium text-azul-principal">
                    Atual
                  </span>
                )}
              </span>
              <span className="flex items-center gap-3 text-sm text-texto-suave">
                {doPeriodo.length} matérias
                <Icon name="seta" className="size-5 transition group-open:rotate-180" />
              </span>
            </summary>
            <ul className="grid gap-3 border-t border-borda p-5 sm:grid-cols-2 lg:grid-cols-3">
              {doPeriodo.map((m) => {
                const temTopicos = (m.topicos[0]?.count ?? 0) > 0;
                return (
                  <li key={m.id}>
                    <Link
                      href={`/app/materia/${m.id}`}
                      className="flex h-full flex-col rounded-lg border border-borda px-4 py-3 transition hover:border-azul-principal hover:bg-superficie"
                    >
                      <span className="text-xs text-texto-suave">{m.codigo}</span>
                      <span className="mt-1 flex-1 text-sm font-medium">{m.nome}</span>
                      <span className="mt-2 text-xs text-texto-suave">
                        {temTopicos ? `${m.topicos[0].count} aulas` : "Em breve"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
