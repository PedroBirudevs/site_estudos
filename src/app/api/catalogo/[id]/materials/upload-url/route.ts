import { NextResponse } from "next/server";
import { getMateriaCatalogo } from "@/lib/catalogo";
import { isSupportedMime } from "@/lib/materiais";
import { arquivos, sessao } from "@/lib/supabase";

// Igual ao upload da matéria própria, mas para uma matéria do catálogo.
// A matéria é compartilhada, então o caminho no Storage inclui o id de quem enviou.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { fileName, mimeType } = (await req.json()) as { fileName?: string; mimeType?: string };
  if (!fileName || !mimeType) return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  if (!isSupportedMime(mimeType)) {
    return NextResponse.json(
      { error: `"${fileName}": formato não suportado. Use PDF, imagem (PNG/JPG/WEBP/GIF) ou texto. Slides do PowerPoint: exporte como PDF.` },
      { status: 400 },
    );
  }
  if (!(await getMateriaCatalogo(id))) return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });

  const { userId } = await sessao();
  const safeName = fileName.normalize("NFD").replace(/[^\w.-]+/g, "_");
  const path = `catalogo/${userId}/${id}/${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await arquivos().createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path: data.path, signedUrl: data.signedUrl });
}
