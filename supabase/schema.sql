-- ============================================================
-- Nossa Órbita — schema completo do Supabase
-- Rode este arquivo inteiro em: Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. PROFILES
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  invite_code text unique,
  partner_id uuid references public.profiles(id) on delete set null,
  anniversary_date date,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "ver meu perfil e do meu par"
  on public.profiles for select
  using (id = auth.uid() or partner_id = auth.uid());

create policy "atualizar meu proprio perfil"
  on public.profiles for update
  using (id = auth.uid());

-- Gera um código curto tipo "AB12CD"
create or replace function public.generate_invite_code()
returns text language sql as $$
  select upper(substr(md5(random()::text), 1, 6));
$$;

-- Cria automaticamente uma linha em profiles quando um novo usuário se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, invite_code)
  values (new.id, split_part(new.email, '@', 1), public.generate_invite_code());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC para conectar os dois perfis usando o código de convite
create or replace function public.pair_with_code(code text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  target_id uuid;
begin
  select id into target_id from public.profiles where invite_code = code;

  if target_id is null then
    raise exception 'invite code not found';
  end if;

  if target_id = auth.uid() then
    raise exception 'you cannot pair with yourself';
  end if;

  update public.profiles set partner_id = target_id where id = auth.uid();
  update public.profiles set partner_id = auth.uid() where id = target_id;
end;
$$;

-- RPC pra gravar a data do pedido de namoro nos dois perfis do casal de uma vez
-- (é um dado do casal, não de cada pessoa — os dois têm que ver o mesmo valor)
create or replace function public.set_anniversary_date(new_date date)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  my_partner uuid;
begin
  select partner_id into my_partner from public.profiles where id = auth.uid();
  update public.profiles set anniversary_date = new_date where id = auth.uid();
  if my_partner is not null then
    update public.profiles set anniversary_date = new_date where id = my_partner;
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 2. LOCATIONS (localização em tempo real)
-- ------------------------------------------------------------
create table if not exists public.locations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz default now()
);

alter table public.locations enable row level security;

create policy "ver minha localizacao e do meu par"
  on public.locations for select
  using (
    user_id = auth.uid()
    or user_id = (select partner_id from public.profiles where id = auth.uid())
  );

create policy "inserir minha localizacao"
  on public.locations for insert
  with check (user_id = auth.uid());

create policy "atualizar minha localizacao"
  on public.locations for update
  using (user_id = auth.uid());

-- ------------------------------------------------------------
-- 3. MESSAGES (mensagens rápidas / notificações)
-- ------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  body text not null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "ver mensagens que enviei ou recebi"
  on public.messages for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "enviar mensagem"
  on public.messages for insert
  with check (sender_id = auth.uid());

-- ------------------------------------------------------------
-- 4. TRIPS + TRIP_IMAGES (mural de viagens)
-- ------------------------------------------------------------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade default auth.uid(),
  partner_id uuid,
  title text not null,
  trip_date date,
  description text,
  cover_image_url text,
  created_at timestamptz default now()
);

-- Preenche partner_id automaticamente ao criar a viagem, para os dois enxergarem
create or replace function public.set_trip_partner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.owner_id := auth.uid();
  select partner_id into new.partner_id from public.profiles where id = auth.uid();
  return new;
end;
$$;

drop trigger if exists before_trip_insert on public.trips;
create trigger before_trip_insert
  before insert on public.trips
  for each row execute procedure public.set_trip_partner();

alter table public.trips enable row level security;

create policy "ver viagens do casal"
  on public.trips for select
  using (owner_id = auth.uid() or partner_id = auth.uid());

create policy "criar viagem"
  on public.trips for insert
  with check (true); -- owner_id/partner_id são definidos pelo trigger acima

create policy "editar viagem do casal"
  on public.trips for update
  using (owner_id = auth.uid() or partner_id = auth.uid());

create policy "apagar viagem do casal"
  on public.trips for delete
  using (owner_id = auth.uid() or partner_id = auth.uid());

create table if not exists public.trip_images (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade,
  image_url text not null,
  created_at timestamptz default now()
);

alter table public.trip_images enable row level security;

create policy "ver fotos das viagens do casal"
  on public.trip_images for select
  using (
    trip_id in (select id from public.trips where owner_id = auth.uid() or partner_id = auth.uid())
  );

create policy "adicionar foto a viagem do casal"
  on public.trip_images for insert
  with check (
    trip_id in (select id from public.trips where owner_id = auth.uid() or partner_id = auth.uid())
  );

create policy "apagar foto de viagem do casal"
  on public.trip_images for delete
  using (
    trip_id in (select id from public.trips where owner_id = auth.uid() or partner_id = auth.uid())
  );

-- ------------------------------------------------------------
-- 4b. MOVIES (lista de filmes compartilhada)
-- ------------------------------------------------------------
create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade default auth.uid(),
  partner_id uuid,
  title text not null,
  genre text not null,
  owner_rating smallint not null check (owner_rating between 1 and 10),
  partner_rating smallint check (partner_rating between 1 and 10),
  tmdb_id integer,
  poster_path text,
  overview text,
  created_at timestamptz default now()
);

-- Preenche partner_id automaticamente ao cadastrar o filme, igual às viagens
create or replace function public.set_movie_partner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.owner_id := auth.uid();
  select partner_id into new.partner_id from public.profiles where id = auth.uid();
  return new;
end;
$$;

drop trigger if exists before_movie_insert on public.movies;
create trigger before_movie_insert
  before insert on public.movies
  for each row execute procedure public.set_movie_partner();

alter table public.movies enable row level security;

create policy "ver filmes do casal"
  on public.movies for select
  using (owner_id = auth.uid() or partner_id = auth.uid());

create policy "cadastrar filme"
  on public.movies for insert
  with check (true); -- owner_id/partner_id são definidos pelo trigger acima

create policy "avaliar filme do casal"
  on public.movies for update
  using (owner_id = auth.uid() or partner_id = auth.uid());

create policy "apagar filme do casal"
  on public.movies for delete
  using (owner_id = auth.uid() or partner_id = auth.uid());

alter publication supabase_realtime add table public.movies;

-- ------------------------------------------------------------
-- 4c. GAME_SESSIONS (jogos rápidos em tempo real, ex: jogo da velha)
-- ------------------------------------------------------------
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  game text not null,
  owner_id uuid references public.profiles(id) on delete cascade default auth.uid(),
  partner_id uuid,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create or replace function public.set_game_partner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.owner_id := auth.uid();
  select partner_id into new.partner_id from public.profiles where id = auth.uid();
  return new;
end;
$$;

drop trigger if exists before_game_insert on public.game_sessions;
create trigger before_game_insert
  before insert on public.game_sessions
  for each row execute procedure public.set_game_partner();

alter table public.game_sessions enable row level security;

create policy "ver jogos do casal"
  on public.game_sessions for select
  using (owner_id = auth.uid() or partner_id = auth.uid());

create policy "criar jogo"
  on public.game_sessions for insert
  with check (true);

create policy "jogar e reiniciar jogo do casal"
  on public.game_sessions for update
  using (owner_id = auth.uid() or partner_id = auth.uid());

alter publication supabase_realtime add table public.game_sessions;

-- ------------------------------------------------------------
-- 5. PUSH_SUBSCRIPTIONS (notificações push reais)
-- ------------------------------------------------------------
create table if not exists public.push_subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  subscription jsonb not null,
  updated_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

create policy "gerenciar minha propria subscription"
  on public.push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- 6. ADMIN: apagar usuario/casal (uso manual pelo SQL Editor)
-- ------------------------------------------------------------
-- storage.objects pertence ao Supabase (supabase_storage_admin), entao nao da
-- pra colocar "on delete cascade" na FK dele. Essa funcao contorna isso: ela
-- roda como dona do schema public, entao tem permissao de DELETE (mas nao de
-- ALTER) nas tabelas internas, e apaga storage + auth.users numa chamada so.
-- Uso: select public.admin_delete_user('uuid-do-usuario');
create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from storage.objects where owner = target_id;
  delete from auth.users where id = target_id;
end;
$$;

-- ------------------------------------------------------------
-- 7. REALTIME
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.locations;
alter publication supabase_realtime add table public.messages;

-- ------------------------------------------------------------
-- 8. STORAGE BUCKETS (rode também pelo Dashboard > Storage se preferir)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('trips', 'trips', true)
  on conflict (id) do nothing;

create policy "leitura publica avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "upload avatars autenticado"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "leitura publica trips"
  on storage.objects for select
  using (bucket_id = 'trips');

create policy "upload trips autenticado"
  on storage.objects for insert
  with check (bucket_id = 'trips' and auth.role() = 'authenticated');

create policy "apagar trips autenticado"
  on storage.objects for delete
  using (bucket_id = 'trips' and auth.role() = 'authenticated');
