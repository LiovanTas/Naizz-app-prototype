-- ============================================================================
-- Naizz alpha — Supabase schema. Run this in the Supabase SQL editor.
-- Creates profiles, posts, likes, storage bucket + RLS policies, and an RPC
-- to bump play counts.
-- ============================================================================

-- ---- profiles --------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ---- posts -----------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  caption text not null default '',
  audio_path text not null,
  duration_seconds int not null default 0,
  play_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx on public.posts (user_id);

alter table public.posts enable row level security;

create policy "posts are viewable by everyone"
  on public.posts for select using (true);
create policy "users insert own posts"
  on public.posts for insert with check (auth.uid() = user_id);
create policy "users delete own posts"
  on public.posts for delete using (auth.uid() = user_id);

-- ---- likes -----------------------------------------------------------------
create table if not exists public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.likes enable row level security;

create policy "likes are viewable by everyone"
  on public.likes for select using (true);
create policy "users like"
  on public.likes for insert with check (auth.uid() = user_id);
create policy "users unlike"
  on public.likes for delete using (auth.uid() = user_id);

-- ---- play-count RPC (security definer so any viewer can bump it) ------------
create or replace function public.increment_plays(pid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts set play_count = play_count + 1 where id = pid;
$$;

grant execute on function public.increment_plays(uuid) to anon, authenticated;

-- ---- storage bucket for audio ---------------------------------------------
insert into storage.buckets (id, name, public)
values ('voices', 'voices', true)
on conflict (id) do nothing;

create policy "voices public read"
  on storage.objects for select using (bucket_id = 'voices');
create policy "voices owner insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'voices' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "voices owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'voices' and (storage.foldername(name))[1] = auth.uid()::text);
