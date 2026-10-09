import { NextResponse } from "next/server";
import { getMateriaCatalogo } from "@/lib/catalogo";
import { isSupportedMime } from "@/lib/materiais";
import { sessao } from "@/lib/supabase";

// Registra no banco um arquivo que o navegador já enviou para o Storage, ligado à matéria do catálogo.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, userId } = await sessao();
  const { path, fileName, mimeType, size } = (await req.json()) as {
    path?: string;
    fileName?: string;
    mimeType?: string;
    size?: number;
  };
  // Só aceita arquivo na pasta desta pessoa e desta matéria.
  if (!path?.startsWith(`catalogo/${userId}/${id}/`) || !fileName || !mimeType || !isSupportedMime(mimeType) || !size) {
    return NextResponse.json({ error: "Dados do arquivo inválidos." }, { status: 400 });
  }
  if (!(await getMateriaCatalogo(id))) return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });

  const { data, error } = await db
    .from("materials")
    .insert({
      materia_id: id,
      user_id: userId,
      file_name: fileName,
      storage_path: path,
      mime_type: mimeType,
      size_bytes: size,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
