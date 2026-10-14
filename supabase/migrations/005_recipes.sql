-- Step 3: recipes and their ingredients
-- Run this once in Supabase: SQL Editor → paste → Run.

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  servings integer not null default 4 check (servings > 0),
  instructions text,
  link text,
  note text,
  created_at timestamptz not null default now()
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  recipe_id uuid not null references public.recipes on delete cascade,
  -- An item that is used in a recipe can't be deleted from the pantry
  item_id uuid not null references public.items on delete restrict,
  quantity numeric check (quantity >= 0),
  unit text check (unit in ('g', 'kg', 'ml', 'dl', 'l', 'tbsp', 'tsp', 'pinch', 'pcs')),
  position integer not null default 0,
  unique (recipe_id, item_id)
);

create index recipe_ingredients_recipe_idx on public.recipe_ingredients (recipe_id);
create index recipe_ingredients_item_idx on public.recipe_ingredients (item_id);

-- Row Level Security: each user only sees and changes their own recipes
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;

create policy "Users can read own recipes" on public.recipes
  for select using (auth.uid() = user_id);
create policy "Users can insert own recipes" on public.recipes
  for insert with check (auth.uid() = user_id);
create policy "Users can update own recipes" on public.recipes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own recipes" on public.recipes
  for delete using (auth.uid() = user_id);

create policy "Users can read own ingredients" on public.recipe_ingredients
  for select using (auth.uid() = user_id);
create policy "Users can insert own ingredients" on public.recipe_ingredients
  for insert with check (auth.uid() = user_id);
create policy "Users can update own ingredients" on public.recipe_ingredients
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own ingredients" on public.recipe_ingredients
  for delete using (auth.uid() = user_id);
