import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { BUCKET, db, type Material, type Subject } from "./supabase";

export const MODEL = "claude-opus-5-5";

// Se o modelo principal recusar um pedido, a API refaz no modelo reserva
// recomendado pela Anthropic, sem a gente manter uma lista de modelos.
export const FALLBACK: { betas: Anthropic.Beta.AnthropicBeta[]; fallbacks: "default" } = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};

// Limite da requisição da API é 32 MB; base64 aumenta o tamanho em ~4/3.
const MAX_TOTAL_BYTES = 22 * 1024 * 1024;

export const SUPPORTED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/markdown",
] as const;

export function isSupportedMime(mime: string) {
  return (SUPPORTED_MIME as readonly string[]).includes(mime);
}

let client: Anthropic | null = null;
export function claude() {
  client ??= new Anthropic();
  return client;
}

export function systemPrompt(subject: Subject) {
  return `Você é o tutor particular de um estudante universitário na matéria "${subject.name}".${
    subject.description ? ` Sobre a matéria: ${subject.description}.` : ""
  }

Regra principal: use somente o conteúdo dos materiais que o aluno enviou para esta matéria (PDFs, slides, fotos de quadro e anotações que vêm na conversa). O professor pode ainda não ter ensinado assuntos que você conhece, então não traga conceitos, técnicas, notações ou recursos de linguagem de programação que não aparecem nesses materiais. Quando algo não estiver no material, diga isso claramente em vez de completar com conhecimento de fora.

Escreva em português do Brasil, com linguagem clara e direta, como um bom professor explicaria.`;
}

export class MaterialError extends Error {}

// Monta os blocos de conteúdo com os arquivos da matéria. A ordem é sempre a
// mesma (data de envio) para o cache de prompt funcionar entre resumo e perguntas.
export async function materialBlocks(
  materials: Material[],
): Promise<Anthropic.Beta.BetaContentBlockParam[]> {
  if (materials.length === 0) {
    throw new MaterialError("Envie pelo menos um material nesta matéria antes.");
  }
  const total = materials.reduce((sum, m) => sum + m.size_bytes, 0);
  if (total > MAX_TOTAL_BYTES) {
    throw new MaterialError(
      "Os materiais desta matéria passam de 22 MB somados. Remova alguns arquivos (ou divida a matéria em unidades) e tente de novo.",
    );
  }

  const files = await Promise.all(
    materials.map(async (m) => {
      const { data, error } = await db().storage.from(BUCKET).download(m.storage_path);
      if (error || !data) throw new MaterialError(`Não consegui abrir "${m.file_name}".`);
      return { material: m, bytes: Buffer.from(await data.arrayBuffer()) };
    }),
  );

  const blocks: Anthropic.Beta.BetaContentBlockParam[] = [];
  for (const { material, bytes } of files) {
    const mime = material.mime_type;
    if (mime === "application/pdf") {
      blocks.push({
        type: "document",
        title: material.file_name,
        source: { type: "base64", media_type: "application/pdf", data: bytes.toString("base64") },
      });
    } else if (mime.startsWith("image/")) {
      blocks.push({ type: "text", text: `Imagem: ${material.file_name}` });
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mime as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
          data: bytes.toString("base64"),
        },
      });
    } else {
      blocks.push({
        type: "document",
        title: material.file_name,
        source: { type: "text", media_type: "text/plain", data: bytes.toString("utf8") },
      });
    }
  }

  // Cacheia tudo até o último material: o segundo pedido sobre a mesma matéria sai bem mais barato.
  const last = blocks[blocks.length - 1];
  if (last.type === "document" || last.type === "image") {
    last.cache_control = { type: "ephemeral" };
  }
  return blocks;
}

export function refusalMessage() {
  return "A IA recusou este pedido. Tente reformular ou revise os materiais enviados.";
}

// Texto final da resposta. Se o modelo principal recusou no meio e o reserva
// assumiu, o que veio antes do bloco "fallback" é descartado.
export function finalText(message: Anthropic.Beta.BetaMessage) {
  const lastFallback = message.content.findLastIndex((b) => b.type === "fallback");
  return message.content
    .slice(lastFallback + 1)
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
}

export function errorMessage(err: unknown) {
  if (err instanceof MaterialError) return err.message;
  if (err instanceof Anthropic.AuthenticationError) return "Chave da API do Claude inválida (ANTHROPIC_API_KEY).";
  if (err instanceof Anthropic.RateLimitError) return "Muitos pedidos seguidos para a IA. Espere um minuto e tente de novo.";
  if (err instanceof Anthropic.BadRequestError) return `A IA não aceitou o pedido: ${err.message}`;
  if (err instanceof Anthropic.APIError) return `Erro na API da IA (${err.status}). Tente de novo.`;
  if (err instanceof Error) return err.message;
  return "Erro inesperado.";
}
