-- Default staples for every user, and a flag that tells them apart from your own items.
-- Before this, the staples were only added for accounts that existed when 001 was run.
-- Run this once in Supabase: SQL Editor → paste → Run.

alter table public.items add column is_default boolean not null default false;

-- Adds the default staples for one user. Items they already have (same name) are left alone.
create or replace function public.seed_default_items(target_user uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.items (user_id, name, category, is_staple, is_default)
  select target_user, s.name, s.category, true, true
  from (values
    ('Salt', 'pantry'),
    ('Svartpeppar', 'pantry'),
    ('Olivolja', 'pantry'),
    ('Rapsolja', 'pantry'),
    ('Smör', 'fridge'),
    ('Strösocker', 'pantry'),
    ('Vetemjöl', 'pantry'),
    ('Vinäger', 'pantry'),
    ('Buljong', 'pantry'),
    ('Paprikapulver', 'pantry'),
    ('Spiskummin', 'pantry'),
    ('Oregano', 'pantry'),
    ('Basilika', 'pantry'),
    ('Timjan', 'pantry'),
    ('Chiliflakes', 'pantry'),
    ('Curry', 'pantry'),
    ('Kanel', 'pantry'),
    ('Vitlökspulver', 'pantry'),
    ('Lagerblad', 'pantry')
  ) as s(name, category)
  on conflict do nothing;
$$;

-- Only the database itself may call it
revoke execute on function public.seed_default_items(uuid) from public, anon, authenticated;

-- New accounts get the default staples automatically
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_items(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Existing accounts: add missing staples, and mark the ones they already have as default
select public.seed_default_items(id) from auth.users;

update public.items
set is_default = true
where is_staple
  and name in ('Salt', 'Svartpeppar', 'Olivolja', 'Rapsolja', 'Smör', 'Strösocker', 'Vetemjöl', 'Vinäger',
               'Buljong', 'Paprikapulver', 'Spiskummin', 'Oregano', 'Basilika', 'Timjan', 'Chiliflakes',
               'Curry', 'Kanel', 'Vitlökspulver', 'Lagerblad');
