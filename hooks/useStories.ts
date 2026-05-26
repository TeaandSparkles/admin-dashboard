import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface Novel {
  id: string;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  novel_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface Chapter {
  id: string;
  story_id: string;
  title: string;
  content?: string | null;
  order_index: number;
  created_at: string;
}

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
          .select("id, title, description, cover_url, created_at, updated_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("stories")
          .select("id, novel_id, title, order_index, created_at")
          .order("order_index", { ascending: true }),
        supabase
          .from("chapters")
          .select("id, story_id, title, order_index, created_at")
          .order("order_index", { ascending: true }),
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

  return {
    novels,
    stories,
    chapters,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}
