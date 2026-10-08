"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Erro ao criar matéria.");
    router.push(`/materias/${data.id}`);
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="font-semibold">Nova matéria</h2>
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
      {error && <p className="text-sm text-bad">{error}</p>}
      <button className="btn" disabled={loading || !name.trim()}>
        {loading ? "Criando..." : "Criar matéria"}
      </button>
    </form>
  );
}
