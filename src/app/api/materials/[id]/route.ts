import { NextResponse } from "next/server";
import { BUCKET, db, type Material } from "@/lib/supabase";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await db().from("materials").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });

  const material = data as Material;
  await db().storage.from(BUCKET).remove([material.storage_path]);
  await db().from("materials").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
