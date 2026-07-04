-- ============================================================================
-- Naizz v4 — fix DM/invite creation + add 1:1 call signaling (ring/accept/decline).
-- Run AFTER schema.sql, schema_v2.sql, schema_v3.sql.
-- ============================================================================

-- ---- FIX: creator can read a conversation they just made ---------------------
-- getOrCreateDM does insert(conversation).select(); the old SELECT policy only
-- allowed members, but no members exist yet at that instant -> invite failed.
drop policy if exists "members read conversations" on public.conversations;
create policy "members read conversations" on public.conversations
  for select using (public.is_member(id) or created_by = auth.uid());

-- ---- 1:1 call signaling ------------------------------------------------------
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null references public.profiles (id) on delete cascade,
  callee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'ringing',  -- ringing | accepted | declined | ended | missed
  created_at timestamptz not null default now()
);
create index if not exists calls_callee_idx on public.calls (callee_id, created_at desc);
create index if not exists calls_caller_idx on public.calls (caller_id, created_at desc);

alter table public.calls enable row level security;
create policy "call parties read" on public.calls for select
  using (auth.uid() = caller_id or auth.uid() = callee_id);
create policy "caller creates call" on public.calls for insert
  with check (auth.uid() = caller_id);
create policy "call parties update" on public.calls for update
  using (auth.uid() = caller_id or auth.uid() = callee_id);

alter publication supabase_realtime add table public.calls;
