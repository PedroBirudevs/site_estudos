-- Rode este arquivo no Supabase: Dashboard > SQL Editor > New query > colar > Run.
-- Ordem: schema.sql, auth.sql e depois este. Pode rodar de novo sem problema.
-- Atenção: este arquivo substitui as políticas de criar/editar materiais e resumos do auth.sql
-- (para aceitar matérias do catálogo). Se rodar o auth.sql de novo, rode este depois.


-- 1) CATÁLOGO -----------------------------------------------------------------

create table if not exists public.cursos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  ativo boolean not null default false
);

create table if not exists public.materias_catalogo (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.cursos(id) on delete cascade,
  periodo int not null check (periodo between 1 and 12),
  codigo text not null,
  nome text not null,
  ordem int not null,
  unique (curso_id, codigo)
);
create index if not exists materias_catalogo_curso_idx on public.materias_catalogo(curso_id, periodo, ordem);

create table if not exists public.topicos (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid not null references public.materias_catalogo(id) on delete cascade,
  titulo text not null,
  ordem int not null,
  conteudo text not null default '',
  unique (materia_id, ordem)
);

create table if not exists public.matriculas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  curso_id uuid not null references public.cursos(id) on delete cascade,
  criado_em timestamptz not null default now(),
  unique (user_id, curso_id) -- pode ter mais de um curso, mas não o mesmo duas vezes
);

-- Catálogo: qualquer pessoa logada lê; ninguém edita pelo site (sem políticas de escrita).
alter table public.cursos enable row level security;
alter table public.materias_catalogo enable row level security;
alter table public.topicos enable row level security;
grant select on public.cursos, public.materias_catalogo, public.topicos to authenticated;

drop policy if exists "cursos: leitura para logados" on public.cursos;
create policy "cursos: leitura para logados" on public.cursos for select to authenticated using (true);
drop policy if exists "materias_catalogo: leitura para logados" on public.materias_catalogo;
create policy "materias_catalogo: leitura para logados" on public.materias_catalogo for select to authenticated using (true);
drop policy if exists "topicos: leitura para logados" on public.topicos;
create policy "topicos: leitura para logados" on public.topicos for select to authenticated using (true);

-- Matrículas: cada pessoa só vê, cria e apaga as suas, e só em curso ativo.
alter table public.matriculas enable row level security;
grant select, insert, delete on public.matriculas to authenticated;

drop policy if exists "matriculas: ler as próprias" on public.matriculas;
create policy "matriculas: ler as próprias" on public.matriculas
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "matriculas: criar as próprias" on public.matriculas;
create policy "matriculas: criar as próprias" on public.matriculas
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.cursos c where c.id = curso_id and c.ativo)
  );
drop policy if exists "matriculas: apagar as próprias" on public.matriculas;
create policy "matriculas: apagar as próprias" on public.matriculas
  for delete to authenticated using ((select auth.uid()) = user_id);


-- 2) MATERIAIS E RESUMOS: MATÉRIA PRÓPRIA OU MATÉRIA/TÓPICO DO CATÁLOGO --------
-- Cada material/resumo é de uma matéria própria (subject_id) OU de uma matéria do
-- catálogo (materia_id), nunca dos dois. topico_id é opcional e só vale com materia_id.

alter table public.materials alter column subject_id drop not null;
alter table public.materials add column if not exists materia_id uuid references public.materias_catalogo(id) on delete cascade;
alter table public.materials add column if not exists topico_id uuid references public.topicos(id) on delete set null;
alter table public.materials drop constraint if exists materials_origem_check;
alter table public.materials add constraint materials_origem_check check (
  (subject_id is null) <> (materia_id is null) and (topico_id is null or materia_id is not null)
);
create index if not exists materials_materia_idx on public.materials(materia_id);

-- Resumos: antes era um por matéria própria (chave = subject_id). Agora uma matéria do
-- catálogo pode ter vários (um por material ou tópico), então a chave vira um id próprio.
-- A matéria própria continua com um resumo só (subject_id único).
alter table public.summaries add column if not exists id uuid not null default gen_random_uuid();
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.summaries'::regclass and contype = 'p'
      and pg_get_constraintdef(oid) = 'PRIMARY KEY (subject_id)'
  ) then
    alter table public.summaries drop constraint summaries_pkey;
    alter table public.summaries add primary key (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'summaries_subject_id_key') then
    alter table public.summaries add constraint summaries_subject_id_key unique (subject_id);
  end if;
end;
$$;
alter table public.summaries alter column subject_id drop not null;
alter table public.summaries add column if not exists materia_id uuid references public.materias_catalogo(id) on delete cascade;
alter table public.summaries add column if not exists topico_id uuid references public.topicos(id) on delete set null;
alter table public.summaries add column if not exists material_id uuid references public.materials(id) on delete set null;
alter table public.summaries drop constraint if exists summaries_origem_check;
alter table public.summaries add constraint summaries_origem_check check (
  (subject_id is null) <> (materia_id is null) and (topico_id is null or materia_id is not null)
);
create index if not exists summaries_materia_idx on public.summaries(materia_id);

-- Mesmas regras do auth.sql (só o que é seu), aceitando também matéria do catálogo.
drop policy if exists "materials: criar os próprios" on public.materials;
create policy "materials: criar os próprios" on public.materials
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and (
      materia_id is not null
      or exists (select 1 from public.subjects s where s.id = subject_id and s.user_id = (select auth.uid()))
    )
  );
drop policy if exists "materials: editar os próprios" on public.materials;
create policy "materials: editar os próprios" on public.materials
  for update to authenticated using ((select auth.uid()) = user_id) with check (
    (select auth.uid()) = user_id
    and (
      materia_id is not null
      or exists (select 1 from public.subjects s where s.id = subject_id and s.user_id = (select auth.uid()))
    )
  );

drop policy if exists "summaries: criar os próprios" on public.summaries;
create policy "summaries: criar os próprios" on public.summaries
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and (
      materia_id is not null
      or exists (select 1 from public.subjects s where s.id = subject_id and s.user_id = (select auth.uid()))
    )
  );
drop policy if exists "summaries: editar os próprios" on public.summaries;
create policy "summaries: editar os próprios" on public.summaries
  for update to authenticated using ((select auth.uid()) = user_id) with check (
    (select auth.uid()) = user_id
    and (
      materia_id is not null
      or exists (select 1 from public.subjects s where s.id = subject_id and s.user_id = (select auth.uid()))
    )
  );


-- 3) DADOS INICIAIS -------------------------------------------------------------

insert into public.cursos (nome, slug, ativo) values
  ('Ciência da Computação', 'ciencia-da-computacao', true),
  ('Direito', 'direito', false),
  ('Enfermagem', 'enfermagem', false)
on conflict (slug) do nothing;

-- Código = CC + período + ordem (ex.: CC203).
insert into public.materias_catalogo (curso_id, periodo, codigo, nome, ordem)
select c.id, m.periodo, format('CC%s%s', m.periodo, lpad(m.ordem::text, 2, '0')), m.nome, m.ordem
from public.cursos c
cross join (values
  (1, 1, 'Algoritmos e Programação'),
  (1, 2, 'Introdução à Inteligência Artificial'),
  (1, 3, 'Lógica Computacional'),
  (1, 4, 'Matemática Computacional'),
  (1, 5, 'Organização e Arquitetura de Computadores'),
  (1, 6, 'Tecnologia, Dados e Inovação Profissional'),
  (2, 1, 'Comunicação e Carreira'),
  (2, 2, 'Engenharia de Software'),
  (2, 3, 'Estrutura de Dados'),
  (2, 4, 'Introdução a Banco de Dados'),
  (2, 5, 'Introdução a Redes de Computadores'),
  (2, 6, 'Introdução a Sistemas Operacionais'),
  (3, 1, 'Cálculo Diferencial e Integral'),
  (3, 2, 'Humanidades em Ação'),
  (3, 3, 'Programação Orientada a Objetos'),
  (3, 4, 'Programação para Sistemas Web'),
  (3, 5, 'Projeto de Banco de Dados'),
  (3, 6, 'UX/UI'),
  (4, 1, 'Análise e Projeto de Sistemas'),
  (4, 2, 'DevOps e Computação em Nuvem'),
  (4, 3, 'Empreendedorismo e Ética Profissional'),
  (4, 4, 'Fundamentos de Blockchain'),
  (4, 5, 'Internet das Coisas e Automação'),
  (4, 6, 'Probabilidade e Estatística'),
  (5, 1, 'Ciência de Dados'),
  (5, 2, 'Estruturas de Dados Avançadas'),
  (5, 3, 'Projeto de Extensão I'),
  (5, 4, 'Programação para Dispositivos Móveis e Inteligentes'),
  (5, 5, 'Teoria dos Grafos'),
  (6, 1, 'Aprendizado por Máquina'),
  (6, 2, 'Arquitetura e Design de Software'),
  (6, 3, 'Gestão da Tecnologia de Informação'),
  (6, 4, 'Projeto de Extensão II'),
  (6, 5, 'Testes e Qualidade de Software'),
  (7, 1, 'Inteligências Artificiais Cognitivas e Generativas'),
  (7, 2, 'Linguagens Formais e Autômatos'),
  (7, 3, 'Projeto de Extensão III'),
  (7, 4, 'Sistemas Paralelos e Distribuídos'),
  (8, 1, 'Estágio Supervisionado'),
  (8, 2, 'Projeto de Extensão IV'),
  (8, 3, 'Projeto de Robótica e IoT'),
  (8, 4, 'Tópicos Avançados em TI')
) as m(periodo, ordem, nome)
where c.slug = 'ciencia-da-computacao'
on conflict (curso_id, codigo) do nothing;

-- Tópicos genéricos só para as matérias do 2º período, sem conteúdo ainda.
insert into public.topicos (materia_id, titulo, ordem)
select mc.id, t.titulo, t.ordem
from public.materias_catalogo mc
join public.cursos c on c.id = mc.curso_id and c.slug = 'ciencia-da-computacao'
join (values
  ('Comunicação e Carreira', 1, 'Comunicação oral e escrita'),
  ('Comunicação e Carreira', 2, 'Apresentações e oratória'),
  ('Comunicação e Carreira', 3, 'Trabalho em equipe e feedback'),
  ('Comunicação e Carreira', 4, 'Currículo, LinkedIn e portfólio'),
  ('Comunicação e Carreira', 5, 'Entrevistas e processos seletivos'),
  ('Comunicação e Carreira', 6, 'Planejamento de carreira em TI'),
  ('Engenharia de Software', 1, 'Introdução à Engenharia de Software'),
  ('Engenharia de Software', 2, 'Processos de software'),
  ('Engenharia de Software', 3, 'Metodologias ágeis: Scrum e Kanban'),
  ('Engenharia de Software', 4, 'Engenharia de requisitos'),
  ('Engenharia de Software', 5, 'Modelagem com UML'),
  ('Engenharia de Software', 6, 'Verificação, validação e testes'),
  ('Engenharia de Software', 7, 'Manutenção e evolução de software'),
  ('Estrutura de Dados', 1, 'Tipos abstratos de dados'),
  ('Estrutura de Dados', 2, 'Listas encadeadas'),
  ('Estrutura de Dados', 3, 'Pilhas'),
  ('Estrutura de Dados', 4, 'Filas'),
  ('Estrutura de Dados', 5, 'Árvores binárias'),
  ('Estrutura de Dados', 6, 'Árvores binárias de busca'),
  ('Estrutura de Dados', 7, 'Tabelas hash'),
  ('Estrutura de Dados', 8, 'Ordenação e busca'),
  ('Introdução a Banco de Dados', 1, 'Bancos de dados e SGBDs'),
  ('Introdução a Banco de Dados', 2, 'Modelo entidade-relacionamento'),
  ('Introdução a Banco de Dados', 3, 'Modelo relacional'),
  ('Introdução a Banco de Dados', 4, 'Normalização'),
  ('Introdução a Banco de Dados', 5, 'SQL: criação de tabelas (DDL)'),
  ('Introdução a Banco de Dados', 6, 'SQL: consultas (DML)'),
  ('Introdução a Banco de Dados', 7, 'Junções e subconsultas'),
  ('Introdução a Redes de Computadores', 1, 'Conceitos e tipos de redes'),
  ('Introdução a Redes de Computadores', 2, 'Modelos OSI e TCP/IP'),
  ('Introdução a Redes de Computadores', 3, 'Camadas física e de enlace'),
  ('Introdução a Redes de Computadores', 4, 'Endereçamento IP e sub-redes'),
  ('Introdução a Redes de Computadores', 5, 'Roteamento'),
  ('Introdução a Redes de Computadores', 6, 'Camada de transporte: TCP e UDP'),
  ('Introdução a Redes de Computadores', 7, 'Protocolos de aplicação: HTTP e DNS'),
  ('Introdução a Sistemas Operacionais', 1, 'Conceitos de sistemas operacionais'),
  ('Introdução a Sistemas Operacionais', 2, 'Processos e threads'),
  ('Introdução a Sistemas Operacionais', 3, 'Escalonamento de CPU'),
  ('Introdução a Sistemas Operacionais', 4, 'Sincronização e deadlocks'),
  ('Introdução a Sistemas Operacionais', 5, 'Gerenciamento de memória'),
  ('Introdução a Sistemas Operacionais', 6, 'Memória virtual'),
  ('Introdução a Sistemas Operacionais', 7, 'Sistemas de arquivos')
) as t(materia, ordem, titulo) on t.materia = mc.nome
where mc.periodo = 2
on conflict (materia_id, ordem) do nothing;
