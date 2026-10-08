import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

let client: SupabaseClient | null = null;

// Usa a service role key: só pode rodar no servidor, nunca no navegador.
export function db() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export async function getSubject(id: string) {
  const { data, error } = await db().from("subjects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Subject | null;
}

export async function listMaterials(subjectId: string) {
  const { data, error } = await db()
    .from("materials")
    .select("*")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Material[];
}
