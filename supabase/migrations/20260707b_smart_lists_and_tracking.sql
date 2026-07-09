-- =============================================================
-- USER ATTRIBUTES VIEW + SMART LISTS + EMAIL TRACKING + UNSUB
-- =============================================================

-- 1) Email tracking columns
alter table public.email_sends
  add column if not exists delivered_at timestamptz,
  add column if not exists opened_at timestamptz,
  add column if not exists clicked_at timestamptz,
  add column if not exists bounced_at timestamptz,
  add column if not exists complained_at timestamptz,
  add column if not exists open_count int not null default 0,
  add column if not exists click_count int not null default 0;

create index if not exists email_sends_opened_idx on public.email_sends(opened_at) where opened_at is not null;
create index if not exists email_sends_clicked_idx on public.email_sends(clicked_at) where clicked_at is not null;

-- 2) Unsubscribe token + double opt-in flags on users
alter table public.users
  add column if not exists unsubscribe_token text unique,
  add column if not exists email_confirmed boolean not null default false,
  add column if not exists email_confirmed_at timestamptz;

-- Generate unsub tokens for existing users
update public.users
  set unsubscribe_token = encode(gen_random_bytes(24), 'hex')
  where unsubscribe_token is null;

-- Auto-generate token on new user insert
create or replace function public.generate_unsub_token()
returns trigger language plpgsql as $$
begin
  if new.unsubscribe_token is null then
    new.unsubscribe_token := encode(gen_random_bytes(24), 'hex');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_gen_unsub_token on public.users;
create trigger trg_gen_unsub_token
before insert on public.users
for each row execute function public.generate_unsub_token();

-- 3) Auto-computed user attributes view
create or replace view public.v_user_attributes as
select
  u.id,
  u.username,
  u.email,
  u.created_at,
  u.email_opted_out,
  u.email_confirmed,
  u.coin_balance,
  -- Days since signup
  extract(day from (now() - u.created_at))::int as days_since_signup,
  -- Purchase attributes
  coalesce(o.purchase_count, 0) as purchase_count,
  coalesce(o.total_spent, 0)::numeric as total_spent,
  o.first_purchase_at,
  o.last_purchase_at,
  case when o.last_purchase_at is not null
       then extract(day from (now() - o.last_purchase_at))::int
       else null end as days_since_last_purchase,
  -- Progress / activity
  coalesce(p.chapters_started, 0) as chapters_started,
  coalesce(p.chapters_completed, 0) as chapters_completed,
  p.last_active_at,
  case when p.last_active_at is not null
       then extract(day from (now() - p.last_active_at))::int
       else null end as days_since_active,
  -- Streaks
  coalesce(s.current_streak, 0) as current_streak,
  coalesce(s.longest_streak, 0) as longest_streak,
  -- Referrals
  coalesce(r.referrals_made, 0) as referrals_made,
  -- Email engagement
  coalesce(e.emails_sent, 0) as emails_sent,
  coalesce(e.emails_opened, 0) as emails_opened,
  coalesce(e.emails_clicked, 0) as emails_clicked
from public.users u
left join (
  select user_id,
         count(*) as purchase_count,
         sum(total_amount) as total_spent,
         min(created_at) as first_purchase_at,
         max(created_at) as last_purchase_at
  from public.orders where status in ('completed','delivered','shipped')
  group by user_id
) o on o.user_id = u.id
left join (
  select user_id,
         count(*) filter (where completed is not null) as chapters_started,
         count(*) filter (where completed = true) as chapters_completed,
         max(updated_at) as last_active_at
  from public.user_progress group by user_id
) p on p.user_id = u.id
left join public.listening_streaks s on s.user_id = u.id
left join (
  select referrer_user_id as user_id, count(*) as referrals_made
  from public.referrals group by referrer_user_id
) r on r.user_id = u.id
left join (
  select
    (select id from public.users where email = es.to_email limit 1) as user_id,
    count(*) as emails_sent,
    count(*) filter (where opened_at is not null) as emails_opened,
    count(*) filter (where clicked_at is not null) as emails_clicked
  from public.email_sends es
  group by es.to_email
) e on e.user_id = u.id;

-- 4) Smart lists: rules-based dynamic lists
alter table public.drip_lists
  add column if not exists is_smart boolean not null default false,
  add column if not exists smart_rules jsonb not null default '[]'::jsonb,
  add column if not exists last_refreshed_at timestamptz;

comment on column public.drip_lists.smart_rules is
  'Array of {attribute, operator, value} rules. All must match (AND). ' ||
  'Supported operators: eq, neq, gt, gte, lt, lte, is_true, is_false, is_null, is_not_null.';

-- Refresh a smart list's members based on its rules
create or replace function public.refresh_smart_list(p_list_id uuid)
returns table(added int, removed int) language plpgsql security definer as $$
declare
  rules jsonb;
  rule jsonb;
  sql_conditions text := '';
  full_sql text;
  attribute_name text;
  op text;
  value_json jsonb;
  added_count int := 0;
  removed_count int := 0;
begin
  select smart_rules into rules from public.drip_lists where id = p_list_id and is_smart = true;
  if rules is null then
    return query select 0, 0;
    return;
  end if;

  -- Build SQL WHERE clause from JSON rules
  for rule in select * from jsonb_array_elements(rules) loop
    attribute_name := rule->>'attribute';
    op := rule->>'operator';
    value_json := rule->'value';

    -- Whitelist attribute names to prevent injection
    if attribute_name not in (
      'days_since_signup','purchase_count','total_spent','days_since_last_purchase',
      'chapters_started','chapters_completed','days_since_active',
      'current_streak','longest_streak','referrals_made',
      'emails_sent','emails_opened','emails_clicked',
      'email_opted_out','email_confirmed','coin_balance'
    ) then
      continue;
    end if;

    if sql_conditions <> '' then
      sql_conditions := sql_conditions || ' AND ';
    end if;

    case op
      when 'eq' then sql_conditions := sql_conditions || quote_ident(attribute_name) || ' = ' || quote_literal(value_json->>0);
      when 'neq' then sql_conditions := sql_conditions || quote_ident(attribute_name) || ' <> ' || quote_literal(value_json->>0);
      when 'gt' then sql_conditions := sql_conditions || quote_ident(attribute_name) || ' > ' || quote_literal(value_json->>0);
      when 'gte' then sql_conditions := sql_conditions || quote_ident(attribute_name) || ' >= ' || quote_literal(value_json->>0);
      when 'lt' then sql_conditions := sql_conditions || quote_ident(attribute_name) || ' < ' || quote_literal(value_json->>0);
      when 'lte' then sql_conditions := sql_conditions || quote_ident(attribute_name) || ' <= ' || quote_literal(value_json->>0);
      when 'is_true' then sql_conditions := sql_conditions || quote_ident(attribute_name) || ' = true';
      when 'is_false' then sql_conditions := sql_conditions || quote_ident(attribute_name) || ' = false';
      when 'is_null' then sql_conditions := sql_conditions || quote_ident(attribute_name) || ' IS NULL';
      when 'is_not_null' then sql_conditions := sql_conditions || quote_ident(attribute_name) || ' IS NOT NULL';
      else continue;
    end case;
  end loop;

  if sql_conditions = '' then
    sql_conditions := 'true';
  end if;

  -- Wipe current members and re-insert matching users
  delete from public.drip_list_members where list_id = p_list_id;
  get diagnostics removed_count = row_count;

  full_sql := format(
    'insert into public.drip_list_members (list_id, user_id) ' ||
    'select %L::uuid, id from public.v_user_attributes where %s',
    p_list_id, sql_conditions
  );
  execute full_sql;
  get diagnostics added_count = row_count;

  update public.drip_lists set last_refreshed_at = now() where id = p_list_id;

  return query select added_count, removed_count;
end;
$$;

-- 5) Seed 4 useful smart lists ready to refresh
insert into public.drip_lists (slug, name, description, is_smart, smart_rules) values
  ('new_signups_no_purchase', 'New signups (no purchase yet)', 'Signed up in the last 7 days, has not bought anything',
    true,
    '[{"attribute":"days_since_signup","operator":"lte","value":[7]},{"attribute":"purchase_count","operator":"eq","value":[0]}]'::jsonb),
  ('inactive_30_days', 'Inactive 30+ days', 'Last activity was 30+ days ago',
    true,
    '[{"attribute":"days_since_active","operator":"gte","value":[30]}]'::jsonb),
  ('high_value_customers', 'High-value customers', 'Spent over $30 in total',
    true,
    '[{"attribute":"total_spent","operator":"gte","value":["30"]}]'::jsonb),
  ('super_referrers', 'Super referrers', 'Referred 3 or more users',
    true,
    '[{"attribute":"referrals_made","operator":"gte","value":[3]}]'::jsonb)
on conflict (slug) do nothing;
