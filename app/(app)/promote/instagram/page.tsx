"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Instagram, ExternalLink, Heart, MessageCircle } from "lucide-react";
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

export default function InstagramPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("social_posts")
        .select("id, post_url, caption, media_url, likes, comments, posted_at")
        .eq("platform", "instagram")
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
        title="Instagram Posts"
        description="See your Instagram Business posts. Alerts fire when new comments or mentions land."
        platform="Meta · Instagram Business"
        icon={Instagram}
        color="bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500"
      />

      <ConnectionStatus
        platform="instagram"
        connectHelp="In Meta Developer, add Instagram Basic Display + Instagram Graph API to your app. Convert your Instagram account to a Business account and link it to your Facebook Page. Save the Instagram Business Account ID + Page Token to Vercel env, then Connect."
      />

      <AlertsFeed
        platform="instagram"
        emptyLabel="No new Instagram alerts. Comments and mentions will show here."
      />

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Recent posts ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && posts.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No posts cached yet. Connect Instagram to pull recent content.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {posts.map((p) => (
              <a
                key={p.id}
                href={p.post_url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100"
              >
                {p.media_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.media_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Instagram className="h-6 w-6 text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent opacity-0 transition group-hover:opacity-100">
                  <div className="p-2 text-xs text-white">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {p.likes ?? 0}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {p.comments ?? 0}</span>
                      <ExternalLink className="ml-auto h-3 w-3" />
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
