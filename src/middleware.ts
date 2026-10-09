import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Checa a sessão do Supabase Auth (e renova o cookie quando precisa):
// - /app e /api exigem login;
// - quem já está logado não vê a página pública nem as telas de entrar/criar conta.
export async function middleware(req: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Defina SUPABASE_URL e SUPABASE_ANON_KEY no .env.local");

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        lista.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = req.nextUrl;
  // Redireciona levando junto os cookies renovados acima.
  const irPara = (destino: string) => {
    const r = NextResponse.redirect(new URL(destino, req.url));
    res.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  if (pathname.startsWith("/api/")) {
    return user ? res : NextResponse.json({ error: "Sua sessão expirou. Entre de novo para continuar." }, { status: 401 });
  }
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return user ? res : irPara(`/entrar?next=${encodeURIComponent(pathname + search)}`);
  }
  if (user && (pathname === "/" || pathname === "/entrar" || pathname === "/criar-conta")) {
    return irPara("/app");
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
