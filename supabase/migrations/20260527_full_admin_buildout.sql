-- ============================================================================
-- FULL ADMIN BUILDOUT MIGRATION (idempotent — safe to re-run)
-- ============================================================================
-- - Adds 'management' role support (helper fn + RLS policies)
-- - Adds missing columns: users.coin_balance, users.referral_code,
--   settings.default_shipping_cost, settings.default_print_cost,
--   settings.founders_pass_enabled
-- - Creates new tables: notifications, media_assets, content_versions
-- - Adds RLS on all new tables
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. MANAGEMENT ROLE HELPER FUNCTION
-- ---------------------------------------------------------------------------

create or replace function public.is_management()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role = 'management'
  );
$$;

create or replace function public.is_admin_or_management()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role in ('admin', 'management')
  );
$$;


-- ---------------------------------------------------------------------------
-- 2. ADD MISSING COLUMNS TO users
-- ---------------------------------------------------------------------------

alter table public.users
  add column if not exists coin_balance bigint not null default 0,
  add column if not exists referral_code text unique;

-- Backfill referral_code for existing users that don't have one
update public.users
set referral_code = upper(substring(replace(id::text, '-', '') from 1 for 8))
where referral_code is null;


-- ---------------------------------------------------------------------------
-- 3. ADD MISSING COLUMNS TO settings
-- ---------------------------------------------------------------------------

alter table public.settings
  add column if not exists default_shipping_cost numeric(10, 2),
  add column if not exists default_print_cost numeric(10, 2),
  add column if not exists founders_pass_enabled boolean not null default false;


-- ---------------------------------------------------------------------------
-- 4. NEW TABLE: notifications
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null,                      -- new_episode | reward | system
  title text not null,
  message text,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  metadata jsonb
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);


-- ---------------------------------------------------------------------------
-- 5. NEW TABLE: media_assets
-- ---------------------------------------------------------------------------

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  type text not null,                      -- audio | image | video
  url text not null,
  linked_chapter_id uuid references public.chapters(id) on delete cascade,
  linked_story_id uuid references public.stories(id) on delete cascade,
  linked_novel_id uuid references public.novels(id) on delete cascade,
  metadata jsonb,
  created_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- 6. NEW TABLE: content_versions (AI PIPELINE)
-- ---------------------------------------------------------------------------

create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references public.chapters(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  version_number int not null default 1,
  prompt_used text,
  generated_text text,
  status text not null default 'pending',  -- pending | approved | rejected
  approved_by uuid references public.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists content_versions_chapter_idx on public.content_versions(chapter_id);
create index if not exists content_versions_status_idx on public.content_versions(status);


-- ---------------------------------------------------------------------------
-- 7. ENABLE RLS ON NEW TABLES
-- ---------------------------------------------------------------------------

alter table public.notifications enable row level security;
alter table public.media_assets enable row level security;
alter table public.content_versions enable row level security;


-- ---------------------------------------------------------------------------
-- 8. RLS POLICIES — admin/management full, accounting read, user own
-- ---------------------------------------------------------------------------

-- ADMIN policies on new tables
drop policy if exists admin_all on public.notifications;
create policy admin_all on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all on public.media_assets;
create policy admin_all on public.media_assets
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all on public.content_versions;
create policy admin_all on public.content_versions
  for all using (public.is_admin()) with check (public.is_admin());

-- MANAGEMENT policies (full access across all existing + new tables)
do $$
declare
  t text;
  tables text[] := array[
    'users','novels','stories','chapters','orders','shipments','payments',
    'referrals','coin_transactions','story_access','user_entitlements',
    'user_library','user_progress','audit_logs','settings',
    'notifications','media_assets','content_versions'
  ];
begin
  foreach t in array tables
  loop
    execute format('drop policy if exists management_all on public.%I', t);
    execute format(
      'create policy management_all on public.%I for all using (public.is_management()) with check (public.is_management())',
      t
    );
  end loop;
end $$;

-- ACCOUNTING read on new tables
drop policy if exists accounting_read on public.notifications;
create policy accounting_read on public.notifications
  for select using (public.is_accounting());

drop policy if exists accounting_read on public.media_assets;
create policy accounting_read on public.media_assets
  for select using (public.is_accounting());

drop policy if exists accounting_read on public.content_versions;
create policy accounting_read on public.content_versions
  for select using (public.is_accounting());

-- USERS read own notifications
drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- USERS read media assets (for displaying in mobile app)
drop policy if exists media_read_all on public.media_assets;
create policy media_read_all on public.media_assets
  for select using (auth.uid() is not null);


-- ---------------------------------------------------------------------------
-- 9. UPDATE users role check to include 'management' in the auto-create trigger
-- ---------------------------------------------------------------------------
-- (no-op if previous trigger already created — this is a safety re-create)

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, username, role, referral_code)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    'user',
    upper(substring(replace(new.id::text, '-', '') from 1 for 8))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- DONE
-- ---------------------------------------------------------------------------
-- Verify with:
--   select column_name from information_schema.columns where table_name = 'users';
--   select column_name from information_schema.columns where table_name = 'settings';
--   select table_name from information_schema.tables where table_schema = 'public';
