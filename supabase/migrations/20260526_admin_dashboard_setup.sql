-- ============================================================================
-- ADMIN DASHBOARD SETUP — ROLES, TRIGGERS, RLS POLICIES
-- ============================================================================
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run
-- This is idempotent — safe to run more than once.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. HELPER FUNCTIONS — role checks
-- ---------------------------------------------------------------------------
-- These return TRUE if the currently authenticated user has the given role.
-- Used in every RLS policy below.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_accounting()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role = 'accounting'
  );
$$;

create or replace function public.is_admin_or_accounting()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role in ('admin', 'accounting')
  );
$$;


-- ---------------------------------------------------------------------------
-- 2. AUTO-CREATE users ROW WHEN SOMEONE SIGNS UP
-- ---------------------------------------------------------------------------
-- When a new auth.users row is created (email signup OR OAuth), this trigger
-- automatically creates a matching public.users row with role = 'user'.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, username, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();


-- ---------------------------------------------------------------------------
-- 3. ENABLE RLS ON ALL TABLES
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.novels enable row level security;
alter table public.stories enable row level security;
alter table public.chapters enable row level security;
alter table public.orders enable row level security;
alter table public.shipments enable row level security;
alter table public.payments enable row level security;
alter table public.referrals enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.story_access enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.user_library enable row level security;
alter table public.user_progress enable row level security;
alter table public.audit_logs enable row level security;
alter table public.settings enable row level security;


-- ---------------------------------------------------------------------------
-- 4. ADMIN POLICIES — admins can do EVERYTHING
-- ---------------------------------------------------------------------------
-- One policy per table, granted on all commands (select/insert/update/delete).

do $$
declare
  t text;
  tables text[] := array[
    'users','novels','stories','chapters','orders','shipments','payments',
    'referrals','coin_transactions','story_access','user_entitlements',
    'user_library','user_progress','audit_logs','settings'
  ];
begin
  foreach t in array tables
  loop
    execute format('drop policy if exists admin_all on public.%I', t);
    execute format(
      'create policy admin_all on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      t
    );
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- 5. ACCOUNTING POLICIES — read all + manage money/orders
-- ---------------------------------------------------------------------------
-- Accounting can READ everything (audit purposes) and WRITE to financial tables.

-- Accounting read access on everything
do $$
declare
  t text;
  tables text[] := array[
    'users','novels','stories','chapters','orders','shipments','payments',
    'referrals','coin_transactions','story_access','user_entitlements',
    'user_library','user_progress','audit_logs','settings'
  ];
begin
  foreach t in array tables
  loop
    execute format('drop policy if exists accounting_read on public.%I', t);
    execute format(
      'create policy accounting_read on public.%I for select using (public.is_accounting())',
      t
    );
  end loop;
end $$;

-- Accounting can modify financial / fulfillment tables
drop policy if exists accounting_write_orders on public.orders;
create policy accounting_write_orders on public.orders
  for all using (public.is_accounting()) with check (public.is_accounting());

drop policy if exists accounting_write_shipments on public.shipments;
create policy accounting_write_shipments on public.shipments
  for all using (public.is_accounting()) with check (public.is_accounting());

drop policy if exists accounting_write_payments on public.payments;
create policy accounting_write_payments on public.payments
  for all using (public.is_accounting()) with check (public.is_accounting());

drop policy if exists accounting_write_coins on public.coin_transactions;
create policy accounting_write_coins on public.coin_transactions
  for all using (public.is_accounting()) with check (public.is_accounting());


-- ---------------------------------------------------------------------------
-- 6. END-USER POLICIES — mobile app users can read/write their own data
-- ---------------------------------------------------------------------------

-- USERS: read/update own row
drop policy if exists users_read_own on public.users;
create policy users_read_own on public.users
  for select using (auth.uid() = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.users where id = auth.uid()));
  -- Last clause prevents self-promotion: can't change own role via UPDATE

-- NOVELS / STORIES / CHAPTERS: published content readable by everyone signed in
drop policy if exists novels_read_published on public.novels;
create policy novels_read_published on public.novels
  for select using (auth.uid() is not null and published = true);

drop policy if exists stories_read_published on public.stories;
create policy stories_read_published on public.stories
  for select using (auth.uid() is not null and published = true);

drop policy if exists chapters_read on public.chapters;
create policy chapters_read on public.chapters
  for select using (auth.uid() is not null);

-- ORDERS: read/insert own orders
drop policy if exists orders_read_own on public.orders;
create policy orders_read_own on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders
  for insert with check (auth.uid() = user_id);

-- SHIPMENTS: read shipments for own orders
drop policy if exists shipments_read_own on public.shipments;
create policy shipments_read_own on public.shipments
  for select using (
    order_id in (select id from public.orders where user_id = auth.uid())
  );

-- PAYMENTS: read own payments
drop policy if exists payments_read_own on public.payments;
create policy payments_read_own on public.payments
  for select using (auth.uid() = user_id);

-- REFERRALS: read referrals where the user is involved
drop policy if exists referrals_read_own on public.referrals;
create policy referrals_read_own on public.referrals
  for select using (
    auth.uid() = referrer_user_id or auth.uid() = referred_user_id
  );

-- COIN_TRANSACTIONS: read own transactions only
drop policy if exists coins_read_own on public.coin_transactions;
create policy coins_read_own on public.coin_transactions
  for select using (auth.uid() = user_id);

-- STORY_ACCESS: read own access grants
drop policy if exists story_access_read_own on public.story_access;
create policy story_access_read_own on public.story_access
  for select using (auth.uid() = user_id);

-- USER_ENTITLEMENTS: read own entitlements
drop policy if exists entitlements_read_own on public.user_entitlements;
create policy entitlements_read_own on public.user_entitlements
  for select using (auth.uid() = user_id);

-- USER_LIBRARY: full CRUD on own library
drop policy if exists library_select_own on public.user_library;
create policy library_select_own on public.user_library
  for select using (auth.uid() = user_id);

drop policy if exists library_insert_own on public.user_library;
create policy library_insert_own on public.user_library
  for insert with check (auth.uid() = user_id);

drop policy if exists library_delete_own on public.user_library;
create policy library_delete_own on public.user_library
  for delete using (auth.uid() = user_id);

-- USER_PROGRESS: full CRUD on own progress
drop policy if exists progress_select_own on public.user_progress;
create policy progress_select_own on public.user_progress
  for select using (auth.uid() = user_id);

drop policy if exists progress_insert_own on public.user_progress;
create policy progress_insert_own on public.user_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists progress_update_own on public.user_progress;
create policy progress_update_own on public.user_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- SETTINGS: any signed-in user can read
drop policy if exists settings_read_all on public.settings;
create policy settings_read_all on public.settings
  for select using (auth.uid() is not null);


-- ---------------------------------------------------------------------------
-- 7. DONE — verify
-- ---------------------------------------------------------------------------
-- Run this to see all policies:
--   select schemaname, tablename, policyname, cmd from pg_policies
--   where schemaname = 'public' order by tablename, policyname;
