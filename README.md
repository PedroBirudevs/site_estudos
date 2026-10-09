# BiruStudy

Site de estudos pessoal: uma aba por matéria, onde você sobe o material da aula e a IA gera resumo e perguntas **usando só esse material** (para não ensinar o que o professor ainda não deu).

## Etapa 1 (pronta)

- **Matérias**: criar, abrir e apagar disciplinas.
- **Materiais**: subir PDFs, fotos (PNG/JPG/WEBP) e textos (.txt/.md), até 20 MB cada. Slides do PowerPoint: exporte como PDF.
- **Resumo**: a IA lê todos os materiais da matéria e escreve um resumo por tópico, indicando de qual arquivo veio cada parte. Fica salvo.
- **Perguntas**: múltipla escolha (corrigida na hora) e abertas (a IA corrige sua resposta e explica o que faltou). Dá para escolher um assunto para focar.
- **Contas**: cadastro e login com Supabase Auth. A sessão fica num cookie e continua valendo ao fechar o navegador. Sem login, só a página pública, /entrar e /criar-conta abrem. Cada pessoa só vê as próprias matérias, materiais e resumos (coluna `user_id` + RLS).

Próximas etapas: simulados a partir de provas antigas, trilha de Python com terminal (Pyodide), modo prova, mapa mental/slides/voz e pontuação.

## Como configurar

1. **Supabase** (grátis): crie um projeto em supabase.com. Em *SQL Editor*, cole e rode `supabase/schema.sql` (tabelas e bucket privado `materiais`) e depois `supabase/auth.sql` (tabela `perfis`, dono de cada matéria e RLS). Se já houver matérias cadastradas, crie sua conta no site antes e troque `SEU-EMAIL-AQUI` no `auth.sql` pelo e-mail dela: o que já existe passa a ser seu.
   Em *Authentication > Sign In / Providers > Email*, desligue **Confirm email** por enquanto.
2. **Chave do Gemini**: crie em aistudio.google.com/apikey.
3. Copie `.env.example` para `.env.local` e preencha:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Project Settings > API; use a *service_role*, que fica só no servidor e só é usada para os arquivos do Storage)
   - `SUPABASE_ANON_KEY`: a chave pública (*anon* ou *publishable*), usada só no login
4. Rodar local:
   ```bash
   npm install
   npm run dev
   ```
   Abra http://localhost:3000.
5. **Vercel**: importe o repositório e cadastre as mesmas variáveis em *Settings > Environment Variables*.

## Como funciona por dentro

- Next.js (App Router) + TypeScript + Tailwind.
- Os arquivos vão direto do navegador para o Supabase Storage por uma URL assinada (não passam pela Vercel, que limita uploads a 4,5 MB).
- Para gerar resumo/perguntas, o servidor baixa os arquivos da matéria e manda para o Gemini (`gemini-3.8-flash` por padrão; troque com `GEMINI_MODEL`), que lê PDF e imagem direto. Só `src/lib/ia.ts` sabe qual IA é usada; o prompt (`src/lib/materiais.ts`) proíbe usar conteúdo de fora dos materiais.
- Perguntas e correções voltam como JSON; o servidor tira o cerco ` ```json ` que a IA às vezes coloca e valida o formato antes de usar.
- Limite: até ~22 MB de material somado por matéria por pedido. Se passar disso, divida a matéria (ex.: "Redes – Unidade 1").

## Custo

Cada resumo, lista de perguntas e correção manda todos os materiais da matéria para a IA. Um PDF de 30 páginas dá algo como 40–80 mil tokens de entrada por pedido. Acompanhe o uso e os limites no Google AI Studio.
