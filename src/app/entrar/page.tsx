import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Entrar · BiruStudy" };

export default function Entrar() {
  return (
    <AuthForm
      titulo="Entrar"
      campos={[
        { id: "email", label: "E-mail", type: "email", autoComplete: "email" },
        { id: "senha", label: "Senha", type: "password", autoComplete: "current-password" },
      ]}
      botao="Entrar"
      rodape={{ texto: "Ainda não tem conta?", link: "Criar conta", href: "/criar-conta" }}
    />
  );
}
