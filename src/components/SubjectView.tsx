"use client";

import { useState } from "react";
import type { Material, Subject, Summary } from "@/lib/supabase";
import { MaterialsPanel } from "./MaterialsPanel";
import { QuizPanel } from "./QuizPanel";
import { SummaryPanel } from "./SummaryPanel";

const TABS = [
  { id: "materiais", label: "Materiais" },
  { id: "resumo", label: "Resumo" },
  { id: "perguntas", label: "Questões" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export function SubjectView({
  subject,
  materials,
  summary,
  initialTab,
}: {
  subject: Subject;
  materials: Material[];
  summary: Summary | null;
  initialTab?: string;
}) {
  const [tab, setTab] = useState<Tab>(
    TABS.find((t) => t.id === initialTab)?.id ?? (materials.length === 0 ? "materiais" : "resumo"),
  );

  return (
    <div className="space-y-8">
      <nav className="flex gap-2 overflow-x-auto border-b border-borda">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition ${
              tab === t.id
                ? "border-azul-principal text-azul-principal"
                : "border-transparent text-texto-suave hover:text-texto"
            }`}
          >
            {t.label}
            {t.id === "materiais" && (
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  tab === t.id ? "bg-azul-claro" : "bg-superficie"
                }`}
              >
                {materials.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Os painéis ficam montados para não perder o resumo/perguntas ao trocar de aba. */}
      <div hidden={tab !== "materiais"}>
        <MaterialsPanel base={`/api/subjects/${subject.id}`} materials={materials} apagarMateria={subject} />
      </div>
      <div hidden={tab !== "resumo"}>
        <SummaryPanel subject={subject} materialCount={materials.length} initial={summary} />
      </div>
      <div hidden={tab !== "perguntas"}>
        <QuizPanel subject={subject} materialCount={materials.length} />
      </div>
    </div>
  );
}
