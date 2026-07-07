"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, CheckCircle2, Plus, X, ArrowUp, ArrowDown, Clock } from "lucide-react";

interface Campaign {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  trigger_event: string;
  trigger_list_id: string | null;
  enabled: boolean;
}
interface Step {
  id: string;
  campaign_id: string;
  order_index: number;
  template_key: string;
  delay_hours: number;
  subject_override: string | null;
  enabled: boolean;
}
interface Template { key: string; subject: string }
interface DripList { id: string; name: string }
interface Enrollment {
  id: string;
  current_step: number;
  next_send_at: string | null;
  status: string;
  last_sent_at: string | null;
  user: { username: string; email: string | null } | null;
}

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [c, setC] = useState<Campaign | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [lists, setLists] = useState<DripList[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: s }, { data: t }, { data: l }, { data: e }] = await Promise.all([
        supabase.from("drip_campaigns").select("id, slug, name, description, trigger_event, trigger_list_id, enabled").eq("id", id).maybeSingle(),
        supabase.from("drip_steps").select("id, campaign_id, order_index, template_key, delay_hours, subject_override, enabled").eq("campaign_id", id).order("order_index"),
        supabase.from("email_templates").select("key, subject").order("key"),
        supabase.from("drip_lists").select("id, name").order("name"),
        supabase.from("drip_enrollments").select("id, current_step, next_send_at, status, last_sent_at, user:users!user_id(username, email)").eq("campaign_id", id).order("enrolled_at", { ascending: false }).limit(50),
      ]);
      setC(c as Campaign | null);
      setSteps((s as Step[]) ?? []);
      setTemplates((t as Template[]) ?? []);
      setLists((l as DripList[]) ?? []);
      setEnrollments(((e ?? []) as unknown as Enrollment[]));
      setLoading(false);
    }
    load();
  }, [id]);

  async function saveCampaign() {
    if (!c) return;
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("drip_campaigns").update({
      name: c.name,
      description: c.description,
      trigger_event: c.trigger_event,
      trigger_list_id: c.trigger_list_id,
      enabled: c.enabled,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (err) setError(err.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  }

  async function addStep() {
    const next = (steps.at(-1)?.order_index ?? -1) + 1;
    const { data, error: err } = await supabase.from("drip_steps").insert({
      campaign_id: id,
      order_index: next,
      template_key: templates[0]?.key ?? "welcome",
      delay_hours: 24,
      enabled: true,
    }).select().single();
    if (err) { setError(err.message); return; }
    setSteps([...steps, data as Step]);
  }

  async function updateStep(stepId: string, patch: Partial<Step>) {
    await supabase.from("drip_steps").update(patch).eq("id", stepId);
    setSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, ...patch } : s)));
  }

  async function removeStep(stepId: string) {
    if (!confirm("Delete this step? Users mid-flight will skip it on the next tick.")) return;
    await supabase.from("drip_steps").delete().eq("id", stepId);
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
  }

  async function moveStep(stepId: string, direction: "up" | "down") {
    const idx = steps.findIndex((s) => s.id === stepId);
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= steps.length) return;
    const a = steps[idx];
    const b = steps[swap];
    await supabase.from("drip_steps").update({ order_index: b.order_index }).eq("id", a.id);
    await supabase.from("drip_steps").update({ order_index: a.order_index }).eq("id", b.id);
    const copy = [...steps];
    copy[idx] = { ...b, order_index: a.order_index };
    copy[swap] = { ...a, order_index: b.order_index };
    setSteps(copy.sort((x, y) => x.order_index - y.order_index));
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!c) return (
    <div className="space-y-4">
      <Link href="/drips" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to campaigns
      </Link>
      <p className="text-sm text-red-500">Campaign not found</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/drips" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to campaigns
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
          <p className="text-sm text-muted-foreground">Slug: <code className="text-xs">{c.slug}</code></p>
        </div>
        <Badge className={c.enabled ? "bg-green-600" : "bg-gray-400"}>{c.enabled ? "Active" : "Paused"}</Badge>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {saved && <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"><CheckCircle2 className="h-4 w-4" /> Saved</div>}

      {/* Campaign settings */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Campaign settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" checked={c.enabled} onChange={(e) => setC({ ...c, enabled: e.target.checked })} />
            <span className="text-sm">Enabled (drips fire on schedule)</span>
          </label>
          <div className="space-y-2"><Label>Name</Label><Input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label><Input value={c.description ?? ""} onChange={(e) => setC({ ...c, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select value={c.trigger_event} onValueChange={(v) => v && setC({ ...c, trigger_event: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="signup">On signup (automatic)</SelectItem>
                  <SelectItem value="purchase">On first purchase (automatic)</SelectItem>
                  <SelectItem value="list">When user joins list</SelectItem>
                  <SelectItem value="manual">Manual only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {c.trigger_event === "list" && (
              <div className="space-y-2">
                <Label>Trigger list</Label>
                <Select value={c.trigger_list_id ?? "__none__"} onValueChange={(v) => setC({ ...c, trigger_list_id: v === "__none__" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Pick a list" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {lists.map((l) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button onClick={saveCampaign} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? "Saving…" : "Save campaign"}
          </Button>
        </CardContent>
      </Card>

      {/* Sequence editor */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Email sequence ({steps.length})</CardTitle>
          <CardDescription>Delay is measured from the previous step (or trigger for step 1). Each step edits inline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No steps yet. Add one below.</p>}
          {steps.map((s, idx) => (
            <div key={s.id} className="rounded-xl border border-gray-100 bg-white p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Step {idx + 1}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {idx === 0 ? "on trigger" : `+${s.delay_hours}h after step ${idx}`}
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => moveStep(s.id, "up")} disabled={idx === 0}><ArrowUp className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => moveStep(s.id, "down")} disabled={idx === steps.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => removeStep(s.id)}><X className="h-3 w-3 text-red-500" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Template</Label>
                  <Select value={s.template_key} onValueChange={(v) => v && updateStep(s.id, { template_key: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (<SelectItem key={t.key} value={t.key}>{t.key} — {t.subject}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Delay (hours)</Label>
                  <Input type="number" min="0" value={s.delay_hours}
                    onChange={(e) => updateStep(s.id, { delay_hours: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input type="checkbox" className="h-3.5 w-3.5" checked={s.enabled} onChange={(e) => updateStep(s.id, { enabled: e.target.checked })} />
                Step enabled
              </label>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addStep} className="w-full gap-1"><Plus className="h-4 w-4" /> Add step</Button>
        </CardContent>
      </Card>

      {/* Enrollments */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Currently enrolled ({enrollments.length})</CardTitle>
          <CardDescription>Users in flight — includes paused / completed / unsubscribed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {enrollments.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No enrollments yet</p>}
          {enrollments.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-lg border border-gray-50 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{e.user?.username ?? e.user?.email ?? "unknown"}</p>
                <p className="text-xs text-muted-foreground">
                  Step {e.current_step + 1} · {e.next_send_at ? `next ${new Date(e.next_send_at).toLocaleString()}` : "no schedule"}
                </p>
              </div>
              <EnrollmentBadge status={e.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function EnrollmentBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    active: "bg-green-600 hover:bg-green-600",
    paused: "bg-amber-500 hover:bg-amber-500",
    completed: "bg-blue-600 hover:bg-blue-600",
    unsubscribed: "bg-gray-400 hover:bg-gray-400",
  };
  return <Badge className={m[status] ?? "bg-gray-500"}>{status}</Badge>;
}
