-- ============================================================================
-- LISTENING STREAKS — post-purchase family loyalty (audio + reading only)
-- ============================================================================
-- Idempotent; safe to re-run.
-- Rules (from mission spec):
--   • Only audio OR reading counts (NOT visual/video)
--   • Only chapters from PAID series count
--   • 5 nights → 2 bonus episodes (default, configurable in settings)
--   • Streak is per household (user), NOT per series
--   • Multiple family members on same account = one streak
--   • One streak day per calendar date (multiple listens same day = 1)
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Extend settings with streak config
-- ---------------------------------------------------------------------------

alter table public.settings
  add column if not exists streak_enabled boolean not null default false,
  add column if not exists streak_nights_required int not null default 5,
  add column if not exists streak_bonus_chapters int not null default 2;


-- ---------------------------------------------------------------------------
-- 2. Household streak tracker (one row per user)
-- ---------------------------------------------------------------------------

create table if not exists public.listening_streaks (
  user_id uuid primary key references public.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_listened_date date,
  total_rewards_earned int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- 3. Individual streak-eligible listening events
-- ---------------------------------------------------------------------------

create table if not exists public.streak_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  series_id uuid references public.stories(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  mode text not null check (mode in ('audio', 'reading')),
  listened_at timestamptz not null default now(),
  date_key date not null default current_date
);

create index if not exists streak_events_user_date_idx
  on public.streak_events(user_id, date_key desc);


-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------

alter table public.listening_streaks enable row level security;
alter table public.streak_events enable row level security;

-- Admin / management full access
drop policy if exists admin_all on public.listening_streaks;
create policy admin_all on public.listening_streaks
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists management_all on public.listening_streaks;
create policy management_all on public.listening_streaks
  for all using (public.is_management()) with check (public.is_management());
drop policy if exists accounting_read on public.listening_streaks;
create policy accounting_read on public.listening_streaks
  for select using (public.is_accounting());

drop policy if exists admin_all on public.streak_events;
create policy admin_all on public.streak_events
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists management_all on public.streak_events;
create policy management_all on public.streak_events
  for all using (public.is_management()) with check (public.is_management());
drop policy if exists accounting_read on public.streak_events;
create policy accounting_read on public.streak_events
  for select using (public.is_accounting());

-- Users read own streak + insert own events
drop policy if exists user_read_own on public.listening_streaks;
create policy user_read_own on public.listening_streaks
  for select using (auth.uid() = user_id);

drop policy if exists user_read_own on public.streak_events;
create policy user_read_own on public.streak_events
  for select using (auth.uid() = user_id);

drop policy if exists user_insert_own on public.streak_events;
create policy user_insert_own on public.streak_events
  for insert with check (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 5. Trigger: auto-update streak when a streak_event is inserted
-- ---------------------------------------------------------------------------

create or replace function public.update_streak_on_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.listening_streaks;
  config public.settings;
  days_gap int;
  new_streak int;
begin
  -- Read config (single row settings table)
  select * into config from public.settings limit 1;
  if not coalesce(config.streak_enabled, false) then
    return new;
  end if;

  -- Get existing streak row for user
  select * into existing from public.listening_streaks where user_id = new.user_id;

  if existing.user_id is null then
    -- First event ever
    insert into public.listening_streaks (user_id, current_streak, longest_streak, last_listened_date)
    values (new.user_id, 1, 1, new.date_key);
    return new;
  end if;

  -- Same day = no increment
  if existing.last_listened_date = new.date_key then
    return new;
  end if;

  days_gap := new.date_key - coalesce(existing.last_listened_date, new.date_key - 999);

  if days_gap = 1 then
    new_streak := existing.current_streak + 1;
  else
    new_streak := 1;  -- streak broken; start fresh (never shame)
  end if;

  update public.listening_streaks
  set current_streak = new_streak,
      longest_streak = greatest(existing.longest_streak, new_streak),
      last_listened_date = new.date_key,
      total_rewards_earned = existing.total_rewards_earned +
        (case
           when new_streak > 0
             and coalesce(config.streak_nights_required, 5) > 0
             and new_streak % coalesce(config.streak_nights_required, 5) = 0
           then 1
           else 0
         end),
      updated_at = now()
  where user_id = new.user_id;

  return new;
end;
$$;

drop trigger if exists on_streak_event on public.streak_events;
create trigger on_streak_event
  after insert on public.streak_events
  for each row execute function public.update_streak_on_event();


-- ---------------------------------------------------------------------------
-- DONE — verify
-- ---------------------------------------------------------------------------
-- select column_name from information_schema.columns
--   where table_name='settings' and column_name like 'streak%';
-- select table_name from information_schema.tables
--   where table_schema='public' and table_name in ('listening_streaks','streak_events');
