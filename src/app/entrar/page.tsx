import { LoginForm } from "@/components/AuthForm";

export const metadata = { title: "Entrar · BiruStudy" };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ next?: string; conta?: string }> }) {
  const { next, conta } = await searchParams;
  return <LoginForm next={next} contaCriada={conta === "criada"} />;
}
