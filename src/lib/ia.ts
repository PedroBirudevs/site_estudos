import "server-only";
import { ApiError, GoogleGenAI } from "@google/genai";

// Único arquivo que sabe qual IA o site usa. Para trocar de IA, mexa só aqui.
// Dá para trocar sem mexer no código definindo GEMINI_MODEL no ambiente.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

let client: GoogleGenAI | null = null;

// Os arquivos (PDF, imagem, texto) vão antes do prompt, para ele poder dizer "os materiais acima".
export async function gerar(
  prompt: string,
  arquivos: { nome: string; mime: string; dados: Buffer }[] = [],
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("A variável de ambiente GEMINI_API_KEY está faltando. Defina a chave do Gemini no .env.local (ou na Vercel).");
  }
  client ??= new GoogleGenAI({ apiKey });

  const parts = arquivos.flatMap((a) => [
    { text: `Arquivo: ${a.nome}` },
    a.mime.startsWith("text/")
      ? { text: a.dados.toString("utf8") }
      : { inlineData: { mimeType: a.mime, data: a.dados.toString("base64") } },
  ]);

  let texto: string | undefined;
  try {
    const res = await client.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [...parts, { text: prompt }] }],
    });
    texto = res.text;
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;
    if (err.status === 429) throw new Error("Muitos pedidos seguidos para a IA. Espere um minuto e tente de novo.");
    if (err.status === 401 || err.status === 403 || /api key/i.test(err.message)) {
      throw new Error("Chave da IA inválida (GEMINI_API_KEY).");
    }
    throw new Error(`Erro na API da IA (${err.status}): ${err.message}`);
  }

  // Sem texto = pedido bloqueado pelos filtros de segurança ou resposta vazia.
  if (!texto) throw new Error("A IA recusou este pedido. Tente reformular ou revise os materiais enviados.");
  return texto;
}
