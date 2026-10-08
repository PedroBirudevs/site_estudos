-- Rode este arquivo uma vez no Supabase: Dashboard > SQL Editor > New query > colar > Run.

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);
create index if not exists materials_subject_idx on materials(subject_id);

create table if not exists summaries (
  subject_id uuid primary key references subjects(id) on delete cascade,
  content text not null,
  material_count int not null,
  updated_at timestamptz not null default now()
);

-- O site acessa o banco só pelo servidor, com a service role key.
-- Ligar RLS sem políticas bloqueia qualquer acesso com a chave pública (anon).
alter table subjects enable row level security;
alter table materials enable row level security;
alter table summaries enable row level security;

-- Bucket privado para os arquivos (PDFs, imagens, textos).
insert into storage.buckets (id, name, public)
values ('materiais', 'materiais', false)
on conflict (id) do nothing;
