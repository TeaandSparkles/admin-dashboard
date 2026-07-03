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
import { ChevronLeft, CheckCircle2, Upload, X } from "lucide-react";
import { uploadFile, humanFileSize } from "@/lib/uploadFile";

interface Novel {
  id: string;
  title: string;
}

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
] as const;

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

  // Language & captions
  const [language, setLanguage] = useState("en");
  const [subtitleLangs, setSubtitleLangs] = useState<string[]>(["en"]);
  const [captionMode, setCaptionMode] = useState<"english_only" | "dual" | "native_only">("english_only");

  // Cover image (new novels only)
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Optional first chapter
  const [chapterTitle, setChapterTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");

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
      // 1. Get or create novel (upload cover first if provided)
      let finalNovelId = novelId;
      if (novelMode === "new") {
        if (!newNovelTitle.trim()) {
          setError("Novel title is required");
          return;
        }

        let coverUrl: string | null = null;
        if (coverFile) {
          setUploadStatus(`Uploading cover (${humanFileSize(coverFile.size)})…`);
          try {
            const { publicUrl } = await uploadFile("covers", coverFile, "novels");
            coverUrl = publicUrl;
          } catch (uploadErr) {
            setError(`Cover upload: ${(uploadErr as Error).message}`);
            return;
          }
        }

        const { data: novel, error: nErr } = await supabase
          .from("novels")
          .insert({
            title: newNovelTitle.trim(),
            description: newNovelDesc.trim() || null,
            cover_image: coverUrl,
          })
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
          language,
          subtitle_languages: subtitleLangs,
          caption_mode: captionMode,
        })
        .select("id")
        .single();

      if (sErr) {
        setError(`Story: ${sErr.message}`);
        return;
      }

      // 3. Optionally create first chapter (upload video first if provided)
      if (chapterTitle.trim() || videoFile) {
        let videoUrl: string | null = null;
        if (videoFile) {
          setUploadStatus(`Uploading video (${humanFileSize(videoFile.size)})… please wait`);
          try {
            const { publicUrl } = await uploadFile("media", videoFile, `stories/${story!.id}`);
            videoUrl = publicUrl;
          } catch (uploadErr) {
            setError(`Video upload (story created): ${(uploadErr as Error).message}`);
            return;
          }
        }
        const { error: cErr } = await supabase.from("chapters").insert({
          story_id: story!.id as string,
          chapter_number: 1,
          title: chapterTitle.trim() || "Chapter 1",
          video_url: videoUrl,
        });
        if (cErr) {
          setError(`Chapter (story created): ${cErr.message}`);
          return;
        }
      }
      setUploadStatus("");

      setSaved(true);
      setTimeout(() => router.push("/stories"), 1200);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/stories" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to series
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Series</h1>
        <p className="text-sm text-muted-foreground">
          Add a new series under an existing novel — or start a fresh novel with it. Each series bundles a printed book + audio + AI visuals.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" /> Series created · redirecting…
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
                <div className="space-y-2">
                  <Label>Cover image</Label>
                  <FileDrop
                    file={coverFile}
                    onFile={setCoverFile}
                    accept="image/*"
                    hint="JPG, PNG, WEBP — up to 10 MB"
                    icon="image"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Series */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">2. Series details</CardTitle>
            <CardDescription>What the customer buys — this bundle unlocks lifetime access + a printed book</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storyTitle">Series title *</Label>
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
                <Label htmlFor="storyPrice">Bundle price (USD)</Label>
                <Input
                  id="storyPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={storyPrice}
                  onChange={(e) => setStoryPrice(e.target.value)}
                  placeholder="e.g. 14.99"
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
                    <SelectItem value="physical">Book + digital</SelectItem>
                    <SelectItem value="digital">Digital only</SelectItem>
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

        {/* Language & captions */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">3. Language & captions</CardTitle>
            <CardDescription>What the video file has baked in — audio narration + subtitles. App users see this series only when their flag matches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Narrated audio language *</Label>
              <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Language spoken in the audio track of the uploaded video</p>
            </div>

            <div className="space-y-2">
              <Label>Subtitle tracks in the video</Label>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGE_OPTIONS.map((l) => {
                  const on = subtitleLangs.includes(l.code);
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() =>
                        setSubtitleLangs((prev) =>
                          prev.includes(l.code) ? prev.filter((c) => c !== l.code) : [...prev, l.code]
                        )
                      }
                      className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition ${
                        on ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span className="truncate">{l.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Tick every subtitle track burned into the video file</p>
            </div>

            <div className="space-y-2">
              <Label>Caption mode</Label>
              <Select value={captionMode} onValueChange={(v) => v && setCaptionMode(v as typeof captionMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="english_only">English only — English subtitles regardless of narration</SelectItem>
                  <SelectItem value="dual">Dual — English + native language shown together</SelectItem>
                  <SelectItem value="native_only">Native only — only the narrated language subtitles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Optional chapter */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">4. First chapter (optional)</CardTitle>
            <CardDescription>Add one now or add chapters later from the series detail page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chapterTitle">Chapter 1 title</Label>
              <Input
                id="chapterTitle"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="e.g. The Beginning"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Video file{" "}
                <span className="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  {LANGUAGE_OPTIONS.find((l) => l.code === language)?.flag} {language.toUpperCase()} audio
                </span>
              </Label>
              <FileDrop
                file={videoFile}
                onFile={setVideoFile}
                accept="video/*,audio/*"
                hint="MP4, WebM, MOV, MP3, WAV — up to 500 MB. Language & captions are tagged from section 3."
                icon="video"
              />
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-gray-100" />

        {uploadStatus && (
          <p className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700">{uploadStatus}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create series"}
          </Button>
          <Link href="/stories">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

function FileDrop({
  file,
  onFile,
  accept,
  hint,
  icon,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
  accept: string;
  hint: string;
  icon: "image" | "video";
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 p-4">
      {file ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Upload className="h-4 w-4 shrink-0 text-indigo-500" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-muted-foreground">{humanFileSize(file.size)} · {file.type || "file"}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onFile(null)}
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1 py-3 text-center hover:bg-gray-50 rounded-lg transition">
          <Upload className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">
            Click to upload {icon === "image" ? "an image" : "a video or audio file"}
          </span>
          <span className="text-xs text-muted-foreground">{hint}</span>
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              onFile(f);
            }}
          />
        </label>
      )}
    </div>
  );
}
