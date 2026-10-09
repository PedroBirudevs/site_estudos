import { NextResponse } from "next/server";
import { gerar } from "@/lib/ia";
import { carregarArquivos, errorMessage, systemPrompt } from "@/lib/materiais";
import { getSubject, listMaterials, sessao } from "@/lib/supabase";

export const maxDuration = 300;

const INSTRUCTIONS = `Faça um resumo de estudo desta matéria a partir dos materiais acima, em Markdown.

- Organize por tópicos na ordem em que aparecem no material, com títulos (##).
- Em cada tópico: a ideia central em poucas frases, as definições importantes em negrito e os exemplos que o próprio material usa.
- Quando o material tiver código, explique o que ele faz e por quê, sem acrescentar recursos que não aparecem ali.
- Termine com "## Para revisar antes da prova": os pontos que o material mais enfatiza.
- Indique entre parênteses de qual arquivo veio cada tópico, ex.: (aula3.pdf).`;

// Separa o texto do resumo do aviso final de status no mesmo stream.
const CONTROL = "\u0000";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Pega a sessão antes do stream: depois que a resposta começa, os cookies não estão mais disponíveis.
  const { db, userId } = await sessao();
  const subject = await getSubject(id);
  if (!subject) return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });

  const materials = await listMaterials(id);
  let arquivos;
  try {
    arquivos = await carregarArquivos(materials);
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));
      const finish = (status: object) => {
        send(CONTROL + JSON.stringify(status));
        controller.close();
      };
      try {
        // A resposta chega inteira de uma vez; o formato do stream continua o mesmo para a tela.
        const content = await gerar(`${systemPrompt(subject)}\n\n${INSTRUCTIONS}`, arquivos);
        send(content);

        const { error } = await db.from("summaries").upsert(
          {
            subject_id: id,
            user_id: userId,
            content,
            material_count: materials.length,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "subject_id" },
        );
        if (error) return finish({ error: `Resumo gerado, mas não foi salvo: ${error.message}` });

        finish({ ok: true });
      } catch (err) {
        finish({ error: errorMessage(err) });
      }
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
