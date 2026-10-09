import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Chave pública (anon/publishable): login e consultas ao banco como a pessoa logada (sujeitas ao RLS).
export function authConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Defina SUPABASE_URL e SUPABASE_ANON_KEY no .env.local");
  return { url, key };
}

// Cliente do Supabase Auth com a sessão guardada em cookie.
export async function supabaseAuth() {
  const store = await cookies();
  const { url, key } = authConfig();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (lista) => {
        // Em Server Component não dá para gravar cookie; o middleware já renova a sessão.
        try {
          lista.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {}
      },
    },
  });
}
