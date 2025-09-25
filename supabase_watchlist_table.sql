-- Watchlist table for storing per-user symbols
-- Creates table, unique constraint, and strict RLS policies

-- 1) Table
create table if not exists public.watchlist (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now()
);

-- 2) Uniqueness: a user cannot store the same symbol twice
create unique index if not exists watchlist_user_symbol_unique
  on public.watchlist (user_id, symbol);

-- 3) RLS
alter table public.watchlist enable row level security;

-- Select only own rows
create policy if not exists "watchlist_select_own"
  on public.watchlist for select
  using (auth.uid() = user_id);

-- Insert only for self
create policy if not exists "watchlist_insert_self"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

-- Update only own rows (not commonly used, but future-proof)
create policy if not exists "watchlist_update_own"
  on public.watchlist for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Delete only own rows
create policy if not exists "watchlist_delete_own"
  on public.watchlist for delete
  using (auth.uid() = user_id);

-- Optional: Helpful view for debugging in SQL editor
-- select * from public.watchlist where user_id = auth.uid();

