-- Step 5: planned meals and the shopping list
-- Run this once in Supabase: SQL Editor → paste → Run.

-- Dishes picked for the coming period. No date; cooked_at is set when it has been cooked.
create table public.planned_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  recipe_id uuid not null references public.recipes on delete cascade,
  servings integer not null check (servings > 0),
  cooked_at timestamptz,
  created_at timestamptz not null default now()
);

-- Items on the shopping list. Items needed by planned meals are calculated by the app;
-- a row here stores that it is checked or that the amount was changed.
-- Rows with is_manual = true were added by hand.
create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  item_id uuid not null references public.items on delete cascade,
  quantity numeric check (quantity >= 0),
  is_manual boolean not null default false,
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

-- Row Level Security: each user only sees and changes their own rows
alter table public.planned_meals enable row level security;
alter table public.shopping_list_items enable row level security;

create policy "Users can read own planned meals" on public.planned_meals
  for select using (auth.uid() = user_id);
create policy "Users can insert own planned meals" on public.planned_meals
  for insert with check (auth.uid() = user_id);
create policy "Users can update own planned meals" on public.planned_meals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own planned meals" on public.planned_meals
  for delete using (auth.uid() = user_id);

create policy "Users can read own shopping list" on public.shopping_list_items
  for select using (auth.uid() = user_id);
create policy "Users can insert own shopping list" on public.shopping_list_items
  for insert with check (auth.uid() = user_id);
create policy "Users can update own shopping list" on public.shopping_list_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own shopping list" on public.shopping_list_items
  for delete using (auth.uid() = user_id);
