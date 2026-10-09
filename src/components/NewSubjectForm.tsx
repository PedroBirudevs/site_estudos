"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "./PasswordModal";

export function NewSubjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await apiFetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Erro ao criar matéria.");
    router.push(`/materias/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <h2 className="text-lg">Nova matéria</h2>
        <p className="mt-1 text-sm text-texto-suave">Uma matéria para cada disciplina do semestre.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="input"
          placeholder="Nome (ex.: Engenharia de Software)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input"
          placeholder="Descrição opcional (ex.: 3º semestre, prof. Silva)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-erro">{error}</p>}
      <button className="btn" disabled={loading || !name.trim()}>
        {loading ? "Criando..." : "Criar matéria"}
      </button>
    </form>
  );
}
