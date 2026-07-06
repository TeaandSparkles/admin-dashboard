"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ChevronLeft, Send } from "lucide-react";

interface Template {
  key: string;
  subject: string;
  html_body: string;
  text_body: string;
  from_name: string;
  from_email: string;
  enabled: boolean;
  updated_at: string | null;
}

export default function EditTemplatePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);
  const [t, setT] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test send
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("email_templates")
        .select("key, subject, html_body, text_body, from_name, from_email, enabled, updated_at")
        .eq("key", key)
        .maybeSingle();
      if (error) setError(error.message);
      else setT(data as Template | null);
      setLoading(false);
    }
    load();
  }, [key]);

  async function handleSave() {
    if (!t) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("email_templates")
      .update({
        subject: t.subject,
        html_body: t.html_body,
        text_body: t.text_body,
        from_name: t.from_name,
        from_email: t.from_email,
        enabled: t.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("key", key);
    if (err) setError(err.message);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function handleSendTest() {
    if (!testEmail.trim()) return;
    setSending(true);
    setSendMsg(null);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_key: key,
          to_email: testEmail.trim(),
          variables: {
            user_name: "Jeana",
            novel_title: "The Whispering Woods",
            amount: "$14.99",
            order_id: "TEST-1234",
            tracking_number: "1Z999AA10123456784",
            coins: 10,
            streak_days: 5,
          },
        }),
      });
      const body = await res.json();
      if (res.ok) setSendMsg(`✓ Sent (id ${body.id ?? "—"})`);
      else setSendMsg(`✕ ${body.error ?? "Send failed"}`);
    } catch (e) {
      setSendMsg(`✕ ${(e as Error).message}`);
    }
    setSending(false);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!t) {
    return (
      <div className="space-y-4">
        <Link href="/auto/templates" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to templates
        </Link>
        <p className="text-sm text-red-500">{error ?? "Template not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/auto/templates" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to templates
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{key.replace(/_/g, " ")}</h1>
        <p className="text-sm text-muted-foreground">
          Edit subject and body. Use <code className="text-xs">{"{{user_name}}"}</code>,{" "}
          <code className="text-xs">{"{{novel_title}}"}</code>, etc — the trigger fills them in.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" /> Saved
        </div>
      )}

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={t.enabled}
              onChange={(e) => setT({ ...t, enabled: e.target.checked })}
            />
            <span className="text-sm">Enabled (triggers can fire this template)</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>From name</Label>
              <Input value={t.from_name} onChange={(e) => setT({ ...t, from_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>From email</Label>
              <Input value={t.from_email} onChange={(e) => setT({ ...t, from_email: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={t.subject} onChange={(e) => setT({ ...t, subject: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>HTML body</Label>
            <textarea
              value={t.html_body}
              onChange={(e) => setT({ ...t, html_body: e.target.value })}
              rows={10}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Plain text body (fallback)</Label>
            <textarea
              value={t.text_body}
              onChange={(e) => setT({ ...t, text_body: e.target.value })}
              rows={6}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test send */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Send a test</CardTitle>
          <CardDescription>Send this template to yourself with placeholder variables filled in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your@email.com"
              type="email"
            />
            <Button onClick={handleSendTest} disabled={sending || !testEmail.trim()} className="gap-1 bg-teal-600 hover:bg-teal-700">
              <Send className="h-4 w-4" />
              {sending ? "Sending…" : "Send test"}
            </Button>
          </div>
          {sendMsg && (
            <p className={`rounded-lg px-3 py-2 text-xs ${
              sendMsg.startsWith("✓") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
            }`}>
              {sendMsg}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
