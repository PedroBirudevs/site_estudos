import "server-only";
import { arquivos, type Material, type Subject } from "./supabase";

// Mantém o pedido bem abaixo do limite de dados por pedido da IA (base64 aumenta o tamanho em ~4/3).
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

export function systemPrompt(subject: Subject) {
  return `Você é o tutor particular de um estudante universitário na matéria "${subject.name}".${
    subject.description ? ` Sobre a matéria: ${subject.description}.` : ""
  }

Regra principal: use somente o conteúdo dos materiais que o aluno enviou para esta matéria (PDFs, slides, fotos de quadro e anotações que vêm na conversa). O professor pode ainda não ter ensinado assuntos que você conhece, então não traga conceitos, técnicas, notações ou recursos de linguagem de programação que não aparecem nesses materiais. Quando algo não estiver no material, diga isso claramente em vez de completar com conhecimento de fora.

Escreva em português do Brasil, com linguagem clara e direta, como um bom professor explicaria.`;
}

// Baixa os arquivos da matéria do Storage, na ordem de envio, para mandar à IA.
export async function carregarArquivos(materials: Material[]) {
  if (materials.length === 0) {
    throw new Error("Envie pelo menos um material nesta matéria antes.");
  }
  const total = materials.reduce((sum, m) => sum + m.size_bytes, 0);
  if (total > MAX_TOTAL_BYTES) {
    throw new Error(
      "Os materiais desta matéria passam de 22 MB somados. Remova alguns arquivos (ou divida a matéria em unidades) e tente de novo.",
    );
  }

  return Promise.all(
    materials.map(async (m) => {
      const { data, error } = await arquivos().download(m.storage_path);
      if (error || !data) throw new Error(`Não consegui abrir "${m.file_name}".`);
      return { nome: m.file_name, mime: m.mime_type, dados: Buffer.from(await data.arrayBuffer()) };
    }),
  );
}

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Erro inesperado.";
}
