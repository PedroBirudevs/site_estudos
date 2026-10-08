import { NextResponse } from "next/server";
import { FALLBACK, MODEL, claude, errorMessage, finalText, materialBlocks, refusalMessage, systemPrompt } from "@/lib/claude";
import { db, getSubject, listMaterials } from "@/lib/supabase";

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
  const subject = await getSubject(id);
  if (!subject) return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });

  const materials = await listMaterials(id);
  let blocks;
  try {
    blocks = await materialBlocks(materials);
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
        const stream = claude().beta.messages.stream({
          model: MODEL,
          max_tokens: 64000,
          output_config: { effort: "medium" },
          ...FALLBACK,
          system: systemPrompt(subject),
          messages: [{ role: "user", content: [...blocks, { type: "text", text: INSTRUCTIONS }] }],
        });
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            send(event.delta.text);
          }
        }
        const message = await stream.finalMessage();
        if (message.stop_reason === "refusal") return finish({ error: refusalMessage() });

        const content = finalText(message);
        const { error } = await db()
          .from("summaries")
          .upsert({ subject_id: id, content, material_count: materials.length, updated_at: new Date().toISOString() });
        if (error) return finish({ error: `Resumo gerado, mas não foi salvo: ${error.message}` });

        const switched = message.content.some((b) => b.type === "fallback");
        finish({ ok: true, content: switched ? content : undefined });
      } catch (err) {
        finish({ error: errorMessage(err) });
      }
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
