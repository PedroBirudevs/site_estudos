"use client";

import { useState } from "react";
import type { Subject, Summary } from "@/lib/supabase";
import { Markdown } from "./Markdown";
import { apiFetch } from "./PasswordModal";

const CONTROL = "\u0000";

export function SummaryPanel({
  subject,
  materialCount,
  initial,
}: {
  subject: Subject;
  materialCount: number;
  initial: Summary | null;
}) {
  const [content, setContent] = useState(initial?.content ?? "");
  const [basedOn, setBasedOn] = useState(initial?.material_count ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setContent("");
    try {
      const res = await apiFetch(`/api/subjects/${subject.id}/summary`, { method: "POST" });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao gerar o resumo.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setContent(text.split(CONTROL)[0]);
      }
      const [body, control] = text.split(CONTROL);
      const status = control ? JSON.parse(control) : { error: "A conexão caiu antes do fim. Tente de novo." };
      if (status.error) throw new Error(status.error);
      setContent(status.content ?? body);
      setBasedOn(materialCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const outdated = !loading && content && basedOn !== materialCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <button className="btn" onClick={generate} disabled={loading || materialCount === 0}>
          {loading ? "Gerando resumo..." : content ? "Gerar de novo" : "Gerar resumo"}
        </button>
        {materialCount === 0 && (
          <span className="text-sm text-texto-suave">Envie materiais na aba Materiais primeiro.</span>
        )}
        {outdated && (
          <span className="text-sm text-texto-suave">
            Os materiais mudaram desde este resumo. Gere de novo para incluí-los.
          </span>
        )}
      </div>
      {error && <p className="text-sm text-erro">{error}</p>}
      {content ? (
        <article className="card sm:p-8">
          <Markdown>{content}</Markdown>
        </article>
      ) : loading ? (
        <div className="card space-y-3 sm:p-8" aria-busy>
          <div className="skeleton h-6 w-1/3" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
          <div className="skeleton h-4 w-4/5" />
        </div>
      ) : (
        materialCount > 0 && (
          <p className="card text-sm text-texto-suave">
            A IA lê todos os materiais desta matéria e monta um resumo por tópico, só com o que está neles.
          </p>
        )
      )}
    </div>
  );
}
