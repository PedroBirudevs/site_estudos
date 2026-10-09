import Link from "next/link";
import { sessao } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Linha = {
  id: string;
  file_name: string;
  mime_type: string;
  created_at: string;
  subject_id: string | null;
  materia_id: string | null;
  subjects: { name: string } | null;
  materias_catalogo: { nome: string } | null;
};

const DATA = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" });

function tipo(mime: string) {
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return "IMG";
  return "TXT";
}

// Todos os materiais da pessoa, de qualquer matéria (do curso ou própria).
export default async function Materiais() {
  const { db, userId } = await sessao();
  const { data } = await db
    .from("materials")
    .select("id, file_name, mime_type, created_at, subject_id, materia_id, subjects(name), materias_catalogo(nome)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const materiais = (data ?? []) as unknown as Linha[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">Materiais</h1>
        <p className="mt-2 text-texto-suave">Tudo o que você enviou. Para enviar ou remover, abra a matéria.</p>
      </div>
      {materiais.length > 0 ? (
        <ul className="card divide-y divide-borda p-0">
          {materiais.map((m) => {
            const href = m.materia_id ? `/app/materia/${m.materia_id}#materiais` : `/app/materias/${m.subject_id}?aba=materiais`;
            const materia = m.materias_catalogo?.nome ?? m.subjects?.name ?? "";
            return (
              <li key={m.id}>
                <Link href={href} className="flex items-center gap-4 px-5 py-4 hover:bg-superficie">
                  <span className="w-11 shrink-0 rounded-md bg-azul-claro py-1.5 text-center text-[10px] font-bold text-azul-principal">
                    {tipo(m.mime_type)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{m.file_name}</span>
                    <span className="block truncate text-xs text-texto-suave">{materia}</span>
                  </span>
                  <span className="hidden shrink-0 text-xs text-texto-suave sm:inline">{DATA.format(new Date(m.created_at))}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="card text-sm text-texto-suave">
          Você ainda não enviou materiais. Abra uma matéria em <Link href="/app/curso" className="text-azul-principal">Meu curso</Link> para enviar.
        </p>
      )}
    </div>
  );
}
