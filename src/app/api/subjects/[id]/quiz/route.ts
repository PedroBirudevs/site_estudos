import { NextResponse } from "next/server";
import { gerar } from "@/lib/ia";
import { carregarArquivos, errorMessage, systemPrompt } from "@/lib/materiais";
import { QuizSchema, formatoJson, lerJson } from "@/lib/quiz";
import { getSubject, listMaterials } from "@/lib/supabase";

export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { count = 5, focus = "" } = (await req.json().catch(() => ({}))) as { count?: number; focus?: string };
  const total = Math.min(Math.max(Math.round(count), 1), 15);

  const subject = await getSubject(id);
  if (!subject) return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });

  try {
    const arquivos = await carregarArquivos(await listMaterials(id));
    const instructions = `Crie ${total} perguntas para eu checar se entendi o conteúdo dos materiais acima.${
      focus.trim() ? ` Concentre-se em: ${focus.trim()}.` : ""
    }

Misture os tipos: cerca de metade múltipla escolha (4 alternativas plausíveis, só uma certa) e metade abertas.
Prefira perguntas que testam entendimento, não decoreba: explicar com as próprias palavras, aplicar um conceito a um caso, achar o erro, prever o resultado de um código que está no material.
Tudo tem que ser respondível só com o que está nos materiais.

${formatoJson(QuizSchema)}`;

    const quiz = lerJson(await gerar(`${systemPrompt(subject)}\n\n${instructions}`, arquivos), QuizSchema);
    if (!quiz) {
      return NextResponse.json({ error: "A IA não devolveu as perguntas no formato certo. Tente de novo." }, { status: 502 });
    }
    return NextResponse.json(quiz);
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
