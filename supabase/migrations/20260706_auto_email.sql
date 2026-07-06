-- Auto-generated emails: editable templates + send log.
-- Templates are rendered with {{variables}} at send time via /api/email/send.

create table if not exists public.email_templates (
  key text primary key,                    -- 'welcome' | 'order_confirmation' | ...
  subject text not null default '',
  html_body text not null default '',
  text_body text not null default '',
  from_name text not null default 'Starship StoryTime',
  from_email text not null default 'hello@starshipstorytime.com',
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.email_sends (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  to_email text not null,
  subject text,
  status text not null default 'pending',  -- 'pending' | 'sent' | 'failed'
  provider_id text,                        -- Resend id for retry / debugging
  error text,
  variables jsonb,
  sent_at timestamptz not null default now()
);
create index if not exists email_sends_recent_idx on public.email_sends(sent_at desc);
create index if not exists email_sends_status_idx on public.email_sends(status);

-- Seed the 6 core templates so the editor is never empty.
-- Text between {{brackets}} is replaced at send time with real values.
insert into public.email_templates (key, subject, html_body, text_body) values
  (
    'welcome',
    '🚀 Welcome to Starship StoryTime',
    '<p>Hi {{user_name}},</p><p>Thanks for joining Starship StoryTime! Your first story is waiting — open the app and tap any book to begin.</p><p>Warmly,<br/>The Starship team</p>',
    'Hi {{user_name}},\n\nThanks for joining Starship StoryTime! Your first story is waiting — open the app and tap any book to begin.\n\nWarmly,\nThe Starship team'
  ),
  (
    'order_confirmation',
    '✨ Order confirmed: {{novel_title}}',
    '<p>Hi {{user_name}},</p><p>We''ve received your order for <b>{{novel_title}}</b> ({{amount}}).</p><p>Order ID: <code>{{order_id}}</code></p><p>Your printed tiny book will ship soon, and digital access is unlocked in the app right now.</p>',
    'Hi {{user_name}},\n\nWe''ve received your order for {{novel_title}} ({{amount}}).\n\nOrder ID: {{order_id}}\n\nYour printed tiny book will ship soon, and digital access is unlocked in the app right now.'
  ),
  (
    'payment_received',
    '💳 Payment received for {{novel_title}}',
    '<p>Hi {{user_name}},</p><p>Your payment of <b>{{amount}}</b> for {{novel_title}} was received. Thank you!</p>',
    'Hi {{user_name}},\n\nYour payment of {{amount}} for {{novel_title}} was received. Thank you!'
  ),
  (
    'shipping_started',
    '📦 Your {{novel_title}} is on its way',
    '<p>Hi {{user_name}},</p><p>Your printed copy of <b>{{novel_title}}</b> just shipped!</p><p>Tracking: {{tracking_number}}</p>',
    'Hi {{user_name}},\n\nYour printed copy of {{novel_title}} just shipped!\n\nTracking: {{tracking_number}}'
  ),
  (
    'shipping_delivered',
    '🎉 Your {{novel_title}} arrived',
    '<p>Hi {{user_name}},</p><p>Your tiny book has been delivered. Enjoy the read!</p>',
    'Hi {{user_name}},\n\nYour tiny book has been delivered. Enjoy the read!'
  ),
  (
    'streak_reward',
    '🔥 You earned {{coins}} coins!',
    '<p>Hi {{user_name}},</p><p>You listened {{streak_days}} nights in a row — {{coins}} coins added to your balance.</p><p>Spend them to unlock free bonus chapters in the app.</p>',
    'Hi {{user_name}},\n\nYou listened {{streak_days}} nights in a row — {{coins}} coins added to your balance.\n\nSpend them to unlock free bonus chapters in the app.'
  )
on conflict (key) do nothing;

alter table public.email_templates enable row level security;
alter table public.email_sends enable row level security;

drop policy if exists email_templates_admin on public.email_templates;
create policy email_templates_admin on public.email_templates
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

drop policy if exists email_sends_admin on public.email_sends;
create policy email_sends_admin on public.email_sends
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());

drop policy if exists email_sends_service on public.email_sends;
create policy email_sends_service on public.email_sends
  for insert with check (true);
