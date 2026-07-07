-- =============================================================
-- REFERRALS + EMAIL DRIPS + PER-USER COMMUNICATION OPT-OUT
-- =============================================================

-- Per-user email preference. Global kill switch checked on every send.
alter table public.users
  add column if not exists email_opted_out boolean not null default false,
  add column if not exists email_opted_out_at timestamptz,
  add column if not exists email_opted_out_reason text;

-- =============================================================
-- 1) REFERRALS
-- =============================================================

-- A referral: person A shared their code, person B signed up using it.
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id) on delete cascade,
  referred_user_id uuid not null references public.users(id) on delete cascade,
  code_used text not null,
  status text not null default 'pending',        -- 'pending' | 'qualified' | 'rewarded' | 'void'
  qualified_at timestamptz,                       -- set when referred user makes first purchase
  rewarded_at timestamptz,                        -- set when referrer's coins are issued
  reward_coins int not null default 0,
  created_at timestamptz not null default now(),
  unique (referrer_user_id, referred_user_id)
);
create index if not exists referrals_referrer_idx on public.referrals(referrer_user_id);
create index if not exists referrals_status_idx on public.referrals(status);

-- Settings row for referral economy (extend if you already have a settings row)
alter table public.settings
  add column if not exists referral_signup_reward int default 25,
  add column if not exists referral_purchase_reward int default 100;

-- When a new user is created with a referral code, record the referral link
create or replace function public.record_referral_on_signup()
returns trigger language plpgsql security definer as $$
declare
  ref_user_id uuid;
begin
  if new.referred_by_user_id is not null then
    ref_user_id := new.referred_by_user_id;
  elsif new.referral_code is not null then
    -- Fallback: if trigger fires with referral_code but no resolved user, skip
    return new;
  else
    return new;
  end if;

  insert into public.referrals (referrer_user_id, referred_user_id, code_used, status, reward_coins)
  values (
    ref_user_id,
    new.id,
    coalesce(new.referral_code, ''),
    'pending',
    coalesce((select referral_signup_reward from public.settings limit 1), 25)
  )
  on conflict (referrer_user_id, referred_user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_record_referral on public.users;
create trigger trg_record_referral
after insert on public.users
for each row execute function public.record_referral_on_signup();

-- When the referred user makes their first order, qualify the referral and issue coins
create or replace function public.qualify_referral_on_order()
returns trigger language plpgsql security definer as $$
declare
  ref_row public.referrals%rowtype;
  purchase_reward int;
begin
  -- Only trigger on the referred user's first order
  if (select count(*) from public.orders where user_id = new.user_id) > 1 then
    return new;
  end if;

  select * into ref_row from public.referrals
    where referred_user_id = new.user_id
      and status in ('pending','qualified')
    limit 1;

  if not found then return new; end if;

  purchase_reward := coalesce((select referral_purchase_reward from public.settings limit 1), 100);

  update public.referrals
    set status = 'rewarded',
        qualified_at = coalesce(qualified_at, now()),
        rewarded_at = now(),
        reward_coins = reward_coins + purchase_reward
    where id = ref_row.id;

  -- Issue coins to the referrer (assumes coin_transactions has the shape used elsewhere)
  insert into public.coin_transactions (user_id, amount, reason)
  values (ref_row.referrer_user_id, purchase_reward, 'referral_reward');

  return new;
end;
$$;

drop trigger if exists trg_qualify_referral on public.orders;
create trigger trg_qualify_referral
after insert on public.orders
for each row execute function public.qualify_referral_on_order();

alter table public.referrals enable row level security;
drop policy if exists referrals_admin_all on public.referrals;
create policy referrals_admin_all on public.referrals
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

drop policy if exists referrals_self_read on public.referrals;
create policy referrals_self_read on public.referrals
  for select using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

-- =============================================================
-- 2) EMAIL DRIP CAMPAIGNS
-- =============================================================

-- A drip campaign = an ordered sequence of emails, each with a delay.
create table if not exists public.drip_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                     -- 'welcome_series', 'launch_promo', etc.
  name text not null,
  description text,
  trigger_event text not null default 'manual',  -- 'signup' | 'purchase' | 'list' | 'manual'
  trigger_list_id uuid,                          -- when trigger_event='list', this list auto-enrolls
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists drip_campaigns_trigger_idx on public.drip_campaigns(trigger_event);

create table if not exists public.drip_steps (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.drip_campaigns(id) on delete cascade,
  order_index int not null default 0,
  template_key text not null,                    -- references email_templates.key
  delay_hours int not null default 0,            -- delay from PREVIOUS step (or trigger if step 0)
  subject_override text,                         -- optional per-step subject override
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (campaign_id, order_index)
);

-- Audience lists — bundles of users
create table if not exists public.drip_lists (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.drip_list_members (
  list_id uuid not null references public.drip_lists(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (list_id, user_id)
);
create index if not exists drip_list_members_user_idx on public.drip_list_members(user_id);

-- A user's enrollment in a specific campaign
create table if not exists public.drip_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  campaign_id uuid not null references public.drip_campaigns(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  current_step int not null default 0,           -- index of next step to send
  next_send_at timestamptz,                      -- null means "not scheduled yet"
  status text not null default 'active',         -- 'active' | 'paused' | 'completed' | 'unsubscribed'
  paused_reason text,
  last_sent_at timestamptz,
  unique (user_id, campaign_id)
);
create index if not exists drip_enrollments_due_idx on public.drip_enrollments(next_send_at) where status = 'active';
create index if not exists drip_enrollments_user_idx on public.drip_enrollments(user_id);

alter table public.drip_campaigns enable row level security;
alter table public.drip_steps enable row level security;
alter table public.drip_lists enable row level security;
alter table public.drip_list_members enable row level security;
alter table public.drip_enrollments enable row level security;

drop policy if exists drip_all_admin_campaigns on public.drip_campaigns;
create policy drip_all_admin_campaigns on public.drip_campaigns
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

drop policy if exists drip_all_admin_steps on public.drip_steps;
create policy drip_all_admin_steps on public.drip_steps
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

drop policy if exists drip_all_admin_lists on public.drip_lists;
create policy drip_all_admin_lists on public.drip_lists
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

drop policy if exists drip_all_admin_members on public.drip_list_members;
create policy drip_all_admin_members on public.drip_list_members
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

drop policy if exists drip_all_admin_enrollments on public.drip_enrollments;
create policy drip_all_admin_enrollments on public.drip_enrollments
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

-- Enroll everyone in a signup-triggered campaign automatically
create or replace function public.enroll_signup_drips()
returns trigger language plpgsql security definer as $$
declare
  c public.drip_campaigns%rowtype;
  first_step public.drip_steps%rowtype;
begin
  for c in select * from public.drip_campaigns where trigger_event='signup' and enabled loop
    select * into first_step from public.drip_steps
      where campaign_id = c.id and enabled
      order by order_index asc limit 1;
    if not found then continue; end if;
    insert into public.drip_enrollments (user_id, campaign_id, current_step, next_send_at, status)
    values (new.id, c.id, 0, now() + (first_step.delay_hours || ' hours')::interval, 'active')
    on conflict (user_id, campaign_id) do nothing;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_enroll_signup_drips on public.users;
create trigger trg_enroll_signup_drips
after insert on public.users
for each row execute function public.enroll_signup_drips();

-- =============================================================
-- 3) SEED DEFAULT DRIP CAMPAIGNS (uses existing email_templates)
-- =============================================================

insert into public.drip_campaigns (slug, name, description, trigger_event, enabled) values
  ('welcome_series', 'Welcome Series', '3-email onboarding for every new signup', 'signup', true),
  ('post_purchase', 'Post-Purchase Nurture', 'Delivery + streak reward reminder after buying', 'purchase', true),
  ('launch_promo', 'Launch Promo Blast', 'Manually triggered launch announcement', 'manual', true),
  ('reengagement', 'Re-engagement (30-day inactive)', 'Bring dormant users back with a free chapter', 'manual', true),
  ('birthday_surprise', 'Birthday Surprise', 'Sends a bonus chapter on the user''s birthday', 'manual', false)
on conflict (slug) do nothing;

-- Populate step sequences for the two auto-triggered campaigns
do $$
declare
  welcome_id uuid;
  purchase_id uuid;
begin
  select id into welcome_id from public.drip_campaigns where slug='welcome_series';
  select id into purchase_id from public.drip_campaigns where slug='post_purchase';

  if welcome_id is not null then
    insert into public.drip_steps (campaign_id, order_index, template_key, delay_hours) values
      (welcome_id, 0, 'welcome', 0),                     -- immediate
      (welcome_id, 1, 'streak_reward', 72),              -- +3 days
      (welcome_id, 2, 'order_confirmation', 168)         -- +7 days (nudge to buy first novel)
    on conflict (campaign_id, order_index) do nothing;
  end if;

  if purchase_id is not null then
    insert into public.drip_steps (campaign_id, order_index, template_key, delay_hours) values
      (purchase_id, 0, 'payment_received', 0),
      (purchase_id, 1, 'shipping_started', 24),
      (purchase_id, 2, 'shipping_delivered', 120),       -- +5 days
      (purchase_id, 3, 'streak_reward', 240)             -- +10 days
    on conflict (campaign_id, order_index) do nothing;
  end if;
end $$;

-- Seed 3 useful audience lists
insert into public.drip_lists (slug, name, description) values
  ('all_customers', 'All Customers', 'Everyone who has bought at least one novel'),
  ('waitlist', 'Pre-launch Waitlist', 'Signups from the marketing site before app launch'),
  ('vip', 'VIP', 'High-LTV customers for special offers')
on conflict (slug) do nothing;
