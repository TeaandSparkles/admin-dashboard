"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music2, ExternalLink, Heart, MessageCircle } from "lucide-react";
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

export default function TikTokPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("social_posts")
        .select("id, post_url, caption, media_url, likes, comments, posted_at")
        .eq("platform", "tiktok")
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
        title="TikTok Posts"
        description="Latest videos posted from your TikTok account and any comments that need a reply."
        platform="TikTok"
        icon={Music2}
        color="bg-gradient-to-br from-cyan-400 via-black to-pink-500"
      />

      <ConnectionStatus
        platform="tiktok"
        connectHelp="Register a TikTok for Developers app → add the Login Kit + Content Posting API scopes → run the OAuth flow to get an access token for your TikTok account. Save it as TIKTOK_ACCESS_TOKEN in Vercel env, then Connect."
      />

      <AlertsFeed
        platform="tiktok"
        emptyLabel="No new TikTok alerts. Comments on your videos will show here."
      />

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Recent videos ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && posts.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No videos cached yet. Connect TikTok to pull recent posts.
            </p>
          )}
          {posts.map((p) => (
            <div key={p.id} className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-gray-100">
                {p.media_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.media_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Music2 className="h-5 w-5 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {p.caption && <p className="text-sm text-gray-700 line-clamp-2">{p.caption}</p>}
                <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {p.likes ?? 0}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {p.comments ?? 0}</span>
                  {p.post_url && (
                    <a href={p.post_url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-blue-600 hover:underline">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
