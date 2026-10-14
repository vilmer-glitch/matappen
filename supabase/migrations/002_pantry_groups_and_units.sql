-- Step 2b: only two groups (pantry, fridge) besides staples, and a locked unit per item (g, ml, pcs).
-- Staples have no amount. Other items only have an amount; 0 means out of stock.
-- Run this once in Supabase: SQL Editor → New query → paste → Run.

-- Categories: pantry or fridge (fridge includes the freezer)
alter table public.items drop constraint items_category_check;
update public.items
  set category = case when category in ('produce', 'meat_fish', 'dairy_eggs', 'frozen') then 'fridge' else 'pantry' end;
alter table public.items alter column category set default 'pantry';
alter table public.items add constraint items_category_check check (category in ('pantry', 'fridge'));

-- Units: convert existing amounts to g, ml or pcs
alter table public.items drop constraint items_unit_check;
update public.items set quantity = quantity * 1000, unit = 'g' where unit = 'kg';
update public.items set quantity = quantity * 1000, unit = 'ml' where unit = 'l';
update public.items set quantity = quantity * 100, unit = 'ml' where unit = 'dl';
update public.items set unit = 'pcs' where unit = 'pkg';
update public.items set quantity = null, unit = null where unit in ('tbsp', 'tsp');
update public.items set unit = 'g' where unit is null and not is_staple;

-- Staples never have an amount
update public.items set quantity = null, unit = null, status = 'in_stock' where is_staple;

alter table public.items add constraint items_unit_check check (unit in ('g', 'ml', 'pcs'));
alter table public.items add constraint items_unit_required check (is_staple or unit is not null);

-- Status now follows the amount
update public.items set status = case when quantity = 0 then 'out' else 'in_stock' end where not is_staple;
