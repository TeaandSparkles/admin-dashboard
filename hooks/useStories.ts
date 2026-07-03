import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

export type Novel = Pick<
  Database["public"]["Tables"]["novels"]["Row"],
  "id" | "title" | "description" | "cover_image" | "created_at" | "published" | "age_group" | "content_type"
>;

export type Story = Pick<
  Database["public"]["Tables"]["stories"]["Row"],
  "id" | "novel_id" | "title" | "order_index" | "created_at" | "published" | "story_price" | "fulfillment_type"
> & {
  category?: string | null;
  genre?: string | null;
  theme?: string | null;
};

export type Chapter = Pick<
  Database["public"]["Tables"]["chapters"]["Row"],
  "id" | "story_id" | "title" | "chapter_number" | "created_at" | "duration_seconds" | "video_url"
>;

interface UseStoriesResult {
  novels: Novel[];
  stories: Story[];
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStories(): UseStoriesResult {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchStories() {
      setLoading(true);
      setError(null);

      const [novelsRes, storiesRes, chaptersRes] = await Promise.all([
        supabase
          .from("novels")
          .select("id, title, description, cover_image, created_at, published, age_group, content_type")
          .order("created_at", { ascending: false }),
        supabase
          .from("stories")
          .select("id, novel_id, title, order_index, created_at, published, story_price, fulfillment_type, category, genre, theme")
          .order("order_index", { ascending: true }),
        supabase
          .from("chapters")
          .select("id, story_id, title, chapter_number, created_at, duration_seconds, video_url")
          .order("chapter_number", { ascending: true }),
      ]);

      if (cancelled) return;

      const firstError = novelsRes.error ?? storiesRes.error ?? chaptersRes.error;
      if (firstError) {
        setError(firstError.message);
      } else {
        setNovels(novelsRes.data ?? []);
        setStories(storiesRes.data ?? []);
        setChapters(chaptersRes.data ?? []);
      }
      setLoading(false);
    }

    fetchStories();
    return () => { cancelled = true; };
  }, [tick]);

  return { novels, stories, chapters, loading, error, refetch: () => setTick((t) => t + 1) };
}
