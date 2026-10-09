import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Criar conta · BiruStudy" };

export default function CriarConta() {
  return (
    <AuthForm
      titulo="Criar conta"
      campos={[
        { id: "nome", label: "Nome", type: "text", autoComplete: "name" },
        { id: "email", label: "E-mail", type: "email", autoComplete: "email" },
        { id: "senha", label: "Senha", type: "password", autoComplete: "new-password" },
      ]}
      botao="Criar conta"
      rodape={{ texto: "Já tem conta?", link: "Entrar", href: "/entrar" }}
    />
  );
}
