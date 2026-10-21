-- Remembers which of the app's built-in recipes a personal recipe was copied from.
-- The app's recipes themselves live in the code (src/data/appRecipes.ts), so new ones need no SQL.
-- Run this once in Supabase: SQL Editor → paste → Run.

alter table public.recipes add column app_key text;

-- You can only have one personal copy of each app recipe
create unique index recipes_user_app_key_idx on public.recipes (user_id, app_key) where app_key is not null;
