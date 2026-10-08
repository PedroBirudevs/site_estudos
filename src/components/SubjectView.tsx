"use client";

import { useState } from "react";
import type { Material, Subject, Summary } from "@/lib/supabase";
import { MaterialsPanel } from "./MaterialsPanel";
import { QuizPanel } from "./QuizPanel";
import { SummaryPanel } from "./SummaryPanel";

const TABS = [
  { id: "materiais", label: "Materiais" },
  { id: "resumo", label: "Resumo" },
  { id: "perguntas", label: "Perguntas" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export function SubjectView({
  subject,
  materials,
  summary,
}: {
  subject: Subject;
  materials: Material[];
  summary: Summary | null;
}) {
  const [tab, setTab] = useState<Tab>(materials.length === 0 ? "materiais" : "resumo");

  return (
    <div className="space-y-5">
      <nav className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            {t.id === "materiais" && <span className="ml-1.5 text-xs opacity-70">{materials.length}</span>}
          </button>
        ))}
      </nav>

      {/* Os painéis ficam montados para não perder o resumo/perguntas ao trocar de aba. */}
      <div hidden={tab !== "materiais"}>
        <MaterialsPanel subject={subject} materials={materials} />
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
