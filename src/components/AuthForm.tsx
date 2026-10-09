import Link from "next/link";
import { Logo } from "./Sidebar";

type Campo = { id: string; label: string; type: string; autoComplete: string };

// Só o visual do formulário: ainda não existe autenticação.
export function AuthForm({
  titulo,
  campos,
  botao,
  rodape,
}: {
  titulo: string;
  campos: Campo[];
  botao: string;
  rodape: { texto: string; link: string; href: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-superficie px-4 py-12">
      <Logo href="/" />
      <form className="card mt-8 w-full max-w-sm space-y-5 sm:p-8">
        <h1 className="text-2xl">{titulo}</h1>
        {campos.map((c) => (
          <label key={c.id} className="block text-sm">
            <span className="mb-1.5 block font-medium">{c.label}</span>
            <input id={c.id} name={c.id} type={c.type} autoComplete={c.autoComplete} className="input" />
          </label>
        ))}
        <button type="button" className="btn w-full">
          {botao}
        </button>
      </form>
      <p className="mt-6 text-sm text-texto-suave">
        {rodape.texto}{" "}
        <Link href={rodape.href} className="font-medium text-azul-principal hover:text-azul-escuro">
          {rodape.link}
        </Link>
      </p>
    </main>
  );
}
