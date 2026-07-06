"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, MessageSquare, FileText, Shield, MailQuestion } from "lucide-react";

const CONTENT_KEYS = ["contact", "terms", "privacy", "feedback"] as const;
type ContentKey = (typeof CONTENT_KEYS)[number];

const META: Record<ContentKey, { title: string; description: string; icon: typeof FileText }> = {
  contact: {
    title: "Contact Us",
    description: "The message people see on your Contact page — reachable via /contact on the public site.",
    icon: MessageSquare,
  },
  terms: {
    title: "Terms of Service",
    description: "Legal terms customers agree to when they use the app or buy a novel.",
    icon: FileText,
  },
  privacy: {
    title: "Privacy Policy",
    description: "What data you collect, how you use it, and how customers can control it.",
    icon: Shield,
  },
  feedback: {
    title: "Feedback",
    description: "Message shown when a user opens the feedback form or replies to your outreach.",
    icon: MailQuestion,
  },
};

interface Row {
  key: string;
  title: string;
  body: string;
  updated_at: string | null;
}

export default function EditContentPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);
  if (!CONTENT_KEYS.includes(key as ContentKey)) notFound();
  const meta = META[key as ContentKey];
  const Icon = meta.icon;

  const [row, setRow] = useState<Row | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_content")
        .select("key, title, body, updated_at")
        .eq("key", key)
        .maybeSingle();
      if (error) {
        setError(error.message);
      } else if (data) {
        setRow(data as Row);
        setTitle(data.title);
        setBody(data.body);
      } else {
        setTitle(meta.title);
        setBody("");
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const { data, error: err } = await supabase
      .from("site_content")
      .upsert(
        {
          key,
          title: title.trim() || meta.title,
          body,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      .select("key, title, body, updated_at")
      .single();
    if (err) {
      setError(err.message);
    } else {
      setRow(data as Row);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="mb-2 flex flex-wrap gap-2 text-xs">
          {CONTENT_KEYS.map((k) => (
            <Link
              key={k}
              href={`/content/${k}`}
              className={`rounded-full px-3 py-1 font-medium transition ${
                k === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {META[k].title}
            </Link>
          ))}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{meta.title}</h1>
        <p className="text-sm text-muted-foreground">{meta.description}</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" /> Saved successfully
        </div>
      )}

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-4 w-4 text-blue-600" />
            Edit content
          </CardTitle>
          {row?.updated_at && (
            <CardDescription>
              Last updated {new Date(row.updated_at).toLocaleString()}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Page title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={loading}
              rows={16}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed focus:border-blue-500 focus:outline-none disabled:opacity-50"
              placeholder="Write in plain text or Markdown — line breaks preserved."
            />
            <p className="text-xs text-muted-foreground">
              Plain text or Markdown. Blank lines separate paragraphs on the public page.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || loading} className="bg-blue-600 hover:bg-blue-700">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live preview */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
          <CardDescription>How the body renders on the public page.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h2>{title || meta.title}</h2>
            {body
              .split(/\n{2,}/)
              .map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            {body.trim() === "" && (
              <p className="italic text-muted-foreground">Empty — write something above.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
