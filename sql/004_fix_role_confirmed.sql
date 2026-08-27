-- Виправлення: role_confirmed раніше ставав true одразу при реєстрації
-- заводчика/притулку (ще до подачі заявки), тому вибір "розплідник/приватний/
-- екзот" міг взагалі не показатись, якщо в проєкті увімкнено підтвердження email.
-- Тепер role_confirmed = true одразу лише для покупців (їм нічого підтверджувати),
-- а для заводчиків і притулків стає true тільки після реальної подачі заявки.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, role_confirmed, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'buyer'),
    coalesce(new.raw_user_meta_data->>'role', '') = 'buyer',
    coalesce(new.raw_user_meta_data->>'display_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;
