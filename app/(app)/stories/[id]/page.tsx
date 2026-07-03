"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { uploadFile, humanFileSize } from "@/lib/uploadFile";
import { CATEGORY_TREE, genresFor, themesFor } from "@/lib/categories";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, CheckCircle2, Upload, X, Trash2, Plus, Image as ImageIcon } from "lucide-react";

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

interface Story {
  id: string;
  novel_id: string | null;
  title: string;
  description: string | null;
  story_price: number | null;
  fulfillment_type: string | null;
  published: boolean | null;
  language: string;
  subtitle_languages: string[];
  caption_mode: string;
  category: string | null;
  genre: string | null;
  theme: string | null;
}

interface Novel {
  id: string;
  title: string;
  cover_image: string | null;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title: string | null;
  video_url: string | null;
}

export default function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [story, setStory] = useState<Story | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");

  // New chapter draft
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterVideo, setNewChapterVideo] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: s, error: sErr } = await supabase
        .from("stories")
        .select("id, novel_id, title, description, story_price, fulfillment_type, published, language, subtitle_languages, caption_mode, category, genre, theme")
        .eq("id", id)
        .single();
      if (sErr) { setError(sErr.message); setLoading(false); return; }
      setStory(s as Story);

      if (s?.novel_id) {
        const { data: n } = await supabase
          .from("novels")
          .select("id, title, cover_image")
          .eq("id", s.novel_id)
          .single();
        setNovel(n as Novel);
      }

      const { data: c } = await supabase
        .from("chapters")
        .select("id, chapter_number, title, video_url")
        .eq("story_id", id)
        .order("chapter_number");
      setChapters((c ?? []) as Chapter[]);

      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSave() {
    if (!story) return;
    setSaving(true);
    setError(null);
    try {
      // Novel cover update if changed
      if (novel && newCoverFile) {
        setUploadStatus(`Uploading cover (${humanFileSize(newCoverFile.size)})…`);
        const { publicUrl } = await uploadFile("covers", newCoverFile, "novels");
        await supabase.from("novels").update({ cover_image: publicUrl }).eq("id", novel.id);
        setNovel({ ...novel, cover_image: publicUrl });
        setNewCoverFile(null);
      }

      setUploadStatus("Saving series…");
      const { error: uErr } = await supabase
        .from("stories")
        .update({
          title: story.title.trim(),
          description: story.description?.trim() || null,
          story_price: story.story_price,
          fulfillment_type: story.fulfillment_type,
          published: story.published,
          language: story.language,
          subtitle_languages: story.subtitle_languages,
          caption_mode: story.caption_mode,
          category: story.category,
          genre: story.genre,
          theme: story.theme,
        })
        .eq("id", story.id);
      if (uErr) throw uErr;

      setSaved(true);
      setUploadStatus("");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddChapter() {
    if (!story) return;
    if (!newChapterTitle.trim() && !newChapterVideo) return;
    setSaving(true);
    setError(null);
    try {
      let videoUrl: string | null = null;
      if (newChapterVideo) {
        setUploadStatus(`Uploading video (${humanFileSize(newChapterVideo.size)})…`);
        const { publicUrl } = await uploadFile("media", newChapterVideo, `stories/${story.id}`);
        videoUrl = publicUrl;
      }
      const nextNumber = (chapters.at(-1)?.chapter_number ?? 0) + 1;
      const { data: created, error: cErr } = await supabase
        .from("chapters")
        .insert({
          story_id: story.id,
          chapter_number: nextNumber,
          title: newChapterTitle.trim() || `Chapter ${nextNumber}`,
          video_url: videoUrl,
        })
        .select("id, chapter_number, title, video_url")
        .single();
      if (cErr) throw cErr;
      setChapters([...chapters, created as Chapter]);
      setNewChapterTitle("");
      setNewChapterVideo(null);
      setUploadStatus("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteChapter(chapterId: string) {
    if (!confirm("Delete this chapter? This cannot be undone.")) return;
    const { error: dErr } = await supabase.from("chapters").delete().eq("id", chapterId);
    if (dErr) { setError(dErr.message); return; }
    setChapters(chapters.filter((c) => c.id !== chapterId));
  }

  async function handleReplaceChapterVideo(chapterId: string, file: File) {
    if (!story) return;
    setSaving(true);
    setError(null);
    try {
      setUploadStatus(`Uploading video (${humanFileSize(file.size)})…`);
      const { publicUrl } = await uploadFile("media", file, `stories/${story.id}`);
      await supabase.from("chapters").update({ video_url: publicUrl }).eq("id", chapterId);
      setChapters(chapters.map((c) => (c.id === chapterId ? { ...c, video_url: publicUrl } : c)));
      setUploadStatus("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!story) return <p className="text-sm text-red-500">{error ?? "Novel not found"}</p>;

  const langLabel = LANGUAGE_OPTIONS.find((l) => l.code === story.language);

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/stories" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to novels
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{story.title}</h1>
          <p className="text-sm text-muted-foreground">
            {novel?.title ?? "—"} · {langLabel?.flag} {langLabel?.label}
          </p>
        </div>
        <Badge variant={story.published ? "default" : "secondary"}>
          {story.published ? "Published" : "Draft"}
        </Badge>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" /> Saved
        </div>
      )}

      {/* Novel cover */}
      {novel && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Novel cover — {novel.title}</CardTitle>
            <CardDescription>Shown on every card that belongs to this novel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {novel.cover_image ? (
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={novel.cover_image}
                  alt=""
                  className="h-24 w-24 rounded-xl object-cover"
                />
                <div className="text-xs text-muted-foreground break-all">{novel.cover_image}</div>
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
            <FileDrop
              file={newCoverFile}
              onFile={setNewCoverFile}
              accept="image/*"
              hint="Upload a replacement (JPG, PNG, WEBP, up to 10 MB)"
              icon="image"
            />
          </CardContent>
        </Card>
      )}

      {/* Novel details */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Novel details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Novel title *</Label>
            <Input value={story.title} onChange={(e) => setStory({ ...story, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={story.description ?? ""}
              onChange={(e) => setStory({ ...story, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bundle price (USD)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={story.story_price ?? ""}
                onChange={(e) =>
                  setStory({ ...story, story_price: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fulfillment</Label>
              <Select
                value={story.fulfillment_type ?? "digital"}
                onValueChange={(v) => v && setStory({ ...story, fulfillment_type: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              checked={!!story.published}
              onChange={(e) => setStory({ ...story, published: e.target.checked })}
            />
            <span className="text-sm">Publish (visible in mobile app)</span>
          </label>
        </CardContent>
      </Card>

      {/* Category */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Category</CardTitle>
          <CardDescription>Where this novel lives in the store & search</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={story.category || "__none__"}
                onValueChange={(v) => {
                  const val = v === "__none__" ? null : v;
                  setStory({ ...story, category: val, genre: null, theme: null });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {CATEGORY_TREE.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.emoji} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Genre</Label>
              <Select
                value={story.genre || "__none__"}
                onValueChange={(v) => {
                  const val = v === "__none__" ? null : v;
                  setStory({ ...story, genre: val, theme: null });
                }}
                disabled={!story.category}
              >
                <SelectTrigger><SelectValue placeholder={story.category ? "Pick" : "Pick category first"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {genresFor(story.category ?? "").map((g) => (
                    <SelectItem key={g.name} value={g.name}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={story.theme || "__none__"}
                onValueChange={(v) => setStory({ ...story, theme: v === "__none__" ? null : v })}
                disabled={!story.genre}
              >
                <SelectTrigger><SelectValue placeholder={story.genre ? "Pick" : "Pick genre first"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {themesFor(story.category ?? "", story.genre ?? "").map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language & captions */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Language & captions</CardTitle>
          <CardDescription>App users see this series when their flag matches</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Narrated audio language *</Label>
            <Select value={story.language} onValueChange={(v) => v && setStory({ ...story, language: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subtitle tracks in the video</Label>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGE_OPTIONS.map((l) => {
                const on = story.subtitle_languages.includes(l.code);
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() =>
                      setStory({
                        ...story,
                        subtitle_languages: on
                          ? story.subtitle_languages.filter((c) => c !== l.code)
                          : [...story.subtitle_languages, l.code],
                      })
                    }
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition ${
                      on
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span className="truncate">{l.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Caption mode</Label>
            <Select
              value={story.caption_mode}
              onValueChange={(v) => v && setStory({ ...story, caption_mode: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="english_only">English only</SelectItem>
                <SelectItem value="dual">Dual — English + native</SelectItem>
                <SelectItem value="native_only">Native only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Chapters */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Chapters ({chapters.length})</CardTitle>
          <CardDescription>Each chapter is one baked video with audio + subtitles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {chapters.length === 0 && (
            <p className="text-sm text-muted-foreground">No chapters yet — add the first below.</p>
          )}
          {chapters.map((ch) => (
            <div key={ch.id} className="rounded-xl border border-gray-100 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    Chapter {ch.chapter_number} — {ch.title ?? `Chapter ${ch.chapter_number}`}
                  </p>
                  {ch.video_url ? (
                    <p className="text-xs text-muted-foreground break-all">{ch.video_url}</p>
                  ) : (
                    <p className="text-xs text-amber-600">No video uploaded yet</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteChapter(ch.id)}
                  aria-label="Delete chapter"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                {ch.video_url ? "Replace video" : "Upload video"}
                <input
                  type="file"
                  accept="video/*,audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleReplaceChapterVideo(ch.id, f);
                  }}
                />
              </label>
            </div>
          ))}

          <Separator className="bg-gray-100 my-2" />

          {/* Add chapter */}
          <div className="space-y-3 rounded-xl border border-dashed border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Add a new chapter</p>
            <Input
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Chapter title (optional)"
            />
            <FileDrop
              file={newChapterVideo}
              onFile={setNewChapterVideo}
              accept="video/*,audio/*"
              hint={`Baked ${langLabel?.flag} ${story.language.toUpperCase()} video — up to 500 MB`}
              icon="video"
            />
            <Button type="button" onClick={handleAddChapter} size="sm" className="gap-1" disabled={saving}>
              <Plus className="h-4 w-4" /> Add chapter
            </Button>
          </div>
        </CardContent>
      </Card>

      {uploadStatus && (
        <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">{uploadStatus}</p>
      )}

      <div className="flex gap-3">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/stories")}>Done</Button>
      </div>
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
            <Upload className="h-4 w-4 shrink-0 text-blue-500" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-muted-foreground">{humanFileSize(file.size)}</p>
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
