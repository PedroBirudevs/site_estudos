"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { authConfig, supabaseAuth } from "./supabase-auth";
import {
  type CampoCadastro,
  destinoSeguro,
  normalizarEmail,
  normalizarNome,
  validarCadastro,
} from "./validacao";

export type EstadoCadastro = { erros: Partial<Record<CampoCadastro, string>>; geral?: string };
export type EstadoLogin = { erro?: string; email?: string };

export async function cadastrar(_anterior: EstadoCadastro, form: FormData): Promise<EstadoCadastro> {
  const dados = {
    nome: String(form.get("nome") ?? ""),
    email: String(form.get("email") ?? ""),
    senha: String(form.get("senha") ?? ""),
    confirmar: String(form.get("confirmar") ?? ""),
  };
  const erros = validarCadastro(dados);
  if (Object.keys(erros).length > 0) return { erros };

  // Cliente sem cookie: cria a conta sem deixar a pessoa logada, porque ela deve entrar em /entrar.
  const { url, key } = authConfig();
  const anonimo = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await anonimo.auth.signUp({
    email: normalizarEmail(dados.email),
    password: dados.senha,
    options: { data: { nome: normalizarNome(dados.nome) } },
  });
  if (error) {
    if (error.code === "user_already_exists") return { erros: { email: "Já existe uma conta com este e-mail." } };
    if (error.status === 429) return { erros: {}, geral: "Muitas tentativas. Espere alguns minutos e tente de novo." };
    return { erros: {}, geral: "Não consegui criar a conta agora. Tente de novo." };
  }
  redirect("/entrar?conta=criada");
}

export async function entrar(_anterior: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const email = normalizarEmail(String(form.get("email") ?? ""));
  const senha = String(form.get("senha") ?? "");
  if (!email || !senha) return { erro: "Preencha e-mail e senha.", email };

  const supabase = await supabaseAuth();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) {
    // Mensagem única: nunca dizer se foi o e-mail ou a senha que errou.
    if (error.status === 429) return { erro: "Muitas tentativas. Espere alguns minutos e tente de novo.", email };
    return { erro: "E-mail ou senha incorretos.", email };
  }
  redirect(destinoSeguro(String(form.get("next") ?? "")));
}

export async function sair() {
  const supabase = await supabaseAuth();
  await supabase.auth.signOut();
  redirect("/");
}
