# BiruStudy

Site de estudos pessoal: uma aba por matéria, onde você sobe o material da aula e a IA gera resumo e perguntas **usando só esse material** (para não ensinar o que o professor ainda não deu).

## Etapa 1 (pronta)

- **Matérias**: criar, abrir e apagar disciplinas.
- **Materiais**: subir PDFs, fotos (PNG/JPG/WEBP) e textos (.txt/.md), até 20 MB cada. Slides do PowerPoint: exporte como PDF.
- **Resumo**: a IA lê todos os materiais da matéria e escreve um resumo por tópico, indicando de qual arquivo veio cada parte. Fica salvo.
- **Perguntas**: múltipla escolha (corrigida na hora) e abertas (a IA corrige sua resposta e explica o que faltou). Dá para escolher um assunto para focar.
- **Senha** só nas ações que gravam dados ou chamam a IA (criar/apagar, enviar material, resumo, perguntas). Navegar é livre; o site pede a senha num modal na primeira ação e lembra a liberação.

Próximas etapas: simulados a partir de provas antigas, trilha de Python com terminal (Pyodide), modo prova, mapa mental/slides/voz e pontuação.

## Como configurar

1. **Supabase** (grátis): crie um projeto em supabase.com. Em *SQL Editor*, cole e rode `supabase/schema.sql`. Ele cria as tabelas e o bucket privado `materiais`.
2. **Chave do Claude**: crie em platform.claude.com (Settings > API Keys) e coloque créditos.
3. Copie `.env.example` para `.env.local` e preencha:
   - `ANTHROPIC_API_KEY`
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Project Settings > API; use a *service_role*, que fica só no servidor)
   - `APP_PASSWORD`: a senha pedida antes de gravar dados ou usar a IA
4. Rodar local:
   ```bash
   npm install
   npm run dev
   ```
   Abra http://localhost:3000.
5. **Vercel**: importe o repositório e cadastre as mesmas 4 variáveis em *Settings > Environment Variables*.

## Como funciona por dentro

- Next.js (App Router) + TypeScript + Tailwind.
- Os arquivos vão direto do navegador para o Supabase Storage por uma URL assinada (não passam pela Vercel, que limita uploads a 4,5 MB).
- Para gerar resumo/perguntas, o servidor baixa os arquivos da matéria e manda para o Claude (`claude-opus-5-5`), que lê PDF e imagem direto. O prompt de sistema (`src/lib/claude.ts`) proíbe usar conteúdo de fora dos materiais.
- Os materiais entram com *prompt caching*: depois do primeiro pedido, gerar perguntas ou corrigir respostas na mesma matéria custa bem menos.
- Se o modelo recusar um pedido, a API refaz automaticamente num modelo reserva (`fallbacks: "default"`).
- Limite: até ~22 MB de material somado por matéria por pedido. Se passar disso, divida a matéria (ex.: "Redes – Unidade 1").

## Custo

Cada resumo lê todos os materiais da matéria. Um PDF de 30 páginas dá algo como 40–80 mil tokens de entrada (a US$ 4 por milhão, uns US$ 0,15–0,30 por resumo). Perguntas e correções logo depois saem mais baratas por causa do cache. Acompanhe o gasto em platform.claude.com > Usage.
