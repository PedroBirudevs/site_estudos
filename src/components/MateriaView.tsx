"use client";

import { useState } from "react";
import type { Topico } from "@/lib/catalogo";
import type { Material } from "@/lib/supabase";
import { Icon } from "./Icon";
import { Markdown } from "./Markdown";
import { MaterialsPanel } from "./MaterialsPanel";

export type ResumoDaMateria = {
  id: string;
  content: string;
  updated_at: string;
  materials: { file_name: string } | null;
  topicos: { titulo: string } | null;
};

const TABS = [
  { id: "aulas", label: "Aulas" },
  { id: "resumos", label: "Resumos" },
  { id: "questoes", label: "Questões" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const DATA = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" });

// Linha clicável que abre e fecha (aulas e resumos).
function Linha({ titulo, detalhe, children }: { titulo: string; detalhe?: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-borda last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 hover:bg-superficie [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1 font-medium">{titulo}</span>
        {detalhe && <span className="hidden shrink-0 text-xs text-texto-suave sm:inline">{detalhe}</span>}
        <Icon name="seta" className="size-5 shrink-0 text-texto-suave transition group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}

function Vazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-azul-claro text-azul-principal">
        <Icon name="livro" className="size-6" />
      </span>
      <p className="mt-4 font-semibold">{titulo}</p>
      <p className="mt-1 max-w-md text-sm text-texto-suave">{texto}</p>
    </div>
  );
}

export function MateriaView({
  materiaId,
  topicos,
  materiais,
  resumos,
}: {
  materiaId: string;
  topicos: Topico[];
  materiais: Material[];
  resumos: ResumoDaMateria[];
}) {
  const [tab, setTab] = useState<Tab>("aulas");
  const [escolhendo, setEscolhendo] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-borda">
        <nav className="-mb-px flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === t.id
                  ? "border-azul-principal text-azul-principal"
                  : "border-transparent text-texto-suave hover:text-texto"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <a href="#materiais" className="btn-secundario mb-2 px-3 py-2">
          <Icon name="enviar" className="size-4" />
          Enviar material
        </a>
      </div>

      {tab === "aulas" &&
        (topicos.length > 0 ? (
          <div className="card p-0">
            {topicos.map((t) => (
              <Linha key={t.id} titulo={`${t.ordem}. ${t.titulo}`}>
                {t.conteudo.trim() ? (
                  <Markdown>{t.conteudo}</Markdown>
                ) : (
                  <div className="flex flex-wrap items-center gap-4 rounded-lg bg-superficie px-4 py-3">
                    <p className="flex-1 text-sm text-texto-suave">Conteúdo ainda não disponível.</p>
                    <button className="btn" disabled title="Em breve">
                      Gerar aula
                    </button>
                  </div>
                )}
              </Linha>
            ))}
          </div>
        ) : (
          <Vazio titulo="As aulas desta matéria chegam em breve" texto="Enquanto isso, envie o seu material abaixo." />
        ))}

      {tab === "resumos" && (
        <div className="space-y-5">
          <div className="space-y-4">
            <button className="btn" onClick={() => setEscolhendo((v) => !v)} aria-expanded={escolhendo}>
              <Icon name="mais" className="size-4" />
              Novo resumo
            </button>
            {escolhendo && (
              <div className="card flex flex-wrap items-end gap-4">
                <label className="min-w-56 flex-1 text-sm">
                  <span className="mb-1.5 block font-medium">Resumir a partir de</span>
                  <select className="input" disabled={topicos.length + materiais.length === 0} defaultValue="">
                    <option value="" disabled>
                      {topicos.length + materiais.length === 0 ? "Envie um material primeiro" : "Escolha um tópico ou material"}
                    </option>
                    {topicos.length > 0 && (
                      <optgroup label="Tópicos">
                        {topicos.map((t) => (
                          <option key={t.id} value={`topico:${t.id}`}>
                            {t.titulo}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {materiais.length > 0 && (
                      <optgroup label="Seus materiais">
                        {materiais.map((m) => (
                          <option key={m.id} value={`material:${m.id}`}>
                            {m.file_name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </label>
                {/* ponytail: geração ainda não ligada (sem IA nesta etapa); falta a rota que gera e salva em summaries. */}
                <button className="btn" disabled title="Em breve">
                  Gerar resumo
                </button>
                <p className="w-full text-xs text-texto-suave">A geração de resumos por tópico e por material chega em breve.</p>
              </div>
            )}
          </div>

          {resumos.length > 0 ? (
            <div className="card p-0">
              {resumos.map((r) => (
                <Linha
                  key={r.id}
                  titulo={r.topicos?.titulo ?? r.materials?.file_name ?? "Resumo da matéria"}
                  detalhe={`${DATA.format(new Date(r.updated_at))}${r.materials ? ` · ${r.materials.file_name}` : ""}`}
                >
                  <p className="mb-3 text-xs text-texto-suave sm:hidden">
                    {DATA.format(new Date(r.updated_at))}
                    {r.materials && ` · ${r.materials.file_name}`}
                  </p>
                  <Markdown>{r.content}</Markdown>
                </Linha>
              ))}
            </div>
          ) : (
            <Vazio titulo="Nenhum resumo ainda" texto="Os resumos que você gerar aparecem aqui, um por linha." />
          )}
        </div>
      )}

      {tab === "questoes" && (
        <Vazio
          titulo="Nenhuma questão ainda"
          texto="As questões de cada tópico aparecem aqui depois que houver material desta matéria."
        />
      )}

      <section id="materiais" className="scroll-mt-24 space-y-4 border-t border-borda pt-8">
        <div>
          <h2 className="text-lg">Seus materiais</h2>
          <p className="mt-1 text-sm text-texto-suave">PDFs, fotos e textos da sua faculdade para esta matéria. Só você vê.</p>
        </div>
        <MaterialsPanel base={`/api/catalogo/${materiaId}`} materials={materiais} />
      </section>
    </div>
  );
}
