import { NextResponse } from "next/server";
import { arquivos, getSubject, listMaterials, sessao } from "@/lib/supabase";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await getSubject(id))) return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });

  const materials = await listMaterials(id);
  if (materials.length > 0) {
    await arquivos().remove(materials.map((m) => m.storage_path));
  }
  const { db, userId } = await sessao();
  const { error } = await db.from("subjects").delete().eq("id", id).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
