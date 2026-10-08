import { NextResponse } from "next/server";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { FALLBACK, MODEL, claude, errorMessage, materialBlocks, refusalMessage, systemPrompt } from "@/lib/claude";
import { GradeSchema } from "@/lib/quiz";
import { getSubject, listMaterials } from "@/lib/supabase";

export const maxDuration = 120;

// Corrige uma resposta aberta comparando com o material (que já está em cache
// desde a geração das perguntas, então sai barato).
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
    const blocks = await materialBlocks(await listMaterials(id));
    const instructions = `Corrija minha resposta com base nos materiais acima.

Pergunta: ${question}
Resposta esperada (referência): ${expected ?? "(não informada)"}
Minha resposta: ${answer.trim()}

Considere certa se a ideia estiver correta, mesmo com outras palavras. Se faltar algo, diga o quê e explique o conceito de forma que eu entenda, sem só repetir a resposta.`;

    const response = await claude().beta.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low", format: betaZodOutputFormat(GradeSchema) },
      ...FALLBACK,
      system: systemPrompt(subject),
      messages: [{ role: "user", content: [...blocks, { type: "text", text: instructions }] }],
    });

    if (response.stop_reason === "refusal") return NextResponse.json({ error: refusalMessage() }, { status: 422 });
    if (!response.parsed_output) {
      return NextResponse.json({ error: "A IA não devolveu a correção no formato certo. Tente de novo." }, { status: 502 });
    }
    return NextResponse.json(response.parsed_output);
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
