import { NextResponse } from "next/server";
import { arquivos, sessao, type Material } from "@/lib/supabase";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, userId } = await sessao();
  const { data, error } = await db.from("materials").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });

  const material = data as Material;
  await arquivos().remove([material.storage_path]);
  await db.from("materials").delete().eq("id", id).eq("user_id", userId);
  return NextResponse.json({ ok: true });
}
