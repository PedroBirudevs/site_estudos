import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, authToken } from "@/lib/auth";

// As páginas e as leituras ficam abertas. A senha só é exigida nas ações que gravam
// dados ou chamam a IA (todo POST/DELETE em /api), e o site mostra um modal pedindo a senha.
export async function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  // Sem senha configurada (ex.: rodando local), o site fica aberto.
  if (!password || req.method === "GET" || req.method === "HEAD") return NextResponse.next();

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie && cookie === (await authToken(password))) return NextResponse.next();

  return NextResponse.json({ error: "Digite a senha para continuar." }, { status: 401 });
}

export const config = {
  matcher: ["/api/((?!login).*)"],
};
