"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

const EVENT = "birustudy:pedir-senha";

// fetch para ações que gravam dados ou chamam a IA. Se o servidor pedir a senha (401),
// abre o modal e repete o pedido depois da liberação. O cookie de /api/login guarda a liberação.
export async function apiFetch(input: string, init?: RequestInit) {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;
  const ok = await new Promise<boolean>((resolve) => window.dispatchEvent(new CustomEvent(EVENT, { detail: resolve })));
  return ok ? fetch(input, init) : res;
}

export function PasswordModal() {
  const dialog = useRef<HTMLDialogElement>(null);
  const waiting = useRef<((ok: boolean) => void)[]>([]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function open(e: Event) {
      waiting.current.push((e as CustomEvent<(ok: boolean) => void>).detail);
      if (!dialog.current?.open) dialog.current?.showModal();
    }
    window.addEventListener(EVENT, open);
    return () => window.removeEventListener(EVENT, open);
  }, []);

  function finish(ok: boolean) {
    waiting.current.splice(0).forEach((resolve) => resolve(ok));
    if (dialog.current?.open) dialog.current.close();
    setPassword("");
    setError("");
  }

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
    if (res.ok) finish(true);
    else setError((await res.json().catch(() => ({}))).error ?? "Senha incorreta.");
  }

  return (
    <dialog
      ref={dialog}
      onCancel={() => finish(false)}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-borda bg-fundo p-0 text-texto shadow-card backdrop:bg-texto/40"
    >
      <form onSubmit={submit} className="space-y-5 p-6">
        <span className="grid size-11 place-items-center rounded-full bg-azul-claro text-azul-principal">
          <Icon name="cadeado" />
        </span>
        <div>
          <h2 className="text-lg">Digite a senha para continuar</h2>
          <p className="mt-1 text-sm text-texto-suave">
            Enviar material e usar a IA pedem a senha do site. Você só precisa digitar uma vez.
          </p>
        </div>
        <input
          type="password"
          className="input"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="text-sm text-erro">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secundario" onClick={() => finish(false)}>
            Cancelar
          </button>
          <button className="btn" disabled={loading || !password}>
            {loading ? "Verificando..." : "Liberar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
