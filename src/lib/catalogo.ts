import "server-only";
import { sessao } from "./supabase";

// Catálogo de cursos (supabase/cursos.sql): leitura para qualquer pessoa logada.

export type Curso = { id: string; nome: string; slug: string; ativo: boolean };
export type MateriaCatalogo = {
  id: string;
  curso_id: string;
  periodo: number;
  codigo: string;
  nome: string;
  ordem: number;
};
export type MateriaNaGrade = MateriaCatalogo & { topicos: { count: number }[] };
export type Topico = { id: string; materia_id: string; titulo: string; ordem: number; conteudo: string };

export async function listarCursos() {
  const { db } = await sessao();
  const { data, error } = await db.from("cursos").select("*").order("ativo", { ascending: false }).order("nome");
  if (error) throw error;
  return (data ?? []) as Curso[];
}

// Cursos em que a pessoa está matriculada, do mais antigo para o mais novo.
export async function meusCursos() {
  const { db, userId } = await sessao();
  const { data, error } = await db
    .from("matriculas")
    .select("criado_em, cursos(*)")
    .eq("user_id", userId)
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((m) => m.cursos as unknown as Curso);
}

export async function gradeDoCurso(cursoId: string) {
  const { db } = await sessao();
  const { data, error } = await db
    .from("materias_catalogo")
    .select("*, topicos(count)")
    .eq("curso_id", cursoId)
    .order("periodo")
    .order("ordem");
  if (error) throw error;
  return (data ?? []) as MateriaNaGrade[];
}

export async function getMateriaCatalogo(id: string) {
  const { db } = await sessao();
  const { data, error } = await db.from("materias_catalogo").select("*, cursos(nome)").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as (MateriaCatalogo & { cursos: { nome: string } }) | null;
}
