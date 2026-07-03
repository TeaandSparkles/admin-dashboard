-- ============================================================================
-- STARSHIP STORYTIME — FULL CLEANUP + FINAL BACKEND SETUP
-- Idempotent · Safe to run more than once
-- ============================================================================
-- Applies the evolved business model (coins as loyalty rewards, discount codes,
-- streaks). Removes vestigial user-to-user referral columns/tables.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. RLS helper functions
-- ---------------------------------------------------------------------------

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_accounting() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'accounting');
$$;

create or replace function public.is_management() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'management');
$$;

create or replace function public.is_admin_or_management() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'management'));
$$;


-- ---------------------------------------------------------------------------
-- 2. Fixed auth mirror trigger (supports anonymous guest users)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  short_id text := substring(replace(new.id::text, '-', '') from 1 for 8);
begin
  insert into public.users (id, email, username, role, referral_code)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'name',
      case
        when new.email is not null and new.email <> ''
          then split_part(new.email, '@', 1)
        else 'guest_' || short_id
      end
    ),
    'user',
    upper(short_id)
  ) on conflict (id) do nothing;
  return new;
exception when others then
  return new;  -- never block auth signup if mirror fails
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();


-- ---------------------------------------------------------------------------
-- 3. Settings: add streak + coin fields, drop referral reward fields
-- ---------------------------------------------------------------------------

alter table public.settings
  add column if not exists streak_enabled boolean not null default false,
  add column if not exists streak_nights_required int not null default 5,
  add column if not exists streak_bonus_chapters int not null default 2,
  add column if not exists coins_per_chapter int not null default 5;

alter table public.settings
  drop column if exists referral_signup_reward,
  drop column if exists referral_purchase_reward;


-- ---------------------------------------------------------------------------
-- 4. Streak tables
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
-- 5. Chapter claims (users spend earned coins to unlock a chapter)
-- ---------------------------------------------------------------------------

create table if not exists public.chapter_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  coins_spent int not null,
  claimed_at timestamptz not null default now(),
  unique (user_id, chapter_id)
);
create index if not exists chapter_claims_user_idx on public.chapter_claims(user_id);


-- ---------------------------------------------------------------------------
-- 6. Discount codes (admin-issued promo codes for % off books)
-- ---------------------------------------------------------------------------

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent int not null check (discount_percent between 1 and 100),
  applies_to_novel_id uuid references public.novels(id) on delete cascade,
  applies_to_story_id uuid references public.stories(id) on delete cascade,
  max_uses int,                     -- null = unlimited
  times_used int not null default 0,
  valid_until timestamptz,          -- null = no expiration
  created_by_user_id uuid references public.users(id),
  notes text,                        -- admin note (who it's for, etc.)
  created_at timestamptz not null default now()
);
create index if not exists discount_codes_code_idx on public.discount_codes(code);


-- ---------------------------------------------------------------------------
-- 7. Drop wrong-shape referrals table (was user-to-user, replaced by discount_codes)
-- ---------------------------------------------------------------------------

drop table if exists public.referrals cascade;


-- ---------------------------------------------------------------------------
-- 8. Auto-update users.coin_balance when a coin_transaction is inserted
-- ---------------------------------------------------------------------------

create or replace function public.apply_coin_transaction()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.users
  set coin_balance = coin_balance + new.amount
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_coin_transaction_insert on public.coin_transactions;
create trigger on_coin_transaction_insert
  after insert on public.coin_transactions
  for each row execute function public.apply_coin_transaction();


-- ---------------------------------------------------------------------------
-- 9. Streak update trigger
-- ---------------------------------------------------------------------------

create or replace function public.update_streak_on_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  existing public.listening_streaks;
  config public.settings;
  new_streak int;
begin
  select * into config from public.settings limit 1;
  if not coalesce(config.streak_enabled, false) then return new; end if;

  select * into existing from public.listening_streaks where user_id = new.user_id;
  if existing.user_id is null then
    insert into public.listening_streaks (user_id, current_streak, longest_streak, last_listened_date)
    values (new.user_id, 1, 1, new.date_key);
    return new;
  end if;

  if existing.last_listened_date = new.date_key then return new; end if;

  if new.date_key - coalesce(existing.last_listened_date, new.date_key - 999) = 1 then
    new_streak := existing.current_streak + 1;
  else
    new_streak := 1;
  end if;

  update public.listening_streaks
  set current_streak = new_streak,
      longest_streak = greatest(existing.longest_streak, new_streak),
      last_listened_date = new.date_key,
      total_rewards_earned = existing.total_rewards_earned +
        (case when coalesce(config.streak_nights_required, 5) > 0
              and new_streak % coalesce(config.streak_nights_required, 5) = 0
              then 1 else 0 end),
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
-- 10. RLS policies on new tables
-- ---------------------------------------------------------------------------

alter table public.listening_streaks enable row level security;
alter table public.streak_events enable row level security;
alter table public.chapter_claims enable row level security;
alter table public.discount_codes enable row level security;

-- Admin/management full access on new tables
drop policy if exists admin_all on public.listening_streaks;
create policy admin_all on public.listening_streaks
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

drop policy if exists admin_all on public.streak_events;
create policy admin_all on public.streak_events
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

drop policy if exists admin_all on public.chapter_claims;
create policy admin_all on public.chapter_claims
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

drop policy if exists admin_all on public.discount_codes;
create policy admin_all on public.discount_codes
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

-- User-level policies
drop policy if exists user_read_own on public.listening_streaks;
create policy user_read_own on public.listening_streaks
  for select using (auth.uid() = user_id);

drop policy if exists user_read_own on public.streak_events;
create policy user_read_own on public.streak_events
  for select using (auth.uid() = user_id);
drop policy if exists user_insert_own on public.streak_events;
create policy user_insert_own on public.streak_events
  for insert with check (auth.uid() = user_id);

drop policy if exists user_read_own on public.chapter_claims;
create policy user_read_own on public.chapter_claims
  for select using (auth.uid() = user_id);
drop policy if exists user_insert_own on public.chapter_claims;
create policy user_insert_own on public.chapter_claims
  for insert with check (auth.uid() = user_id);

-- Discount codes readable by any signed-in user (for redemption)
drop policy if exists anyone_read on public.discount_codes;
create policy anyone_read on public.discount_codes
  for select using (auth.uid() is not null);


-- ---------------------------------------------------------------------------
-- 11. Verify — should return the new pieces
-- ---------------------------------------------------------------------------

select 'listening_streaks' as new_thing where exists (
  select 1 from information_schema.tables where table_schema = 'public' and table_name = 'listening_streaks'
)
union all select 'streak_events' where exists (
  select 1 from information_schema.tables where table_schema = 'public' and table_name = 'streak_events'
)
union all select 'chapter_claims' where exists (
  select 1 from information_schema.tables where table_schema = 'public' and table_name = 'chapter_claims'
)
union all select 'discount_codes' where exists (
  select 1 from information_schema.tables where table_schema = 'public' and table_name = 'discount_codes'
);

select 'coins_per_chapter setting =' as check_setting,
       (select coins_per_chapter from public.settings limit 1)::text as value
union all select 'streak_enabled', (select streak_enabled from public.settings limit 1)::text;
