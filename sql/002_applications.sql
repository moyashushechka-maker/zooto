-- Заявки на реєстрацію заводчиків і притулків + сховище для документів

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text check (type in ('breeder','shelter')) not null,
  status text check (status in ('pending','approved','rejected')) not null default 'pending',
  full_name text,
  city text,
  contact text,
  shelter_status text, -- 'official' | 'volunteer' (тільки для притулків)
  passport_doc_path text,
  proof_doc_type text check (proof_doc_type in ('club_card','pedigree','diploma')), -- тільки для заводчиків
  proof_doc_path text,
  reject_reason text,
  created_at timestamptz default now()
);

alter table public.applications enable row level security;

drop policy if exists "Users can view own applications" on public.applications;
create policy "Users can view own applications"
  on public.applications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own applications" on public.applications;
create policy "Users can insert own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

-- Приватне сховище для фото документів (паспорт, членський квиток, родовід, диплом)
insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload their own docs" on storage.objects;
create policy "Users can upload their own docs"
  on storage.objects for insert
  with check (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can view their own docs" on storage.objects;
create policy "Users can view their own docs"
  on storage.objects for select
  using (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);
