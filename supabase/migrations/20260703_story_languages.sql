-- Multi-language support: each story is baked in ONE spoken language, with optional English subtitles.
-- Home feed filters based on user's selected app locale + caption preference.

alter table public.stories
  add column if not exists language text not null default 'en',
  add column if not exists subtitle_languages text[] not null default array['en']::text[],
  add column if not exists caption_mode text not null default 'english_only';
  -- caption_mode: 'english_only' | 'dual' | 'native_only'

comment on column public.stories.language is 'ISO 639-1 code of narrated audio (en, es, fr, de, it, pt, sv, hu, pl, ru, ja, he, hi, zh)';
comment on column public.stories.subtitle_languages is 'Array of ISO 639-1 codes for available subtitle tracks';
comment on column public.stories.caption_mode is 'How captions render: english_only | dual | native_only';

create index if not exists stories_language_idx on public.stories(language);

-- Seed a few fake stories in various languages for testing the flag filter.
-- These are attached to existing published novels (safely no-op if novels missing).
do $$
declare
  novel_woods uuid;
  novel_stars uuid;
  novel_kindness uuid;
begin
  select id into novel_woods from public.novels where title ilike '%Whispering Woods%' limit 1;
  select id into novel_stars from public.novels where title ilike '%Star Sailor Sam%' limit 1;
  select id into novel_kindness from public.novels where title ilike '%Kindness Kingdom%' limit 1;

  -- French narrated story
  if novel_woods is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_woods, 'Le Chant du Ruisseau d''Argent', 'Une aventure en français dans la forêt chuchotante.',
            14.99, 90, true, 'fr', array['fr','en'], 'dual')
    on conflict do nothing;
  end if;

  -- German narrated, German-only captions
  if novel_stars is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_stars, 'Der Stern, der Fehlte', 'Eine deutsche Sternengeschichte für die ganze Familie.',
            12.99, 91, true, 'de', array['de'], 'native_only')
    on conflict do nothing;
  end if;

  -- Spanish narrated, dual Spanish+English captions
  if novel_kindness is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_kindness, 'La Semilla del Reino de la Bondad', 'Una historia bilingüe sobre la amabilidad.',
            16.99, 92, true, 'es', array['es','en'], 'dual')
    on conflict do nothing;
  end if;

  -- Japanese narrated, dual JA+EN
  if novel_stars is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_stars, '消えた星', 'サムと一緒に星を探す冒険。', 13.99, 93, true, 'ja', array['ja','en'], 'dual')
    on conflict do nothing;
  end if;

  -- Swedish narrated
  if novel_woods is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_woods, 'Silverbäckens Sång', 'En svensk saga från de viskande skogarna.',
            14.99, 94, true, 'sv', array['sv','en'], 'dual')
    on conflict do nothing;
  end if;

  -- Hungarian narrated
  if novel_kindness is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_kindness, 'A Kedvesség Magja', 'Egy magyar mese a jóságról.',
            15.99, 95, true, 'hu', array['hu','en'], 'dual')
    on conflict do nothing;
  end if;

  -- Hebrew narrated (RTL test)
  if novel_stars is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_stars, 'הכוכב שנעלם', 'סיפור עברי על הרפתקה בין הכוכבים.', 14.99, 96, true, 'he', array['he','en'], 'dual')
    on conflict do nothing;
  end if;

  -- Portuguese narrated
  if novel_woods is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_woods, 'A Canção do Riacho Prateado', 'Uma aventura em português na floresta sussurrante.',
            14.99, 97, true, 'pt', array['pt','en'], 'dual')
    on conflict do nothing;
  end if;

  -- Italian narrated
  if novel_kindness is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_kindness, 'Il Seme della Gentilezza', 'Una storia italiana sulla bontà.',
            15.99, 98, true, 'it', array['it','en'], 'dual')
    on conflict do nothing;
  end if;

  -- Polish narrated
  if novel_stars is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_stars, 'Gwiazda, Której Brakowało', 'Polska opowieść o gwiazdach.',
            13.99, 99, true, 'pl', array['pl','en'], 'dual')
    on conflict do nothing;
  end if;

  -- Russian narrated
  if novel_woods is not null then
    insert into public.stories (novel_id, title, description, story_price, order_index, published, language, subtitle_languages, caption_mode)
    values (novel_woods, 'Песня Серебряного Ручья', 'Русская сказка из шепчущего леса.',
            14.99, 100, true, 'ru', array['ru','en'], 'dual')
    on conflict do nothing;
  end if;
end $$;
