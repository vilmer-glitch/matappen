-- Allow liter as a locked unit (e.g. milk)
-- Run this once in Supabase: SQL Editor → paste → Run.

alter table public.items drop constraint items_unit_check;
alter table public.items add constraint items_unit_check check (unit in ('g', 'ml', 'l', 'pcs'));
