import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Sidebar";

const PASSOS = [
  { icon: "capelo", titulo: "Escolha seu curso", texto: "Comece pela sua graduação." },
  { icon: "enviar", titulo: "Envie o material da sua faculdade", texto: "PDFs, slides e fotos do quadro." },
  { icon: "livro", titulo: "Estude com resumo, questões e revisão", texto: "Tudo feito a partir do seu material." },
] as const;

const CURSOS = [
  { icon: "terminal", nome: "Ciência da Computação", ativo: true },
  { icon: "balanca", nome: "Direito", ativo: false },
  { icon: "coracao", nome: "Enfermagem", ativo: false },
] as const;

const RECURSOS = [
  { icon: "livro", titulo: "Resumo didático", texto: "Cada tópico explicado de um jeito simples." },
  { icon: "questoes", titulo: "Banco de questões", texto: "Múltipla escolha e abertas, com correção." },
  { icon: "revisao", titulo: "Revisão espaçada", texto: "Reveja na hora certa para não esquecer." },
  { icon: "terminal", titulo: "Terminal de prática", texto: "Rode código direto no navegador." },
] as const;

function Ilustracao() {
  return (
    <svg viewBox="0 0 400 360" className="w-full max-w-md" aria-hidden>
      <circle cx="300" cy="80" r="64" fill="var(--azul-claro)" />
      <circle cx="70" cy="290" r="40" fill="var(--superficie)" />
      <rect x="60" y="70" width="240" height="230" rx="20" fill="var(--fundo)" stroke="var(--borda)" strokeWidth="2" />
      <rect x="88" y="104" width="96" height="12" rx="6" fill="var(--azul-principal)" />
      <rect x="88" y="134" width="184" height="10" rx="5" fill="var(--borda)" />
      <rect x="88" y="156" width="150" height="10" rx="5" fill="var(--borda)" />
      <rect x="88" y="178" width="168" height="10" rx="5" fill="var(--borda)" />
      <rect x="88" y="216" width="80" height="56" rx="10" fill="var(--azul-claro)" />
      <rect x="180" y="216" width="92" height="56" rx="10" fill="var(--superficie)" stroke="var(--borda)" strokeWidth="2" />
      <path d="m112 244 10 10 20-20" fill="none" stroke="var(--azul-principal)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="196" y="238" width="60" height="10" rx="5" fill="var(--borda)" />
      <path d="M300 160 362 184 300 208 238 184Z" fill="var(--azul-principal)" />
      <path d="M262 196v22c0 10 18 18 38 18s38-8 38-18v-22l-38 14Z" fill="var(--azul-escuro)" />
      <path d="M356 188v34" stroke="var(--azul-principal)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="356" cy="226" r="6" fill="var(--azul-principal)" />
      <rect x="320" y="270" width="44" height="44" rx="12" fill="var(--azul-principal)" opacity="0.15" />
      <circle cx="40" cy="120" r="10" fill="var(--azul-principal)" opacity="0.25" />
    </svg>
  );
}

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-borda bg-fundo/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Logo href="/" />
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/entrar" className="btn-secundario px-3 py-2 sm:px-4">
              Entrar
            </Link>
            <Link href="/criar-conta" className="btn px-3 py-2 sm:px-4">
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1200px] items-center gap-12 px-4 py-16 sm:px-8 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl leading-tight sm:text-5xl lg:text-6xl">Sua segunda faculdade</h1>
            <p className="mt-6 max-w-lg text-lg text-texto-suave">
              Estude o que a sua faculdade está ensinando agora, no seu ritmo, sem esperar a próxima aula.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link href="/criar-conta" className="btn px-6 py-3 text-base">
                Começar agora
              </Link>
              <a href="#como-funciona" className="font-medium text-azul-principal hover:text-azul-escuro">
                Ver como funciona →
              </a>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Ilustracao />
          </div>
        </section>

        <section id="como-funciona" className="aparecer scroll-mt-20 bg-superficie py-24">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
            <h2 className="text-center text-3xl">Como funciona</h2>
            <ol className="mt-14 grid gap-6 md:grid-cols-3">
              {PASSOS.map((p, i) => (
                <li key={p.titulo} className="card text-center sm:p-8">
                  <span className="mx-auto grid size-14 place-items-center rounded-full bg-azul-claro text-azul-principal">
                    <Icon name={p.icon} className="size-7" />
                  </span>
                  <p className="mt-5 text-sm font-medium text-azul-principal">Passo {i + 1}</p>
                  <h3 className="mt-1 text-lg">{p.titulo}</h3>
                  <p className="mt-2 text-sm text-texto-suave">{p.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="aparecer mx-auto max-w-[1200px] px-4 py-24 sm:px-8">
          <h2 className="text-center text-3xl">Cursos disponíveis</h2>
          <ul className="mt-14 grid gap-6 md:grid-cols-3">
            {CURSOS.map((c) => (
              <li key={c.nome} className={`card flex flex-col sm:p-8 ${c.ativo ? "" : "bg-superficie"}`}>
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`grid size-12 place-items-center rounded-lg ${
                      c.ativo ? "bg-azul-claro text-azul-principal" : "bg-borda text-texto-suave"
                    }`}
                  >
                    <Icon name={c.icon} className="size-6" />
                  </span>
                  {!c.ativo && (
                    <span className="rounded-full border border-borda bg-fundo px-3 py-1 text-xs font-medium text-texto-suave">
                      Em breve
                    </span>
                  )}
                </div>
                <h3 className={`mt-6 flex-1 text-lg ${c.ativo ? "" : "text-texto-suave"}`}>{c.nome}</h3>
                {c.ativo && (
                  <Link href="/app" className="btn mt-6">
                    Estudar agora
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="aparecer bg-superficie py-24">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
            <h2 className="text-center text-3xl">O que você encontra</h2>
            <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {RECURSOS.map((r) => (
                <li key={r.titulo} className="card">
                  <span className="grid size-11 place-items-center rounded-lg bg-azul-claro text-azul-principal">
                    <Icon name={r.icon} />
                  </span>
                  <h3 className="mt-5">{r.titulo}</h3>
                  <p className="mt-2 text-sm text-texto-suave">{r.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-borda">
        <p className="mx-auto max-w-[1200px] px-4 py-8 text-sm text-texto-suave sm:px-8">
          BiruStudy · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
