-- ============================================================================
-- Naizz v2 — adds follows, voice replies, post images, DMs, notifications,
-- live rooms, and an images bucket. Run AFTER schema.sql in the SQL editor.
-- Safe to re-run except for `create policy` lines (they error if they exist).
-- ============================================================================

-- ---- posts: optional attached image ----------------------------------------
alter table public.posts add column if not exists image_path text;

-- ---- follows ---------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);
alter table public.follows enable row level security;
create policy "follows viewable by everyone" on public.follows for select using (true);
create policy "users follow" on public.follows for insert with check (auth.uid() = follower_id);
create policy "users unfollow" on public.follows for delete using (auth.uid() = follower_id);

-- ---- voice replies on posts ------------------------------------------------
create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  audio_path text not null,
  duration_seconds int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists replies_post_idx on public.replies (post_id, created_at);
alter table public.replies enable row level security;
create policy "replies viewable by everyone" on public.replies for select using (true);
create policy "users insert own replies" on public.replies for insert with check (auth.uid() = user_id);
create policy "users delete own replies" on public.replies for delete using (auth.uid() = user_id);

-- ---- notifications ---------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,                 -- 'like' | 'follow' | 'reply'
  post_id uuid references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  read boolean not null default false
);
create index if not exists notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
alter table public.notifications enable row level security;
create policy "recipients read notifications" on public.notifications for select using (auth.uid() = recipient_id);
create policy "actors create notifications" on public.notifications for insert with check (auth.uid() = actor_id);
create policy "recipients update notifications" on public.notifications for update using (auth.uid() = recipient_id);

-- ---- conversations + members + messages (DMs) ------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'text',  -- 'text' | 'voice'
  body text,
  audio_path text,
  duration_seconds int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists messages_convo_idx on public.messages (conversation_id, created_at);

-- membership helper (security definer avoids RLS recursion)
create or replace function public.is_member(cid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.conversation_members m
    where m.conversation_id = cid and m.user_id = auth.uid()
  );
$$;
grant execute on function public.is_member(uuid) to authenticated;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "members read conversations" on public.conversations for select using (public.is_member(id));
create policy "users create conversations" on public.conversations for insert with check (auth.uid() = created_by);

create policy "members read membership" on public.conversation_members for select using (public.is_member(conversation_id));
create policy "add self or as member" on public.conversation_members for insert
  with check (auth.uid() = user_id or public.is_member(conversation_id));
create policy "update own membership" on public.conversation_members for update using (auth.uid() = user_id);

create policy "members read messages" on public.messages for select using (public.is_member(conversation_id));
create policy "members send messages" on public.messages for insert
  with check (sender_id = auth.uid() and public.is_member(conversation_id));

-- bump conversation timestamp on new message
create or replace function public.bump_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = now() where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists messages_bump on public.messages;
create trigger messages_bump after insert on public.messages
  for each row execute function public.bump_conversation();

-- ---- live rooms ------------------------------------------------------------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  is_live boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'listener',   -- 'host' | 'speaker' | 'listener'
  muted boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
create policy "rooms viewable by everyone" on public.rooms for select using (true);
create policy "users host rooms" on public.rooms for insert with check (auth.uid() = host_id);
create policy "host updates room" on public.rooms for update using (auth.uid() = host_id);
create policy "room members viewable" on public.room_members for select using (true);
create policy "users join rooms" on public.room_members for insert with check (auth.uid() = user_id);
create policy "users update own room state" on public.room_members for update using (auth.uid() = user_id);
create policy "users leave rooms" on public.room_members for delete using (auth.uid() = user_id);

-- ---- images bucket (post images) -------------------------------------------
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;
create policy "images public read" on storage.objects for select using (bucket_id = 'images');
create policy "images owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "images owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---- realtime: stream changes for live UI ----------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.notifications;
