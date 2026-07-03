-- Category taxonomy for novels: category → genre → theme
-- e.g. Fiction → Mystery → Cozy Mystery, or Nonfiction → Cooking → Baking

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
