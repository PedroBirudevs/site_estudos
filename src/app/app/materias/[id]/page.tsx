import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { SubjectView } from "@/components/SubjectView";
import { db, getSubject, listMaterials, type Summary } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function SubjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const { id } = await params;
  const { aba } = await searchParams;
  const subject = await getSubject(id);
  if (!subject) notFound();

  const [materials, summaryRes] = await Promise.all([
    listMaterials(id),
    db().from("summaries").select("*").eq("subject_id", id).maybeSingle(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/app" className="inline-flex items-center gap-1 text-sm text-texto-suave hover:text-azul-principal">
          <Icon name="voltar" className="size-4" />
          Início
        </Link>
        <h1 className="mt-3 text-3xl">{subject.name}</h1>
        {subject.description && <p className="mt-2 text-texto-suave">{subject.description}</p>}
      </div>
      <SubjectView
        subject={subject}
        materials={materials}
        summary={(summaryRes.data as Summary | null) ?? null}
        initialTab={aba}
      />
    </div>
  );
}
