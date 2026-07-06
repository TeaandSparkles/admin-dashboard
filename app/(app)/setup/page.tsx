"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Database, HardDrive } from "lucide-react";

const LANGUAGES_SQL = `-- Multi-language support: each story is baked in ONE spoken language, with optional English subtitles.
-- Home feed filters based on user's selected app locale + caption preference.

alter table public.stories
  add column if not exists language text not null default 'en',
  add column if not exists subtitle_languages text[] not null default array['en']::text[],
  add column if not exists caption_mode text not null default 'english_only';

comment on column public.stories.language is 'ISO 639-1 code of narrated audio (en, es, fr, de, it, pt, sv, hu, pl, ru, ja, he, hi, zh)';
comment on column public.stories.subtitle_languages is 'Array of ISO 639-1 codes for available subtitle tracks';
comment on column public.stories.caption_mode is 'How captions render: english_only | dual | native_only';

create index if not exists stories_language_idx on public.stories(language);

-- Seed a few fake stories in various languages for testing the flag filter.
do $$
declare
  novel_woods uuid;
  novel_stars uuid;
  novel_kindness uuid;
begin
  select id into novel_woods from public.novels where title ilike '%Whispering Woods%' limit 1;
  select id into novel_stars from public.novels where title ilike '%Star Sailor Sam%' limit 1;
  select id into novel_kindness from public.novels where title ilike '%Kindness Kingdom%' limit 1;

  if novel_woods is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_woods, 'Le Chant du Ruisseau d''Argent', 'Une aventure en français dans la forêt chuchotante.',
            14.99, 90, true, 'fr', array['fr','en'], 'dual')
    on conflict do nothing;
  end if;

  if novel_stars is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_stars, 'Der Stern, der Fehlte', 'Eine deutsche Sternengeschichte für die ganze Familie.',
            12.99, 91, true, 'de', array['de'], 'native_only')
    on conflict do nothing;
  end if;

  if novel_kindness is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_kindness, 'La Semilla del Reino de la Bondad', 'Una historia bilingüe sobre la amabilidad.',
            16.99, 92, true, 'es', array['es','en'], 'dual')
    on conflict do nothing;
  end if;

  if novel_stars is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_stars, '消えた星', 'サムと一緒に星を探す冒険。', 13.99, 93, true, 'ja', array['ja','en'], 'dual')
    on conflict do nothing;
  end if;

  if novel_woods is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_woods, 'Silverbäckens Sång', 'En svensk saga från de viskande skogarna.',
            14.99, 94, true, 'sv', array['sv','en'], 'dual')
    on conflict do nothing;
  end if;

  if novel_kindness is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_kindness, 'A Kedvesség Magja', 'Egy magyar mese a jóságról.',
            15.99, 95, true, 'hu', array['hu','en'], 'dual')
    on conflict do nothing;
  end if;

  if novel_stars is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_stars, 'הכוכב שנעלם', 'סיפור עברי על הרפתקה בין הכוכבים.', 14.99, 96, true, 'he', array['he','en'], 'dual')
    on conflict do nothing;
  end if;

  if novel_woods is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_woods, 'A Canção do Riacho Prateado', 'Uma aventura em português na floresta sussurrante.',
            14.99, 97, true, 'pt', array['pt','en'], 'dual')
    on conflict do nothing;
  end if;

  if novel_kindness is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_kindness, 'Il Seme della Gentilezza', 'Una storia italiana sulla bontà.',
            15.99, 98, true, 'it', array['it','en'], 'dual')
    on conflict do nothing;
  end if;

  if novel_stars is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_stars, 'Gwiazda, Której Brakowało', 'Polska opowieść o gwiazdach.',
            13.99, 99, true, 'pl', array['pl','en'], 'dual')
    on conflict do nothing;
  end if;

  if novel_woods is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_woods, 'Песня Серебряного Ручья', 'Русская сказка из шепчущего леса.',
            14.99, 100, true, 'ru', array['ru','en'], 'dual')
    on conflict do nothing;
  end if;
end $$;
`;

const CATEGORIES_SQL = `-- Category taxonomy for novels: category → genre → theme

alter table public.stories
  add column if not exists category text,
  add column if not exists genre text,
  add column if not exists theme text;

comment on column public.stories.category is 'Top-level taxonomy (Fiction, Nonfiction, Poetry, Drama, Comics & Graphic Works, Educational, Reference & Professional, Special Formats)';
comment on column public.stories.genre is 'Mid-level (e.g. Mystery, Fantasy, Cooking, Business)';
comment on column public.stories.theme is 'Leaf-level (e.g. Cozy Mystery, Epic Fantasy, Baking, Marketing)';

create index if not exists stories_category_idx on public.stories(category);
create index if not exists stories_genre_idx on public.stories(genre);
create index if not exists stories_theme_idx on public.stories(theme);
`;

const AUTO_EMAIL_SQL = `-- Auto-emails: editable templates + send log.

create table if not exists public.email_templates (
  key text primary key,
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
  status text not null default 'pending',
  provider_id text,
  error text,
  variables jsonb,
  sent_at timestamptz not null default now()
);
create index if not exists email_sends_recent_idx on public.email_sends(sent_at desc);
create index if not exists email_sends_status_idx on public.email_sends(status);

insert into public.email_templates (key, subject, html_body, text_body) values
  ('welcome', '🚀 Welcome to Starship StoryTime',
    '<p>Hi {{user_name}},</p><p>Thanks for joining! Open the app to start your first story.</p>',
    'Hi {{user_name}},\\n\\nThanks for joining! Open the app to start your first story.'),
  ('order_confirmation', '✨ Order confirmed: {{novel_title}}',
    '<p>Hi {{user_name}},</p><p>We received your order for <b>{{novel_title}}</b> ({{amount}}).</p><p>Order ID: {{order_id}}</p>',
    'Hi {{user_name}},\\n\\nWe received your order for {{novel_title}} ({{amount}}).\\n\\nOrder ID: {{order_id}}'),
  ('payment_received', '💳 Payment received',
    '<p>Hi {{user_name}},</p><p>Payment of {{amount}} received. Thank you!</p>',
    'Hi {{user_name}},\\n\\nPayment of {{amount}} received. Thank you!'),
  ('shipping_started', '📦 {{novel_title}} is on its way',
    '<p>Hi {{user_name}},</p><p>Your printed copy shipped!</p><p>Tracking: {{tracking_number}}</p>',
    'Hi {{user_name}},\\n\\nYour printed copy shipped!\\n\\nTracking: {{tracking_number}}'),
  ('shipping_delivered', '🎉 Your book arrived',
    '<p>Hi {{user_name}},</p><p>Your tiny book has been delivered. Enjoy!</p>',
    'Hi {{user_name}},\\n\\nYour tiny book has been delivered. Enjoy!'),
  ('streak_reward', '🔥 You earned {{coins}} coins!',
    '<p>Hi {{user_name}},</p><p>You listened {{streak_days}} nights in a row — {{coins}} coins added.</p>',
    'Hi {{user_name}},\\n\\nYou listened {{streak_days}} nights in a row — {{coins}} coins added.')
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
`;

const PROMOTE_SQL = `-- Promote section: reviews, social posts, alerts.

create table if not exists public.promo_connections (
  platform text primary key,
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
  rating int,
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
  platform text not null,
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

create table if not exists public.promo_alerts (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  kind text not null,
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
`;

const SITE_CONTENT_SQL = `-- Editable Contact / Terms / Privacy / Feedback pages
-- Admin can edit these live at /content/[key]. Public app reads via RLS select.

create table if not exists public.site_content (
  key text primary key,
  title text not null default '',
  body text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.site_content (key, title, body)
values
  ('contact', 'Contact Us', 'Reach us at hello@starshipstorytime.com — we usually reply within one business day.'),
  ('terms', 'Terms of Service', 'By using Starship StoryTime you agree to these terms. Full text pending.'),
  ('privacy', 'Privacy Policy', 'We take family privacy seriously. Full policy pending.'),
  ('feedback', 'Feedback', 'Tell us what you loved and what we can make better. Reply to any account email or write to feedback@starshipstorytime.com.')
on conflict (key) do nothing;

alter table public.site_content enable row level security;

drop policy if exists site_content_read on public.site_content;
create policy site_content_read on public.site_content
  for select using (true);

drop policy if exists site_content_write on public.site_content;
create policy site_content_write on public.site_content
  for all using (public.is_admin() or public.is_management())
  with check (public.is_admin() or public.is_management());
`;

const FREE_CHAPTERS_SQL = `-- Per-novel free chapter count.
-- Users can play the first N chapters without purchasing.

alter table public.stories
  add column if not exists free_chapters integer not null default 0;

comment on column public.stories.free_chapters is 'Number of chapters playable without purchase (0 = none free)';

create index if not exists stories_free_chapters_idx on public.stories(free_chapters);
`;

const STORAGE_SQL = `-- Storage buckets for admin-uploaded media.
-- covers = novel cover images (small, publicly readable)
-- media  = chapter video files (larger, publicly readable so mobile can stream)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('covers', 'covers', true, 10485760,
    array['image/jpeg','image/png','image/webp','image/gif']),
  ('media',  'media',  true, 524288000,
    array['video/mp4','video/webm','video/quicktime','audio/mpeg','audio/mp4','audio/wav'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read covers" on storage.objects;
create policy "public read covers" on storage.objects
  for select using (bucket_id = 'covers');

drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "admin write covers" on storage.objects;
create policy "admin write covers" on storage.objects
  for all using (
    bucket_id = 'covers' and (public.is_admin() or public.is_management())
  ) with check (
    bucket_id = 'covers' and (public.is_admin() or public.is_management())
  );

drop policy if exists "admin write media" on storage.objects;
create policy "admin write media" on storage.objects
  for all using (
    bucket_id = 'media' and (public.is_admin() or public.is_management())
  ) with check (
    bucket_id = 'media' and (public.is_admin() or public.is_management())
  );
`;

const SUPABASE_SQL_URL = "https://supabase.com/dashboard/project/_/sql/new";

export default function SetupPage() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copySql(name: string, sql: string) {
    await navigator.clipboard.writeText(sql);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Database setup</h1>
        <p className="text-sm text-muted-foreground">
          Two one-time SQL scripts to enable the language filter and file uploads.
          Click <b>Copy SQL</b>, then <b>Open Supabase SQL editor</b>, paste, and press Run.
        </p>
      </div>

      {/* Step-by-step banner */}
      <Card className="rounded-2xl border-0 bg-gradient-to-br from-blue-50 to-teal-50 shadow-sm">
        <CardContent className="p-5">
          <ol className="space-y-2 text-sm">
            <li className="flex gap-2"><b className="text-blue-700 shrink-0">1.</b> Click <b>Copy SQL</b> below on Migration 1</li>
            <li className="flex gap-2"><b className="text-blue-700 shrink-0">2.</b> Click <b>Open Supabase SQL editor</b> (opens in a new tab)</li>
            <li className="flex gap-2"><b className="text-blue-700 shrink-0">3.</b> Pick your Starship project in Supabase, paste (⌘V / Ctrl+V), click green <b>Run</b></li>
            <li className="flex gap-2"><b className="text-blue-700 shrink-0">4.</b> Come back here and repeat for Migration 2</li>
          </ol>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <a href={SUPABASE_SQL_URL} target="_blank" rel="noreferrer">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <ExternalLink className="h-4 w-4" /> Open Supabase SQL editor
          </Button>
        </a>
      </div>

      {/* Migration 1 */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-blue-600" />
            Migration 1 — Language columns + 11 fake stories
          </CardTitle>
          <CardDescription>
            Adds <code className="text-xs">language</code>, <code className="text-xs">subtitle_languages</code>,
            and <code className="text-xs">caption_mode</code> columns to <code className="text-xs">stories</code>,
            plus test data in 11 languages so you can try the flag filter immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              className="gap-2 bg-teal-600 hover:bg-teal-700"
              onClick={() => copySql("languages", LANGUAGES_SQL)}
            >
              {copied === "languages" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "languages" ? "Copied!" : "Copy SQL"}
            </Button>
            <a href={SUPABASE_SQL_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" /> Open editor
              </Button>
            </a>
          </div>
          <details className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              Preview SQL
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs leading-relaxed text-gray-700 font-mono">
              {LANGUAGES_SQL}
            </pre>
          </details>
        </CardContent>
      </Card>

      {/* Migration 1b — Categories */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-blue-600" />
            Migration 1b — Category taxonomy
          </CardTitle>
          <CardDescription>
            Adds <code className="text-xs">category</code>, <code className="text-xs">genre</code>,
            and <code className="text-xs">theme</code> columns to <code className="text-xs">stories</code>.
            Powers the Fiction → Mystery → Cozy Mystery style filters everywhere.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              className="gap-2 bg-teal-600 hover:bg-teal-700"
              onClick={() => copySql("categories", CATEGORIES_SQL)}
            >
              {copied === "categories" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "categories" ? "Copied!" : "Copy SQL"}
            </Button>
            <a href={SUPABASE_SQL_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" /> Open editor
              </Button>
            </a>
          </div>
          <details className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Preview SQL</summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs leading-relaxed text-gray-700 font-mono">
              {CATEGORIES_SQL}
            </pre>
          </details>
        </CardContent>
      </Card>

      {/* Migration 1f — Auto emails */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-blue-600" />
            Migration 1f — Auto emails
          </CardTitle>
          <CardDescription>
            Adds <code className="text-xs">email_templates</code> and <code className="text-xs">email_sends</code> tables
            with 6 seeded templates (welcome, order, payment, shipping, delivered, streak reward).
            Templates are editable at Auto → Email Templates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              className="gap-2 bg-teal-600 hover:bg-teal-700"
              onClick={() => copySql("auto_email", AUTO_EMAIL_SQL)}
            >
              {copied === "auto_email" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "auto_email" ? "Copied!" : "Copy SQL"}
            </Button>
            <a href={SUPABASE_SQL_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" /> Open editor
              </Button>
            </a>
          </div>
          <details className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Preview SQL</summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs leading-relaxed text-gray-700 font-mono">
              {AUTO_EMAIL_SQL}
            </pre>
          </details>
        </CardContent>
      </Card>

      {/* Migration 1e — Promote */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-blue-600" />
            Migration 1e — Promote (Reviews & Social)
          </CardTitle>
          <CardDescription>
            Adds tables for Google reviews, social posts (FB/IG/TikTok), OAuth connections, and a
            unified alerts feed that drives the sidebar red badge counts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              className="gap-2 bg-teal-600 hover:bg-teal-700"
              onClick={() => copySql("promote", PROMOTE_SQL)}
            >
              {copied === "promote" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "promote" ? "Copied!" : "Copy SQL"}
            </Button>
            <a href={SUPABASE_SQL_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" /> Open editor
              </Button>
            </a>
          </div>
          <details className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Preview SQL</summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs leading-relaxed text-gray-700 font-mono">
              {PROMOTE_SQL}
            </pre>
          </details>
        </CardContent>
      </Card>

      {/* Migration 1d — Site content */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-blue-600" />
            Migration 1d — Editable Content pages
          </CardTitle>
          <CardDescription>
            Creates <code className="text-xs">site_content</code> table for the Contact / Terms /
            Privacy / Feedback pages you can edit from the sidebar under Content. Seeds them with
            starter text so the editor is never empty.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              className="gap-2 bg-teal-600 hover:bg-teal-700"
              onClick={() => copySql("site_content", SITE_CONTENT_SQL)}
            >
              {copied === "site_content" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "site_content" ? "Copied!" : "Copy SQL"}
            </Button>
            <a href={SUPABASE_SQL_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" /> Open editor
              </Button>
            </a>
          </div>
          <details className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Preview SQL</summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs leading-relaxed text-gray-700 font-mono">
              {SITE_CONTENT_SQL}
            </pre>
          </details>
        </CardContent>
      </Card>

      {/* Migration 1c — Free chapters */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-blue-600" />
            Migration 1c — Free chapters column
          </CardTitle>
          <CardDescription>
            Adds <code className="text-xs">free_chapters</code> integer to <code className="text-xs">stories</code>.
            Controls how many chapters users can play without buying (0 = none free).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              className="gap-2 bg-teal-600 hover:bg-teal-700"
              onClick={() => copySql("free_chapters", FREE_CHAPTERS_SQL)}
            >
              {copied === "free_chapters" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "free_chapters" ? "Copied!" : "Copy SQL"}
            </Button>
            <a href={SUPABASE_SQL_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" /> Open editor
              </Button>
            </a>
          </div>
          <details className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Preview SQL</summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs leading-relaxed text-gray-700 font-mono">
              {FREE_CHAPTERS_SQL}
            </pre>
          </details>
        </CardContent>
      </Card>

      {/* Migration 2 */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="h-5 w-5 text-teal-600" />
            Migration 2 — Storage buckets for uploads
          </CardTitle>
          <CardDescription>
            Creates <code className="text-xs">covers</code> and <code className="text-xs">media</code> buckets
            with public read and admin-only write, so the upload buttons on Create Series actually work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              className="gap-2 bg-teal-600 hover:bg-teal-700"
              onClick={() => copySql("storage", STORAGE_SQL)}
            >
              {copied === "storage" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "storage" ? "Copied!" : "Copy SQL"}
            </Button>
            <a href={SUPABASE_SQL_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" /> Open editor
              </Button>
            </a>
          </div>
          <details className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              Preview SQL
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs leading-relaxed text-gray-700 font-mono">
              {STORAGE_SQL}
            </pre>
          </details>
        </CardContent>
      </Card>

      {/* Verification */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">How to verify</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>After both scripts run, check in your Supabase dashboard:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li><b>Table Editor → stories</b> — three new columns and 11 seeded rows in different languages</li>
            <li><b>Storage</b> — buckets <code className="text-xs">covers</code> and <code className="text-xs">media</code></li>
            <li><b>Series page here</b> — the 11 new fake stories appear in the table</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
