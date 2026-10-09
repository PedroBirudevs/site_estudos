"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { cadastrar, entrar } from "@/lib/auth";
import { type CampoCadastro, REQUISITOS_SENHA, validarCadastro } from "@/lib/validacao";
import { Icon } from "./Icon";
import { Logo } from "./Sidebar";

function Moldura({
  titulo,
  aviso,
  rodape,
  children,
}: {
  titulo: string;
  aviso?: string;
  rodape: { texto: string; link: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-superficie px-4 py-12">
      <Logo href="/" />
      {aviso && (
        <p role="status" className="mt-8 w-full max-w-sm rounded-lg border border-sucesso bg-fundo px-4 py-3 text-sm font-medium text-sucesso">
          {aviso}
        </p>
      )}
      <div className={`card w-full max-w-sm sm:p-8 ${aviso ? "mt-4" : "mt-8"}`}>
        <h1 className="text-2xl">{titulo}</h1>
        {children}
      </div>
      <p className="mt-6 text-sm text-texto-suave">
        {rodape.texto}{" "}
        <Link href={rodape.href} className="font-medium text-azul-principal hover:text-azul-escuro">
          {rodape.link}
        </Link>
      </p>
    </main>
  );
}

function Campo({
  id,
  label,
  erro,
  children,
}: {
  id: string;
  label: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {erro && (
        <p id={`${id}-erro`} className="mt-1.5 text-sm text-erro">
          {erro}
        </p>
      )}
    </div>
  );
}

const CAMPOS_CADASTRO: { id: CampoCadastro; label: string; type: string; autoComplete: string }[] = [
  { id: "nome", label: "Nome", type: "text", autoComplete: "name" },
  { id: "email", label: "E-mail", type: "email", autoComplete: "email" },
  { id: "senha", label: "Senha", type: "password", autoComplete: "new-password" },
  { id: "confirmar", label: "Confirmar senha", type: "password", autoComplete: "new-password" },
];

export function CadastroForm() {
  const [estado, acao, enviando] = useActionState(cadastrar, { erros: {} });
  const [valores, setValores] = useState<Record<CampoCadastro, string>>({ nome: "", email: "", senha: "", confirmar: "" });
  // Erro aparece quando a pessoa sai do campo (ou tenta enviar).
  const [tocados, setTocados] = useState<Set<CampoCadastro>>(new Set());
  // Erros do servidor somem quando a pessoa edita o campo.
  const [editados, setEditados] = useState<Set<CampoCadastro>>(new Set());
  const errosLocais = validarCadastro(valores);

  function erro(campo: CampoCadastro) {
    if (tocados.has(campo) && errosLocais[campo]) return errosLocais[campo];
    return editados.has(campo) ? undefined : estado.erros[campo];
  }

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTocados(new Set(CAMPOS_CADASTRO.map((c) => c.id)));
    if (Object.keys(errosLocais).length > 0) return;
    setEditados(new Set());
    const dados = new FormData(e.currentTarget);
    startTransition(() => acao(dados));
  }

  return (
    <Moldura titulo="Criar conta" rodape={{ texto: "Já tem conta?", link: "Entrar", href: "/entrar" }}>
      <form onSubmit={enviar} noValidate className="mt-6 space-y-5">
        {CAMPOS_CADASTRO.map((c) => (
          <Campo key={c.id} id={c.id} label={c.label} erro={erro(c.id)}>
            <input
              id={c.id}
              name={c.id}
              type={c.type}
              autoComplete={c.autoComplete}
              value={valores[c.id]}
              onChange={(e) => {
                setValores((v) => ({ ...v, [c.id]: e.target.value }));
                setEditados((s) => new Set(s).add(c.id));
              }}
              onBlur={() => setTocados((s) => new Set(s).add(c.id))}
              aria-invalid={!!erro(c.id)}
              aria-describedby={erro(c.id) ? `${c.id}-erro` : undefined}
              className={`input ${erro(c.id) ? "border-erro" : ""}`}
            />
            {c.id === "senha" && (
              <ul className="mt-3 space-y-1.5 text-sm" aria-label="Requisitos da senha">
                {REQUISITOS_SENHA.map((r) => {
                  const ok = r.ok(valores.senha);
                  return (
                    <li key={r.texto} className={`flex items-center gap-2 ${ok ? "text-sucesso" : "text-texto-suave"}`}>
                      <Icon name={ok ? "check" : "ponto"} className="size-4 shrink-0" />
                      {r.texto}
                    </li>
                  );
                })}
              </ul>
            )}
          </Campo>
        ))}
        {estado.geral && <p className="text-sm text-erro">{estado.geral}</p>}
        <button className="btn w-full" disabled={enviando}>
          {enviando ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
    </Moldura>
  );
}

export function LoginForm({ next, contaCriada }: { next?: string; contaCriada: boolean }) {
  const [estado, acao, enviando] = useActionState(entrar, {});

  return (
    <Moldura
      titulo="Entrar"
      aviso={contaCriada && !estado.erro ? "Conta criada. Faça login para continuar." : undefined}
      rodape={{ texto: "Ainda não tem conta?", link: "Criar conta", href: "/criar-conta" }}
    >
      <form action={acao} noValidate className="mt-6 space-y-5">
        <input type="hidden" name="next" value={next ?? ""} />
        <Campo id="email" label="E-mail">
          <input id="email" name="email" type="email" autoComplete="email" defaultValue={estado.email} className="input" />
        </Campo>
        <Campo id="senha" label="Senha">
          <input id="senha" name="senha" type="password" autoComplete="current-password" className="input" />
        </Campo>
        {estado.erro && (
          <p role="alert" className="text-sm text-erro">
            {estado.erro}
          </p>
        )}
        <button className="btn w-full" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </Moldura>
  );
}
