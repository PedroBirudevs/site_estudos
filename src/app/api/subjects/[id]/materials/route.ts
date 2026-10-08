import { NextResponse } from "next/server";
import { isSupportedMime } from "@/lib/claude";
import { db } from "@/lib/supabase";

// Registra no banco um arquivo que o navegador já enviou para o Storage.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { path, fileName, mimeType, size } = (await req.json()) as {
    path?: string;
    fileName?: string;
    mimeType?: string;
    size?: number;
  };
  if (!path?.startsWith(`${id}/`) || !fileName || !mimeType || !isSupportedMime(mimeType) || !size) {
    return NextResponse.json({ error: "Dados do arquivo inválidos." }, { status: 400 });
  }
  const { data, error } = await db()
    .from("materials")
    .insert({ subject_id: id, file_name: fileName, storage_path: path, mime_type: mimeType, size_bytes: size })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
