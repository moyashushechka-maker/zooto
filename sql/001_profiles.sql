-- Таблиця профілів користувачів (доповнює вбудовану auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  role text check (role in ('buyer','breeder','shelter')) not null default 'buyer',
  role_confirmed boolean not null default false,
  display_name text,
  city text,
  created_at timestamptz default now()
);

-- Захист: кожен бачить і редагує лише свій профіль
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Автоматично створює рядок у profiles одразу після реєстрації користувача.
-- role_confirmed = true тільки якщо роль передали явно (email-реєстрація через
-- нашу форму). Для входу через Google роль ще невідома — попросимо обрати
-- її одразу після першого входу.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, role_confirmed, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'buyer'),
    (new.raw_user_meta_data->>'role') is not null,
    coalesce(new.raw_user_meta_data->>'display_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
