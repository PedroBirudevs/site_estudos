import { NextResponse } from "next/server";
import { isSupportedMime } from "@/lib/materiais";
import { arquivos, getSubject } from "@/lib/supabase";

// O arquivo vai direto do navegador para o Supabase por uma URL assinada.
// Assim não esbarra no limite de 4,5 MB do corpo das requisições na Vercel.
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
  if (!(await getSubject(id))) return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });

  const safeName = fileName.normalize("NFD").replace(/[^\w.-]+/g, "_");
  const path = `${id}/${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await arquivos().createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path: data.path, signedUrl: data.signedUrl });
}
