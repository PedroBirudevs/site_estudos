import { z } from "zod/v4";

export const QuestionSchema = z.object({
  kind: z.enum(["multipla_escolha", "aberta"]),
  question: z.string().describe("Enunciado da pergunta"),
  options: z.array(z.string()).describe("4 alternativas para múltipla escolha; lista vazia para pergunta aberta"),
  correct_index: z.number().int().describe("Índice (0 a 3) da alternativa certa; -1 para pergunta aberta"),
  expected_answer: z.string().describe("Resposta esperada, explicada em 1 a 3 frases"),
  source: z.string().describe("Nome do arquivo do material de onde saiu a pergunta"),
});

export const QuizSchema = z.object({ questions: z.array(QuestionSchema) });

export const GradeSchema = z.object({
  verdict: z.enum(["certa", "parcial", "errada"]),
  feedback: z.string().describe("Explicação curta para o aluno: o que acertou, o que faltou e o porquê"),
});

export type Question = z.infer<typeof QuestionSchema>;
export type Grade = z.infer<typeof GradeSchema>;
