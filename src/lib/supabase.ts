import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { supabaseAuth } from "./supabase-auth";

export const BUCKET = "materiais";

export type Subject = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type Material = {
  id: string;
  subject_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export type Summary = {
  subject_id: string;
  content: string;
  material_count: number;
  updated_at: string;
};

let admin: SupabaseClient | null = null;

// Arquivos do bucket privado, com a service role key (só no servidor).
// Só use depois de confirmar que a matéria/material é de quem está logado (via sessao()).
export function arquivos() {
  if (!admin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
    }
    admin = createClient(url, key, { auth: { persistSession: false } });
  }
  return admin.storage.from(BUCKET);
}

// Banco com a sessão de quem está logado: o RLS só deixa ler e mexer no que é dessa pessoa,
// e as consultas ainda filtram por userId explicitamente.
export const sessao = cache(async () => {
  const db = await supabaseAuth();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new Error("Sua sessão expirou. Entre de novo para continuar.");
  return { db, userId: user.id, user };
});

export async function getSubject(id: string) {
  const { db, userId } = await sessao();
  const { data, error } = await db.from("subjects").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data as Subject | null;
}

export async function listMaterials(subjectId: string) {
  const { db, userId } = await sessao();
  const { data, error } = await db
    .from("materials")
    .select("*")
    .eq("subject_id", subjectId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Material[];
}
