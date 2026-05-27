"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Sparkles, CheckCircle2, XCircle, Clock } from "lucide-react";

interface ContentVersion {
  id: string;
  chapter_id: string | null;
  story_id: string | null;
  version_number: number;
  prompt_used: string | null;
  generated_text: string | null;
  status: string;
  created_at: string | null;
  approved_at: string | null;
  story: { title: string } | null;
}

interface Story {
  id: string;
  title: string;
}

export default function AIPage() {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Generation form
  const [storyId, setStoryId] = useState("");
  const [prompt, setPrompt] = useState("");

  async function loadData() {
    setLoading(true);
    const [vRes, sRes] = await Promise.all([
      supabase
        .from("content_versions")
        .select("id, chapter_id, story_id, version_number, prompt_used, generated_text, status, created_at, approved_at, story:stories(title)")
        .order("created_at", { ascending: false }),
      supabase.from("stories").select("id, title").order("title"),
    ]);
    if (vRes.error) setError(vRes.error.message);
    else setVersions((vRes.data as unknown as ContentVersion[]) ?? []);
    setStories((sRes.data as Story[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleGenerate() {
    if (!storyId || !prompt.trim()) {
      setError("Pick a story and provide a prompt");
      return;
    }
    setGenerating(true);
    setError(null);

    // Stub: in production this would call an Edge Function that hits
    // OpenAI/Claude and returns generated text. For now we save a stub
    // that admins can review and edit.
    const stubText = `[AI-generated placeholder for prompt: "${prompt}"]

This text will be replaced with real generated content once an Edge Function with an LLM key is configured. The version stays pending until an admin approves it.

To wire up real generation:
1. Create supabase/functions/generate-content/ Edge Function
2. Add your OpenAI / Anthropic API key as a Supabase secret
3. Call supabase.functions.invoke('generate-content', { body: { storyId, prompt } })`;

    const { error: err } = await supabase.from("content_versions").insert({
      story_id: storyId,
      version_number: 1,
      prompt_used: prompt,
      generated_text: stubText,
      status: "pending",
    });

    if (err) setError(err.message);
    else {
      setPrompt("");
      loadData();
    }
    setGenerating(false);
  }

  async function updateStatus(id: string, status: "approved" | "rejected") {
    const patch: { status: string; approved_at?: string } = { status };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    const { error: err } = await supabase
      .from("content_versions")
      .update(patch)
      .eq("id", id);
    if (err) setError(err.message);
    else loadData();
  }

  const filtered = statusFilter === "all" ? versions : versions.filter((v) => v.status === statusFilter);

  const counts = {
    pending: versions.filter((v) => v.status === "pending").length,
    approved: versions.filter((v) => v.status === "approved").length,
    rejected: versions.filter((v) => v.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          AI Story Generation
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate episode drafts, review, and approve before publishing
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {/* Generation form */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Generate new content</CardTitle>
          <CardDescription>Creates a pending version that requires admin approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Story</Label>
            <Select value={storyId} onValueChange={(v) => v && setStoryId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a story" />
              </SelectTrigger>
              <SelectContent>
                {stories.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Write episode 5 — Sarah confronts her father about the missing journal"
            />
          </div>
          <Button onClick={handleGenerate} disabled={generating || !storyId || !prompt.trim()}>
            {generating ? "Generating…" : "Generate"}
          </Button>
        </CardContent>
      </Card>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Pending Review" value={counts.pending} icon={Clock} color="text-yellow-600 bg-yellow-50" />
        <KpiCard label="Approved" value={counts.approved} icon={CheckCircle2} color="text-green-600 bg-green-50" />
        <KpiCard label="Rejected" value={counts.rejected} icon={XCircle} color="text-red-600 bg-red-50" />
      </div>

      <div className="flex justify-end">
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Versions ledger */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Generated Versions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead>Story</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No versions yet — generate your first above
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((v) => (
                  <TableRow key={v.id} className="border-gray-50">
                    <TableCell className="font-medium">{v.story?.title ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {v.prompt_used ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          v.status === "approved"
                            ? "default"
                            : v.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {v.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.created_at ? new Date(v.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {v.status === "pending" && (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(v.id, "approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(v.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
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

function KpiCard({
  label, value, icon: Icon, color,
}: { label: string; value: number; icon: typeof Clock; color: string }) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
