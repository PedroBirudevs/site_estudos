"use client";

import { useState } from "react";
import type { Grade, Question } from "@/lib/quiz";
import type { Subject } from "@/lib/supabase";

type Result = "certa" | "parcial" | "errada";

const VERDICT_STYLE: Record<Result, string> = {
  certa: "text-good",
  parcial: "text-accent",
  errada: "text-bad",
};
const VERDICT_LABEL: Record<Result, string> = { certa: "Certa", parcial: "Parcialmente certa", errada: "Errada" };

export function QuizPanel({ subject, materialCount }: { subject: Subject; materialCount: number }) {
  const [count, setCount] = useState(5);
  const [focus, setFocus] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<Record<number, Result>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/subjects/${subject.id}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, focus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar perguntas.");
      setQuestions(data.questions);
      setResults({});
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const answered = Object.values(results);
  const score = answered.reduce((s, r) => s + (r === "certa" ? 1 : r === "parcial" ? 0.5 : 0), 0);

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Quantidade</span>
          <select className="input w-24" value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[3, 5, 8, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-48 flex-1 text-sm">
          <span className="mb-1 block text-muted">Focar em (opcional)</span>
          <input
            className="input"
            placeholder="ex.: requisitos não funcionais"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          />
        </label>
        <button className="btn" onClick={generate} disabled={loading || materialCount === 0}>
          {loading ? "Criando perguntas..." : questions.length ? "Novas perguntas" : "Criar perguntas"}
        </button>
      </div>

      {materialCount === 0 && <p className="text-sm text-muted">Envie materiais na aba Materiais primeiro.</p>}
      {error && <p className="text-sm text-bad">{error}</p>}

      {questions.length > 0 && (
        <p className="text-sm text-muted">
          Respondidas: {answered.length} de {questions.length}
          {answered.length > 0 && ` · Acertos: ${score.toLocaleString("pt-BR")}`}
        </p>
      )}

      <ol className="space-y-4">
        {questions.map((q, i) => (
          <li key={`${i}-${q.question}`} className="card space-y-3">
            <p className="text-xs text-muted">
              {i + 1}. {q.kind === "aberta" ? "Aberta" : "Múltipla escolha"} · {q.source}
            </p>
            <p className="font-medium whitespace-pre-wrap">{q.question}</p>
            {q.kind === "multipla_escolha" && q.options.length > 0 ? (
              <MultipleChoice q={q} onResult={(r) => setResults((s) => ({ ...s, [i]: r }))} />
            ) : (
              <OpenQuestion subjectId={subject.id} q={q} onResult={(r) => setResults((s) => ({ ...s, [i]: r }))} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function MultipleChoice({ q, onResult }: { q: Question; onResult: (r: Result) => void }) {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {q.options.map((opt, j) => {
        const done = picked !== null;
        const style = !done
          ? "border-line hover:border-accent"
          : j === q.correct_index
            ? "border-good text-good"
            : j === picked
              ? "border-bad text-bad"
              : "border-line opacity-60";
        return (
          <button
            key={j}
            disabled={done}
            onClick={() => {
              setPicked(j);
              onResult(j === q.correct_index ? "certa" : "errada");
            }}
            className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition ${style}`}
          >
            <span className="mr-2 font-semibold">{String.fromCharCode(65 + j)})</span>
            {opt}
          </button>
        );
      })}
      {picked !== null && <p className="pt-1 text-sm text-muted">{q.expected_answer}</p>}
    </div>
  );
}

function OpenQuestion({
  subjectId,
  q,
  onResult,
}: {
  subjectId: string;
  q: Question;
  onResult: (r: Result) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/subjects/${subjectId}/quiz/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.question, expected: q.expected_answer, answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao corrigir.");
      setGrade(data);
      onResult(data.verdict);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        className="input min-h-24"
        placeholder="Explique com suas palavras..."
        value={answer}
        disabled={!!grade}
        onChange={(e) => setAnswer(e.target.value)}
      />
      {!grade && (
        <button className="btn-ghost" onClick={submit} disabled={loading || !answer.trim()}>
          {loading ? "Corrigindo..." : "Corrigir"}
        </button>
      )}
      {error && <p className="text-sm text-bad">{error}</p>}
      {grade && (
        <div className="space-y-1 text-sm">
          <p className={`font-semibold ${VERDICT_STYLE[grade.verdict]}`}>{VERDICT_LABEL[grade.verdict]}</p>
          <p className="whitespace-pre-wrap">{grade.feedback}</p>
          <p className="text-muted">Resposta de referência: {q.expected_answer}</p>
        </div>
      )}
    </div>
  );
}
