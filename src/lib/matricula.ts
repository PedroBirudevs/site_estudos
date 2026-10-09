"use server";

import { redirect } from "next/navigation";
import { sessao } from "./supabase";

// Matricula a pessoa no curso escolhido e vai para o início. O RLS só aceita curso ativo.
export async function matricular(form: FormData) {
  const cursoId = String(form.get("curso_id") ?? "");
  const { db, userId } = await sessao();
  const { error } = await db
    .from("matriculas")
    .upsert({ user_id: userId, curso_id: cursoId }, { onConflict: "user_id,curso_id", ignoreDuplicates: true });
  if (error) throw new Error("Não consegui fazer a matrícula. Tente de novo.");
  redirect("/app");
}
