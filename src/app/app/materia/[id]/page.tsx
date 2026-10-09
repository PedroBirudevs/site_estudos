import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { MateriaView, type ResumoDaMateria } from "@/components/MateriaView";
import { getMateriaCatalogo, type Topico } from "@/lib/catalogo";
import { sessao, type Material } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function MateriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const materia = await getMateriaCatalogo(id);
  if (!materia) notFound();

  const { db, userId } = await sessao();
  const [topicos, materiais, resumos] = await Promise.all([
    db.from("topicos").select("*").eq("materia_id", id).order("ordem"),
    db.from("materials").select("*").eq("materia_id", id).eq("user_id", userId).order("created_at"),
    db
      .from("summaries")
      .select("id, content, updated_at, materials(file_name), topicos(titulo)")
      .eq("materia_id", id)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/app/curso" className="inline-flex items-center gap-1 text-sm text-texto-suave hover:text-azul-principal">
          <Icon name="voltar" className="size-4" />
          {materia.cursos.nome} · {materia.periodo}º período
        </Link>
        <h1 className="mt-3 text-3xl">{materia.nome}</h1>
        <p className="mt-1 text-sm text-texto-suave">{materia.codigo}</p>
      </div>
      <MateriaView
        materiaId={id}
        topicos={(topicos.data ?? []) as Topico[]}
        materiais={(materiais.data ?? []) as Material[]}
        resumos={(resumos.data ?? []) as unknown as ResumoDaMateria[]}
      />
    </div>
  );
}
