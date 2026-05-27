"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, CheckCircle2 } from "lucide-react";

interface Novel {
  id: string;
  title: string;
}

export default function NewStoryPage() {
  const router = useRouter();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  // Novel — either pick existing or create new
  const [novelMode, setNovelMode] = useState<"existing" | "new">("existing");
  const [novelId, setNovelId] = useState("");
  const [newNovelTitle, setNewNovelTitle] = useState("");
  const [newNovelDesc, setNewNovelDesc] = useState("");

  // Story
  const [storyTitle, setStoryTitle] = useState("");
  const [storyDesc, setStoryDesc] = useState("");
  const [storyPrice, setStoryPrice] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"digital" | "physical">("digital");
  const [published, setPublished] = useState(false);

  // Optional first chapter
  const [chapterTitle, setChapterTitle] = useState("");

  useEffect(() => {
    async function loadNovels() {
      const { data } = await supabase.from("novels").select("id, title").order("title");
      setNovels((data as Novel[]) ?? []);
    }
    loadNovels();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // 1. Get or create novel
      let finalNovelId = novelId;
      if (novelMode === "new") {
        if (!newNovelTitle.trim()) {
          setError("Novel title is required");
          return;
        }
        const { data: novel, error: nErr } = await supabase
          .from("novels")
          .insert({ title: newNovelTitle.trim(), description: newNovelDesc.trim() || null })
          .select("id")
          .single();
        if (nErr) {
          setError(`Novel: ${nErr.message}`);
          return;
        }
        finalNovelId = novel!.id as string;
      }

      if (!finalNovelId) {
        setError("Pick or create a novel first");
        return;
      }

      // 2. Create story
      if (!storyTitle.trim()) {
        setError("Story title is required");
        return;
      }
      const { data: story, error: sErr } = await supabase
        .from("stories")
        .insert({
          novel_id: finalNovelId,
          title: storyTitle.trim(),
          description: storyDesc.trim() || null,
          story_price: storyPrice ? Number(storyPrice) : null,
          fulfillment_type: fulfillmentType,
          published,
        })
        .select("id")
        .single();

      if (sErr) {
        setError(`Story: ${sErr.message}`);
        return;
      }

      // 3. Optionally create first chapter
      if (chapterTitle.trim()) {
        const { error: cErr } = await supabase.from("chapters").insert({
          story_id: story!.id as string,
          chapter_number: 1,
          title: chapterTitle.trim(),
        });
        if (cErr) {
          setError(`Chapter (story created): ${cErr.message}`);
          return;
        }
      }

      setSaved(true);
      setTimeout(() => router.push("/stories"), 1200);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/stories" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to stories
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Story</h1>
        <p className="text-sm text-muted-foreground">
          Add a new story under an existing novel — or start a fresh novel with it
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" /> Story created · redirecting…
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Novel */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">1. Novel (parent)</CardTitle>
            <CardDescription>Pick an existing novel or create a new one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={novelMode === "existing" ? "default" : "outline"}
                onClick={() => setNovelMode("existing")}
                size="sm"
              >
                Use existing
              </Button>
              <Button
                type="button"
                variant={novelMode === "new" ? "default" : "outline"}
                onClick={() => setNovelMode("new")}
                size="sm"
              >
                Create new
              </Button>
            </div>

            {novelMode === "existing" ? (
              <div className="space-y-2">
                <Label>Novel</Label>
                <Select value={novelId} onValueChange={(v) => v && setNovelId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a novel" />
                  </SelectTrigger>
                  <SelectContent>
                    {novels.map((n) => (
                      <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newNovelTitle">New novel title *</Label>
                  <Input
                    id="newNovelTitle"
                    value={newNovelTitle}
                    onChange={(e) => setNewNovelTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newNovelDesc">Description</Label>
                  <Input
                    id="newNovelDesc"
                    value={newNovelDesc}
                    onChange={(e) => setNewNovelDesc(e.target.value)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Story */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">2. Story details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storyTitle">Title *</Label>
              <Input
                id="storyTitle"
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storyDesc">Description</Label>
              <Input
                id="storyDesc"
                value={storyDesc}
                onChange={(e) => setStoryDesc(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storyPrice">Price (coins)</Label>
                <Input
                  id="storyPrice"
                  type="number"
                  min="0"
                  value={storyPrice}
                  onChange={(e) => setStoryPrice(e.target.value)}
                  placeholder="e.g. 100"
                />
              </div>
              <div className="space-y-2">
                <Label>Fulfillment</Label>
                <Select
                  value={fulfillmentType}
                  onValueChange={(v) => v && setFulfillmentType(v as "digital" | "physical")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="physical">Physical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              <span className="text-sm">Publish immediately (visible in mobile app)</span>
            </label>
          </CardContent>
        </Card>

        {/* Optional chapter */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">3. First chapter (optional)</CardTitle>
            <CardDescription>Add one now or add chapters later from the story detail page</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="chapterTitle">Chapter 1 title</Label>
              <Input
                id="chapterTitle"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="e.g. The Beginning"
              />
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-gray-100" />

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create story"}
          </Button>
          <Link href="/stories">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
