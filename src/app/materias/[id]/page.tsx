import Link from "next/link";
import { notFound } from "next/navigation";
import { SubjectView } from "@/components/SubjectView";
import { db, getSubject, listMaterials, type Summary } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subject = await getSubject(id);
  if (!subject) notFound();

  const [materials, summaryRes] = await Promise.all([
    listMaterials(id),
    db().from("summaries").select("*").eq("subject_id", id).maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Matérias
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{subject.name}</h1>
        {subject.description && <p className="mt-1 text-sm text-muted">{subject.description}</p>}
      </div>
      <SubjectView subject={subject} materials={materials} summary={(summaryRes.data as Summary | null) ?? null} />
    </div>
  );
}
