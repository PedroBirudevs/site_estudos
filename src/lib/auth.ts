export const AUTH_COOKIE = "sf_auth";

// Valor guardado no cookie: hash da senha, para não deixar a senha em texto puro no navegador.
export async function authToken(password: string) {
  const bytes = new TextEncoder().encode(`segunda-faculdade:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
