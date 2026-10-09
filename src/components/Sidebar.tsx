"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

// Usa /public/logo.png; se o arquivo não existir, mostra o capelo.
export function Logo() {
  const img = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  // A imagem pode falhar antes do React hidratar, e aí o onError não dispara.
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-texto">
      {failed ? (
        <span className="grid size-9 place-items-center rounded-lg bg-azul-claro text-azul-principal">
          <Icon name="capelo" />
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={img} src="/logo.png" alt="" className="size-9 rounded-lg object-contain" onError={() => setFailed(true)} />
      )}
      BiruStudy
    </Link>
  );
}

export function Sidebar({ subjects }: { subjects: { id: string; name: string }[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function item(href: string, label: string, icon: "inicio" | "livro") {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          active ? "bg-azul-claro text-azul-principal" : "text-texto-suave hover:bg-superficie hover:text-texto"
        }`}
      >
        <Icon name={icon} className="size-5 shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-borda bg-fundo px-4 py-3 lg:hidden">
        <Logo />
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={open}
          className="rounded-lg p-2 text-texto-suave hover:bg-superficie"
        >
          <Icon name="menu" className="size-6" />
        </button>
      </header>

      {open && <div className="fixed inset-0 z-40 bg-texto/30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-borda bg-fundo px-4 py-6 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <Logo />
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="rounded-lg p-2 text-texto-suave hover:bg-superficie lg:hidden"
          >
            <Icon name="fechar" />
          </button>
        </div>

        <nav className="mt-10 flex-1 space-y-1 overflow-y-auto">
          {item("/", "Início", "inicio")}
          {subjects.length > 0 && (
            <p className="px-3 pt-6 pb-2 text-xs font-medium uppercase tracking-wide text-texto-suave">Matérias</p>
          )}
          {subjects.map((s) => item(`/materias/${s.id}`, s.name, "livro"))}
        </nav>
      </aside>
    </>
  );
}
