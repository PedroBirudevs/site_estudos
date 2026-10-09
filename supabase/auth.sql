-- Rode este arquivo no Supabase: Dashboard > SQL Editor > New query > colar > Run.
-- Rode depois do schema.sql. Pode rodar de novo sem problema.
--
-- MATÉRIAS QUE JÁ EXISTEM ainda não têm dono. Se você já tem matérias cadastradas:
--   1) crie sua conta no site (/criar-conta);
--   2) troque 'SEU-EMAIL-AQUI' (seção 3) pelo e-mail dessa conta.
-- Tudo o que já existe passa a ser seu. Se houver matérias sem dono e o e-mail não
-- for encontrado, o script para com um erro explicando o que fazer.


-- 1) PERFIS ------------------------------------------------------------------

create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (char_length(nome) between 3 and 60),
  curso text,
  criado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;
grant select, update on public.perfis to authenticated;

-- Cada pessoa só lê e edita o próprio perfil. Não há política de insert nem delete:
-- o perfil é criado pelo gatilho abaixo e apagado junto com o usuário.
drop policy if exists "perfis: ler o próprio" on public.perfis;
create policy "perfis: ler o próprio" on public.perfis
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "perfis: editar o próprio" on public.perfis;
create policy "perfis: editar o próprio" on public.perfis
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Cria o perfil automaticamente quando alguém se cadastra, com o nome enviado no cadastro.
create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), 'Sem nome'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- Perfil para quem se cadastrou antes deste script existir.
insert into public.perfis (id, nome)
select id, coalesce(nullif(trim(raw_user_meta_data ->> 'nome'), ''), 'Sem nome')
from auth.users
on conflict (id) do nothing;


-- 2) DONO DAS MATÉRIAS, MATERIAIS E RESUMOS ------------------------------------

alter table public.subjects  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.materials add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.summaries add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists subjects_user_idx  on public.subjects(user_id);
create index if not exists materials_user_idx on public.materials(user_id);
create index if not exists summaries_user_idx on public.summaries(user_id);


-- 3) PASSA O QUE JÁ EXISTE PARA O SEU USUÁRIO ----------------------------------

do $$
declare
  dono_email text := 'SEU-EMAIL-AQUI';
  dono uuid;
begin
  if exists (select 1 from public.subjects where user_id is null) then
    select id into dono from auth.users where email = lower(trim(dono_email));
    if dono is null then
      raise exception 'Existem matérias sem dono e não achei uma conta com o e-mail "%". Crie sua conta no site e coloque o e-mail dela em dono_email (seção 3).', dono_email;
    end if;
    update public.subjects set user_id = dono where user_id is null;
  end if;

  -- Materiais e resumos herdam o dono da matéria.
  update public.materials m set user_id = s.user_id from public.subjects s
    where m.subject_id = s.id and m.user_id is null;
  update public.summaries r set user_id = s.user_id from public.subjects s
    where r.subject_id = s.id and r.user_id is null;
end;
$$;

alter table public.subjects  alter column user_id set not null;
alter table public.materials alter column user_id set not null;
alter table public.summaries alter column user_id set not null;


-- 4) RLS: CADA PESSOA SÓ LÊ, CRIA, EDITA E APAGA O QUE É DELA -------------------
-- Materiais e resumos ainda exigem que a matéria também seja da pessoa.

alter table public.subjects  enable row level security;
alter table public.materials enable row level security;
alter table public.summaries enable row level security;
grant select, insert, update, delete on public.subjects, public.materials, public.summaries to authenticated;

drop policy if exists "subjects: ler as próprias" on public.subjects;
create policy "subjects: ler as próprias" on public.subjects
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "subjects: criar as próprias" on public.subjects;
create policy "subjects: criar as próprias" on public.subjects
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "subjects: editar as próprias" on public.subjects;
create policy "subjects: editar as próprias" on public.subjects
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "subjects: apagar as próprias" on public.subjects;
create policy "subjects: apagar as próprias" on public.subjects
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "materials: ler os próprios" on public.materials;
create policy "materials: ler os próprios" on public.materials
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "materials: criar os próprios" on public.materials;
create policy "materials: criar os próprios" on public.materials
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.subjects s where s.id = subject_id and s.user_id = (select auth.uid()))
  );
drop policy if exists "materials: editar os próprios" on public.materials;
create policy "materials: editar os próprios" on public.materials
  for update to authenticated using ((select auth.uid()) = user_id) with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.subjects s where s.id = subject_id and s.user_id = (select auth.uid()))
  );
drop policy if exists "materials: apagar os próprios" on public.materials;
create policy "materials: apagar os próprios" on public.materials
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Resumo precisa de update: "gerar de novo" substitui o resumo existente (upsert).
drop policy if exists "summaries: ler os próprios" on public.summaries;
create policy "summaries: ler os próprios" on public.summaries
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "summaries: criar os próprios" on public.summaries;
create policy "summaries: criar os próprios" on public.summaries
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.subjects s where s.id = subject_id and s.user_id = (select auth.uid()))
  );
drop policy if exists "summaries: editar os próprios" on public.summaries;
create policy "summaries: editar os próprios" on public.summaries
  for update to authenticated using ((select auth.uid()) = user_id) with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.subjects s where s.id = subject_id and s.user_id = (select auth.uid()))
  );
drop policy if exists "summaries: apagar os próprios" on public.summaries;
create policy "summaries: apagar os próprios" on public.summaries
  for delete to authenticated using ((select auth.uid()) = user_id);
