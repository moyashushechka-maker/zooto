-- Тварини-батьки заводчиків + коди дитинчат (метрики або чипи)

create table if not exists public.parent_animals (
  id uuid primary key default gen_random_uuid(),
  breeder_id uuid references auth.users(id) on delete cascade not null,
  species text check (species in ('dog','cat')) not null,
  gender text check (gender in ('male','female')) not null,
  official_name text not null,
  home_name text,
  breed text not null,
  birth_date date,
  color text,
  ems_code text,
  photo_path text,
  pedigree_doc_path text,
  vetpassport_doc_path text,
  status text check (status in ('pending','verified','rejected')) not null default 'pending',
  created_at timestamptz default now()
);

alter table public.parent_animals enable row level security;

drop policy if exists "Breeders manage own parents" on public.parent_animals;
create policy "Breeders manage own parents"
  on public.parent_animals for all
  using (auth.uid() = breeder_id)
  with check (auth.uid() = breeder_id);

create table if not exists public.litter_codes (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.parent_animals(id) on delete cascade not null,
  code text not null,
  code_type text check (code_type in ('metric','chip')) not null,
  is_used boolean not null default false,
  created_at timestamptz default now()
);

alter table public.litter_codes enable row level security;

drop policy if exists "Breeders manage own litter codes" on public.litter_codes;
create policy "Breeders manage own litter codes"
  on public.litter_codes for all
  using (exists (select 1 from public.parent_animals p where p.id = litter_codes.parent_id and p.breeder_id = auth.uid()))
  with check (exists (select 1 from public.parent_animals p where p.id = litter_codes.parent_id and p.breeder_id = auth.uid()));
