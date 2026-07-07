"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThumbsUp, ExternalLink, Heart, MessageCircle } from "lucide-react";
import { ChannelHeader, ConnectionStatus, AlertsFeed } from "@/components/PromoteChannel";

interface Post {
  id: string;
  post_url: string | null;
  caption: string | null;
  media_url: string | null;
  likes: number | null;
  comments: number | null;
  posted_at: string | null;
}

export default function FacebookPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("social_posts")
        .select("id, post_url, caption, media_url, likes, comments, posted_at")
        .eq("platform", "facebook")
        .order("posted_at", { ascending: false })
        .limit(30);
      setPosts((data as Post[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <ChannelHeader
        title="Facebook Posts"
        description="See every post published to your Facebook Page. Get alerts on comments and mentions that need a reply."
        platform="Meta · Facebook"
        icon={ThumbsUp}
        color="bg-gradient-to-br from-blue-600 to-blue-800"
      />

      <ConnectionStatus
        platform="facebook"
        connectHelp="Create a Meta Developer app → add Facebook Login product → request pages_read_engagement + pages_manage_posts permissions → get long-lived Page Access Token. Save it under Vercel env META_PAGE_TOKEN, then click Connect above. Comments and mentions poll every 5 minutes."
      />

      <AlertsFeed
        platform="facebook"
        emptyLabel="No new Facebook alerts. Comments or mentions on your Page will show here."
      />

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Recent posts ({posts.length})</CardTitle>
          <CardDescription>Latest from your Facebook Page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && posts.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No posts cached yet. Connect Facebook to pull recent posts.
            </p>
          )}
          {posts.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-100 bg-white p-4">
              {p.caption && <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{p.caption}</p>}
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {p.likes ?? 0}</span>
                <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {p.comments ?? 0}</span>
                <span>{p.posted_at ? new Date(p.posted_at).toLocaleDateString() : ""}</span>
                {p.post_url && (
                  <a href={p.post_url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-blue-600 hover:underline">
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
