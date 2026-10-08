"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) window.location.href = "/";
    else setError((await res.json()).error ?? "Erro ao entrar.");
  }

  return (
    <form onSubmit={submit} className="card mx-auto mt-16 max-w-sm space-y-4">
      <h1 className="text-lg font-semibold">Entrar</h1>
      <input
        type="password"
        className="input"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
      />
      {error && <p className="text-sm text-bad">{error}</p>}
      <button className="btn w-full" disabled={loading || !password}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
