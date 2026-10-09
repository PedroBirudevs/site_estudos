// Regras de cadastro e login. Usadas no navegador (formulários) e no servidor (actions),
// então não pode importar nada que só rode em um dos dois.

export type CampoCadastro = "nome" | "email" | "senha" | "confirmar";
export type DadosCadastro = Record<CampoCadastro, string>;

// Grupos de letras separados por espaço, hífen ou apóstrofo; começa e termina em letra.
const NOME = /^\p{L}+(?:[ '’-]+\p{L}+)*$/u;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizarNome(nome: string) {
  return nome.trim().replace(/\s+/g, " ");
}

export function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

export function erroNome(nome: string) {
  const n = normalizarNome(nome);
  if (!n) return "Digite seu nome.";
  if (/\d/.test(n)) return "O nome não pode ter números.";
  if (n.length < 3) return "O nome precisa ter pelo menos 3 caracteres.";
  if (n.length > 60) return "O nome pode ter no máximo 60 caracteres.";
  if (!NOME.test(n)) return "Use só letras, espaço, hífen e apóstrofo.";
  return null;
}

export function erroEmail(email: string) {
  const e = normalizarEmail(email);
  if (!e) return "Digite seu e-mail.";
  if (e.length > 254) return "O e-mail pode ter no máximo 254 caracteres.";
  if (!EMAIL.test(e)) return "Digite um e-mail válido.";
  return null;
}

export const REQUISITOS_SENHA = [
  { texto: "Pelo menos 8 caracteres", ok: (s: string) => s.length >= 8 },
  { texto: "Uma letra maiúscula", ok: (s: string) => /\p{Lu}/u.test(s) },
  { texto: "Uma letra minúscula", ok: (s: string) => /\p{Ll}/u.test(s) },
  { texto: "Um número", ok: (s: string) => /\d/.test(s) },
  { texto: "Um caractere especial (ex.: ! @ # $)", ok: (s: string) => /[^\p{L}\p{N}\s]/u.test(s) },
];

export function erroSenha(senha: string) {
  if (!senha) return "Digite uma senha.";
  // O Supabase guarda a senha com bcrypt, que só usa os primeiros 72 bytes.
  if (new TextEncoder().encode(senha).length > 72) return "A senha pode ter no máximo 72 caracteres.";
  const falta = REQUISITOS_SENHA.find((r) => !r.ok(senha));
  return falta ? `A senha precisa de: ${falta.texto.toLowerCase()}.` : null;
}

export function erroConfirmar(senha: string, confirmar: string) {
  if (!confirmar) return "Confirme a senha.";
  return confirmar === senha ? null : "As senhas não são iguais.";
}

export function validarCadastro(d: DadosCadastro) {
  const erros: Partial<Record<CampoCadastro, string>> = {};
  const todos: [CampoCadastro, string | null][] = [
    ["nome", erroNome(d.nome)],
    ["email", erroEmail(d.email)],
    ["senha", erroSenha(d.senha)],
    ["confirmar", erroConfirmar(d.senha, d.confirmar)],
  ];
  for (const [campo, erro] of todos) if (erro) erros[campo] = erro;
  return erros;
}

// Para onde ir depois do login: só páginas do app, nunca outro site (evita redirecionamento aberto).
export function destinoSeguro(next: string | null | undefined) {
  return next && /^\/app(?:[/?#]|$)/.test(next) ? next : "/app";
}
