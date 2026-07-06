-- Editable site content: 4 pages the admin can update in-place.
-- key = 'contact' | 'terms' | 'privacy' | 'feedback'.

create table if not exists public.site_content (
  key text primary key,
  title text not null default '',
  body text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Seed the 4 slots so the admin editor always has something to edit
insert into public.site_content (key, title, body)
values
  ('contact', 'Contact Us', 'Reach us at hello@starshipstorytime.com — we usually reply within one business day.'),
  ('terms', 'Terms of Service', 'By using Starship StoryTime you agree to these terms. Full text pending.'),
  ('privacy', 'Privacy Policy', 'We take family privacy seriously. Full policy pending.'),
  ('feedback', 'Feedback', 'Tell us what you loved and what we can make better. Reply to any account email or write to feedback@starshipstorytime.com.')
on conflict (key) do nothing;

alter table public.site_content enable row level security;

-- Public can READ (mobile / web public pages)
drop policy if exists site_content_read on public.site_content;
create policy site_content_read on public.site_content
  for select using (true);

-- Only admin / management can WRITE
drop policy if exists site_content_write on public.site_content;
create policy site_content_write on public.site_content
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());
