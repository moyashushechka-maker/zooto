-- Роль адміністратора + доступ адмінки до РЕАЛЬНИХ заявок і тварин-батьків
-- (а не лише своїх власних, як для звичайних користувачів)

alter table public.profiles add column if not exists is_admin boolean not null default false;

-- SECURITY DEFINER-функція: обходить RLS, щоб уникнути нескінченної рекурсії
-- при перевірці "чи я адмін" всередині ж політик на profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Адмін бачить і редагує ВСІ заявки (а не тільки свої)
drop policy if exists "Admins manage all applications" on public.applications;
create policy "Admins manage all applications"
  on public.applications for all
  using (public.is_admin())
  with check (public.is_admin());

-- Адмін бачить і редагує ВСІХ тварин-батьків
drop policy if exists "Admins manage all parent animals" on public.parent_animals;
create policy "Admins manage all parent animals"
  on public.parent_animals for all
  using (public.is_admin())
  with check (public.is_admin());

alter table public.parent_animals add column if not exists reject_reason text;

-- Адмін бачить усі профілі (щоб показати ім'я/email заявника)
drop policy if exists "Admins view all profiles" on public.profiles;
create policy "Admins view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Адмін може відкривати завантажені документи будь-кого (паспорти, сертифікати тощо)
drop policy if exists "Admins can view any docs" on storage.objects;
create policy "Admins can view any docs"
  on storage.objects for select
  using (bucket_id = 'verification-docs' and public.is_admin());

-- ОСТАННІЙ КРОК (виконати вручну, один раз):
-- Заміни email нижче на свій реальний email в Zooto і запусти окремо:
--
-- update public.profiles set is_admin = true where email = 'твій-email@приклад.com';
