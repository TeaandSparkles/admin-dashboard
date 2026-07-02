-- ============================================================================
-- SAMPLE CONTENT — 3 family-friendly novels with stories + chapters
-- ============================================================================
-- Purpose: populate the app with real content so the mobile app shows a
-- proper story library on the home screen (not just an empty state).
-- Idempotent-ish: uses ON CONFLICT DO NOTHING on title where possible.
-- ============================================================================

do $$
declare
  n_woods uuid;
  n_star uuid;
  n_kind uuid;

  s_woods1 uuid;
  s_woods2 uuid;
  s_star1 uuid;
  s_star2 uuid;
  s_kind1 uuid;
  s_kind2 uuid;
begin

  -- ==========================================================================
  -- NOVEL 1 — The Whispering Woods
  -- ==========================================================================
  insert into public.novels (title, description, cover_image, age_group, content_type, theme, published)
  values (
    'The Whispering Woods',
    'A magical forest where the trees share ancient secrets with brave children. Each visit teaches a new lesson about courage.',
    'https://placehold.co/400x600/6366F1/FFFFFF/png?text=Whispering+Woods&font=roboto',
    '5-10',
    'audio',
    'nature',
    true
  ) returning id into n_woods;

  -- Story 1: The Tree That Knew Your Name
  insert into public.stories (novel_id, title, description, story_price, order_index, published, fulfillment_type, free_preview_minutes)
  values (
    n_woods,
    'The Tree That Knew Your Name',
    'Lily meets an ancient oak that remembers every child who has ever visited the forest.',
    14.99, 1, true, 'physical', 3
  ) returning id into s_woods1;

  insert into public.chapters (story_id, chapter_number, title, duration_seconds) values
    (s_woods1, 1, 'A Path Through the Ferns', 720),
    (s_woods1, 2, 'The Oak With Kind Eyes', 900),
    (s_woods1, 3, 'A Secret Whispered Home', 840);

  -- Story 2: The Song of the Silver Stream
  insert into public.stories (novel_id, title, description, story_price, order_index, published, fulfillment_type, free_preview_minutes)
  values (
    n_woods,
    'The Song of the Silver Stream',
    'Marcus follows a stream that hums a lullaby only children can hear.',
    14.99, 2, true, 'physical', 3
  ) returning id into s_woods2;

  insert into public.chapters (story_id, chapter_number, title, duration_seconds) values
    (s_woods2, 1, 'The First Note', 660),
    (s_woods2, 2, 'Following the Melody', 780),
    (s_woods2, 3, 'The Stream Speaks', 720),
    (s_woods2, 4, 'A Lullaby Learned', 600);


  -- ==========================================================================
  -- NOVEL 2 — Star Sailor Sam
  -- ==========================================================================
  insert into public.novels (title, description, cover_image, age_group, content_type, theme, published)
  values (
    'Star Sailor Sam',
    'A young girl who sails a paper boat across the night sky, discovering that every star holds a story.',
    'https://placehold.co/400x600/06B6D4/FFFFFF/png?text=Star+Sailor+Sam&font=roboto',
    '4-9',
    'audio',
    'adventure',
    true
  ) returning id into n_star;

  -- Story 1: Setting Sail from the Windowsill
  insert into public.stories (novel_id, title, description, story_price, order_index, published, fulfillment_type, free_preview_minutes)
  values (
    n_star,
    'Setting Sail from the Windowsill',
    'Sam builds her boat, and the wind of imagination lifts her into the night.',
    12.99, 1, true, 'physical', 3
  ) returning id into s_star1;

  insert into public.chapters (story_id, chapter_number, title, duration_seconds) values
    (s_star1, 1, 'Folding the First Sail', 540),
    (s_star1, 2, 'The Windowsill Harbor', 660),
    (s_star1, 3, 'A Sky Full of Waves', 720);

  -- Story 2: The Star That Was Missing
  insert into public.stories (novel_id, title, description, story_price, order_index, published, fulfillment_type, free_preview_minutes)
  values (
    n_star,
    'The Star That Was Missing',
    'Sam notices one star is gone. She sails to find where it went.',
    12.99, 2, true, 'physical', 3
  ) returning id into s_star2;

  insert into public.chapters (story_id, chapter_number, title, duration_seconds) values
    (s_star2, 1, 'One Star Short', 600),
    (s_star2, 2, 'The Comet Trail', 780),
    (s_star2, 3, 'The Quiet Corner of the Sky', 720),
    (s_star2, 4, 'Bringing Light Home', 660);


  -- ==========================================================================
  -- NOVEL 3 — The Kindness Kingdom
  -- ==========================================================================
  insert into public.novels (title, description, cover_image, age_group, content_type, theme, published)
  values (
    'The Kindness Kingdom',
    'A land where every act of kindness becomes a flower. Twin siblings tend the royal garden and learn that even small kindnesses grow into wonders.',
    'https://placehold.co/400x600/FB7185/FFFFFF/png?text=Kindness+Kingdom&font=roboto',
    '6-11',
    'audio',
    'friendship',
    true
  ) returning id into n_kind;

  -- Story 1: The Seed a Stranger Gave
  insert into public.stories (novel_id, title, description, story_price, order_index, published, fulfillment_type, free_preview_minutes)
  values (
    n_kind,
    'The Seed a Stranger Gave',
    'Ana and Theo discover that even a small kindness given quietly can grow into something beautiful.',
    16.99, 1, true, 'physical', 4
  ) returning id into s_kind1;

  insert into public.chapters (story_id, chapter_number, title, duration_seconds) values
    (s_kind1, 1, 'The Traveler at the Gate', 720),
    (s_kind1, 2, 'A Seed Held Warm', 660),
    (s_kind1, 3, 'The First Green Leaf', 720),
    (s_kind1, 4, 'A Flower for the Whole Village', 840);

  -- Story 2: The Garden That Would Not Sleep
  insert into public.stories (novel_id, title, description, story_price, order_index, published, fulfillment_type, free_preview_minutes)
  values (
    n_kind,
    'The Garden That Would Not Sleep',
    'The kindnesses are so many the garden refuses winter. The twins learn that rest is a kindness too.',
    16.99, 2, true, 'physical', 4
  ) returning id into s_kind2;

  insert into public.chapters (story_id, chapter_number, title, duration_seconds) values
    (s_kind2, 1, 'A Garden Wide Awake', 600),
    (s_kind2, 2, 'The Tired Rose', 720),
    (s_kind2, 3, 'A Blanket of Snow', 660),
    (s_kind2, 4, 'Roots Grow in the Dark', 780),
    (s_kind2, 5, 'The Spring That Came Back', 720);

end $$;

-- ============================================================================
-- Verify — should return 3 novels, 6 stories, 24 chapters
-- ============================================================================
select
  (select count(*) from public.novels where published = true) as novels_published,
  (select count(*) from public.stories where published = true) as stories_published,
  (select count(*) from public.chapters) as chapters_total;
