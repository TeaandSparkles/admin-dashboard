-- Promote section: track Google reviews + social posts, alert admin to new items.
-- OAuth connections + cached items land here; alerts feed drives sidebar badges.

create table if not exists public.promo_connections (
  platform text primary key,               -- 'google' | 'facebook' | 'instagram' | 'tiktok'
  connected_at timestamptz,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  account_label text,
  updated_at timestamptz not null default now()
);

create table if not exists public.google_reviews (
  id uuid primary key default gen_random_uuid(),
  external_id text unique not null,
  reviewer_name text,
  reviewer_photo text,
  rating int,                              -- 1..5
  comment text,
  review_url text,
  responded boolean not null default false,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  fetched_at timestamptz not null default now()
);

create index if not exists google_reviews_responded_idx on public.google_reviews(responded);
create index if not exists google_reviews_created_idx on public.google_reviews(created_at desc);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null,                  -- 'facebook' | 'instagram' | 'tiktok'
  external_id text not null,
  post_url text,
  caption text,
  media_url text,
  likes int default 0,
  comments int default 0,
  posted_at timestamptz,
  fetched_at timestamptz not null default now(),
  unique(platform, external_id)
);
create index if not exists social_posts_platform_idx on public.social_posts(platform, posted_at desc);

-- Unified alert feed for the sidebar badges
create table if not exists public.promo_alerts (
  id uuid primary key default gen_random_uuid(),
  platform text not null,                  -- 'google' | 'facebook' | 'instagram' | 'tiktok'
  kind text not null,                      -- 'new_review' | 'new_comment' | 'new_mention'
  title text not null,
  body text,
  external_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists promo_alerts_unread_idx on public.promo_alerts(platform) where is_read = false;

alter table public.promo_connections enable row level security;
alter table public.google_reviews enable row level security;
alter table public.social_posts enable row level security;
alter table public.promo_alerts enable row level security;

drop policy if exists promo_admin_all_conn on public.promo_connections;
create policy promo_admin_all_conn on public.promo_connections
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

drop policy if exists promo_admin_all_reviews on public.google_reviews;
create policy promo_admin_all_reviews on public.google_reviews
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

drop policy if exists promo_admin_all_posts on public.social_posts;
create policy promo_admin_all_posts on public.social_posts
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

drop policy if exists promo_admin_all_alerts on public.promo_alerts;
create policy promo_admin_all_alerts on public.promo_alerts
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());
