"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStories } from "@/hooks/useStories";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CATEGORY_TREE, categoryEmoji, genresFor, themesFor } from "@/lib/categories";
import { Plus, Filter, X } from "lucide-react";

type StoryRow = ReturnType<typeof useStories>["stories"][number] & {
  category?: string | null;
  genre?: string | null;
  theme?: string | null;
};

export default function NovelsPage() {
  const { novels, stories, loading, error } = useStories();
  const [search, setSearch] = useState("");
  const [fCategory, setFCategory] = useState<string>("");
  const [fGenre, setFGenre] = useState<string>("");
  const [fTheme, setFTheme] = useState<string>("");

  const novelMap = Object.fromEntries(novels.map((n) => [n.id, n.title]));

  const filtered = useMemo(() => {
    return (stories as StoryRow[]).filter((s) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!s.title.toLowerCase().includes(q) &&
            !(novelMap[s.novel_id ?? ""] ?? "").toLowerCase().includes(q)) return false;
      }
      if (fCategory && s.category !== fCategory) return false;
      if (fGenre && s.genre !== fGenre) return false;
      if (fTheme && s.theme !== fTheme) return false;
      return true;
    });
  }, [stories, search, fCategory, fGenre, fTheme, novelMap]);

  const anyFilter = search || fCategory || fGenre || fTheme;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Novels</h1>
          <p className="text-sm text-muted-foreground">
            {stories.length} novels{anyFilter && ` · ${filtered.length} shown`}
          </p>
        </div>
        <Link href="/stories/new">
          <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Create Novel
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span className="uppercase tracking-widest font-semibold">Search & filter</span>
            {anyFilter && (
              <button
                type="button"
                onClick={() => { setSearch(""); setFCategory(""); setFGenre(""); setFTheme(""); }}
                className="ml-auto inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-200"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <Input
            placeholder="Search by title or parent novel…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Select value={fCategory || "__all__"} onValueChange={(v) => {
              setFCategory(v === "__all__" ? "" : v);
              setFGenre("");
              setFTheme("");
            }}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All categories</SelectItem>
                {CATEGORY_TREE.map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.emoji} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={fGenre || "__all__"}
              onValueChange={(v) => { setFGenre(v === "__all__" ? "" : v); setFTheme(""); }}
              disabled={!fCategory}
            >
              <SelectTrigger><SelectValue placeholder={fCategory ? "Genre" : "Pick category first"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All genres</SelectItem>
                {genresFor(fCategory).map((g) => (
                  <SelectItem key={g.name} value={g.name}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={fTheme || "__all__"}
              onValueChange={(v) => setFTheme(v === "__all__" ? "" : v)}
              disabled={!fGenre}
            >
              <SelectTrigger><SelectValue placeholder={fGenre ? "Theme" : "Pick genre first"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All themes</SelectItem>
                {themesFor(fCategory, fGenre).map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Novels</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <p className="px-6 py-4 text-sm text-red-500">{error}</p>
          )}
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead>Title</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    {anyFilter ? "No novels match your filters" : "No novels yet — create your first with the button above"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((story) => (
                  <TableRow key={story.id} className="border-gray-50 cursor-pointer hover:bg-blue-50/40">
                    <TableCell className="font-medium">
                      <Link href={`/stories/${story.id}`} className="block hover:text-blue-700">
                        {story.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {novelMap[story.novel_id ?? ""] ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {story.category ? (
                        <span className="inline-flex items-center gap-1">
                          <span>{categoryEmoji(story.category)}</span>
                          <span>{story.theme || story.genre || story.category}</span>
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {story.story_price != null ? `$${Number(story.story_price).toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={story.published ? "default" : "secondary"}>
                        {story.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {story.created_at
                        ? new Date(story.created_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
