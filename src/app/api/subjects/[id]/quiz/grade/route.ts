import { NextResponse } from "next/server";
import { gerar } from "@/lib/ia";
import { carregarArquivos, errorMessage, systemPrompt } from "@/lib/materiais";
import { GradeSchema, formatoJson, lerJson } from "@/lib/quiz";
import { getSubject, listMaterials } from "@/lib/supabase";

export const maxDuration = 120;

// Corrige uma resposta aberta comparando com o material.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { question, expected, answer } = (await req.json()) as {
    question?: string;
    expected?: string;
    answer?: string;
  };
  if (!question || !answer?.trim()) {
    return NextResponse.json({ error: "Escreva uma resposta primeiro." }, { status: 400 });
  }

  const subject = await getSubject(id);
  if (!subject) return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });

  try {
    const arquivos = await carregarArquivos(await listMaterials(id));
    const instructions = `Corrija minha resposta com base nos materiais acima.

Pergunta: ${question}
Resposta esperada (referência): ${expected ?? "(não informada)"}
Minha resposta: ${answer.trim()}

Considere certa se a ideia estiver correta, mesmo com outras palavras. Se faltar algo, diga o quê e explique o conceito de forma que eu entenda, sem só repetir a resposta.

${formatoJson(GradeSchema)}`;

    const grade = lerJson(await gerar(`${systemPrompt(subject)}\n\n${instructions}`, arquivos), GradeSchema);
    if (!grade) {
      return NextResponse.json({ error: "A IA não devolveu a correção no formato certo. Tente de novo." }, { status: 502 });
    }
    return NextResponse.json(grade);
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
