import Link from "next/link";
import { Icon } from "@/components/Icon";
import { NewSubjectForm } from "@/components/NewSubjectForm";
import { sessao, type Subject } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const FUSO = "America/Sao_Paulo";

function saudacao(agora: Date) {
  const hora = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: FUSO }).format(agora));
  return hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
}

export default async function Home() {
  const { db, userId, user } = await sessao();
  const [{ data, error }, summaries] = await Promise.all([
    db.from("subjects").select("*, materials(count)").eq("user_id", userId).order("created_at", { ascending: true }),
    db.from("summaries").select("*", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  // Primeiro nome, vindo do cadastro.
  const nome = String(user.user_metadata?.nome ?? "").split(" ")[0];

  if (error) {
    return (
      <div className="card text-sm">
        <p className="font-medium text-erro">Não consegui ler o banco de dados.</p>
        <p className="mt-2 text-texto-suave">{error.message}</p>
        <p className="mt-2 text-texto-suave">Confira as variáveis do Supabase e se você rodou supabase/schema.sql.</p>
      </div>
    );
  }

  const subjects = (data ?? []) as (Subject & { materials: { count: number }[] })[];
  const totalMaterials = subjects.reduce((n, s) => n + (s.materials[0]?.count ?? 0), 0);
  const agora = new Date();
  const hoje = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: FUSO }).format(agora);

  const stats = [
    { label: "Matérias cadastradas", value: subjects.length },
    { label: "Materiais enviados", value: totalMaterials },
    { label: "Resumos gerados", value: summaries.count ?? 0 },
  ];

  return (
    <div className="space-y-12">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-texto-suave first-letter:uppercase">{hoje}</p>
          <h1 className="mt-1 text-3xl sm:text-4xl">
            {saudacao(agora)}
            {nome && `, ${nome}`}
          </h1>
        </div>
        {subjects.length > 0 && (
          <>
            <button popoverTarget="enviar-material" className="btn px-5 py-3 text-base">
              <Icon name="enviar" />
              Enviar material
            </button>
            <div
              id="enviar-material"
              popover="auto"
              className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-borda bg-fundo text-texto shadow-card backdrop:bg-texto/30"
            >
              <p className="border-b border-borda px-5 py-4 font-semibold">Para qual matéria?</p>
              <ul className="max-h-80 overflow-y-auto py-2">
                {subjects.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/app/materias/${s.id}?aba=materiais`}
                      className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-superficie"
                    >
                      <Icon name="livro" className="size-5 text-azul-principal" />
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>

      {subjects.length > 0 ? (
        <>
          <section className="grid gap-5 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="card">
                <p className="text-sm text-texto-suave">{s.label}</p>
                <p className="mt-2 text-3xl font-semibold">{s.value.toLocaleString("pt-BR")}</p>
              </div>
            ))}
          </section>

          <section>
            <h2 className="text-xl">Suas matérias</h2>
            <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((s) => {
                const count = s.materials[0]?.count ?? 0;
                return (
                  <li key={s.id}>
                    <Link href={`/app/materias/${s.id}`} className="card block h-full transition hover:border-azul-principal">
                      <span className="grid size-10 place-items-center rounded-lg bg-azul-claro text-azul-principal">
                        <Icon name="livro" />
                      </span>
                      <p className="mt-4 font-semibold">{s.name}</p>
                      {s.description && <p className="mt-1 line-clamp-2 text-sm text-texto-suave">{s.description}</p>}
                      <p className="mt-4 text-xs text-texto-suave">
                        {count} {count === 1 ? "material" : "materiais"}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      ) : (
        <section className="card flex flex-col items-center px-6 py-14 text-center">
          <svg viewBox="0 0 120 96" className="w-36" aria-hidden>
            <ellipse cx="60" cy="86" rx="44" ry="6" fill="var(--superficie)" />
            <rect x="22" y="30" width="76" height="52" rx="8" fill="var(--azul-claro)" />
            <rect x="34" y="44" width="36" height="5" rx="2.5" fill="var(--fundo)" />
            <rect x="34" y="56" width="52" height="5" rx="2.5" fill="var(--fundo)" />
            <rect x="34" y="68" width="24" height="5" rx="2.5" fill="var(--fundo)" />
            <path d="M60 6 96 20 60 34 24 20Z" fill="var(--azul-principal)" />
            <path d="M92 22v14" stroke="var(--azul-principal)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <h2 className="mt-6 text-xl">Nenhuma matéria por aqui ainda</h2>
          <p className="mt-2 max-w-md text-sm text-texto-suave">
            Crie uma matéria, envie o material da aula e a IA monta resumos e perguntas só com o que o professor já deu.
          </p>
          <a href="#nova-materia" className="btn mt-6">
            <Icon name="mais" />
            Criar primeira matéria
          </a>
        </section>
      )}

      <section id="nova-materia" className="scroll-mt-24">
        <NewSubjectForm />
      </section>
    </div>
  );
}
