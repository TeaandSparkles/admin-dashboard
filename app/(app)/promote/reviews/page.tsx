"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink, MessageSquare } from "lucide-react";
import {
  ChannelHeader,
  ConnectionStatus,
  AlertsFeed,
} from "@/components/PromoteChannel";

interface Review {
  id: string;
  reviewer_name: string | null;
  reviewer_photo: string | null;
  rating: number | null;
  comment: string | null;
  review_url: string | null;
  responded: boolean;
  created_at: string | null;
}

export default function GoogleReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("google_reviews")
        .select("id, reviewer_name, reviewer_photo, rating, comment, review_url, responded, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      setReviews((data as Review[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function markResponded(id: string) {
    await supabase
      .from("google_reviews")
      .update({ responded: true, responded_at: new Date().toISOString() })
      .eq("id", id);
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, responded: true } : r)));
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <ChannelHeader
        title="Google Reviews"
        description="Track every review left on your Google Business Profile. Get alerts when a new one lands so you can respond quickly."
        platform="Google Business Profile"
        icon={Star}
        color="bg-gradient-to-br from-yellow-400 to-orange-500"
      />

      <ConnectionStatus
        platform="google"
        connectHelp="Register your Google Business Profile in Google Cloud Console → enable the My Business API, create OAuth credentials, and add the client ID/secret to your Vercel env vars (GOOGLE_MYBUSINESS_CLIENT_ID / SECRET). Then click Connect above. Google reviews poll every 15 minutes and drop new items into Alerts."
      />

      <AlertsFeed
        platform="google"
        emptyLabel="No new review alerts. When someone leaves a Google review, it'll show here."
      />

      {/* Full review list */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">All reviews ({reviews.length})</CardTitle>
          <CardDescription>Every review pulled from Google, newest first</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && reviews.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm font-medium">No reviews yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Once you connect Google Business Profile, reviews will populate here.
              </p>
            </div>
          )}
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border p-4 ${
                r.responded ? "border-gray-100 bg-white" : "border-amber-200 bg-amber-50/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{r.reviewer_name ?? "Anonymous"}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3 w-3 ${
                            (r.rating ?? 0) >= n ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    {!r.responded && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">Needs reply</span>}
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-gray-700 leading-relaxed">{r.comment}</p>}
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {r.review_url && (
                    <a
                      href={r.review_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-700"
                    >
                      Reply <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {!r.responded && (
                    <Button size="sm" variant="outline" onClick={() => markResponded(r.id)}>
                      Mark replied
                    </Button>
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
