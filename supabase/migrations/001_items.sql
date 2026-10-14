-- Step 2: pantry items
-- Run this once in Supabase: SQL Editor → New query → paste → Run.

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  category text not null default 'other'
    check (category in ('produce', 'meat_fish', 'dairy_eggs', 'bread', 'pantry', 'frozen', 'spices_sauces', 'drinks', 'other')),
  unit text
    check (unit in ('g', 'kg', 'ml', 'dl', 'l', 'pcs', 'pkg', 'tbsp', 'tsp')),
  quantity numeric check (quantity >= 0),
  status text not null default 'in_stock'
    check (status in ('in_stock', 'low', 'out')),
  is_staple boolean not null default false,
  created_at timestamptz not null default now()
);

-- The same item name can only exist once per user (case-insensitive)
create unique index items_user_name_idx on public.items (user_id, lower(name));

-- Row Level Security: each user only sees and changes their own items
alter table public.items enable row level security;

create policy "Users can read own items" on public.items
  for select using (auth.uid() = user_id);
create policy "Users can insert own items" on public.items
  for insert with check (auth.uid() = user_id);
create policy "Users can update own items" on public.items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own items" on public.items
  for delete using (auth.uid() = user_id);

-- Starting staples for every existing user
insert into public.items (user_id, name, category, is_staple)
select u.id, s.name, s.category, true
from auth.users u
cross join (values
  ('Salt', 'spices_sauces'),
  ('Svartpeppar', 'spices_sauces'),
  ('Olivolja', 'pantry'),
  ('Rapsolja', 'pantry'),
  ('Smör', 'dairy_eggs'),
  ('Strösocker', 'pantry'),
  ('Vetemjöl', 'pantry'),
  ('Vinäger', 'spices_sauces'),
  ('Buljong', 'spices_sauces'),
  ('Paprikapulver', 'spices_sauces'),
  ('Spiskummin', 'spices_sauces'),
  ('Oregano', 'spices_sauces'),
  ('Basilika', 'spices_sauces'),
  ('Timjan', 'spices_sauces'),
  ('Chiliflakes', 'spices_sauces'),
  ('Curry', 'spices_sauces'),
  ('Kanel', 'spices_sauces'),
  ('Vitlökspulver', 'spices_sauces'),
  ('Lagerblad', 'spices_sauces')
) as s(name, category)
on conflict do nothing;
