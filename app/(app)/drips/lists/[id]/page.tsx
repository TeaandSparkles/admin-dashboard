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
import { ChevronLeft, X, Plus, Search, RefreshCw, Sparkles, User as UserIcon } from "lucide-react";

interface DripList {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_smart: boolean;
  smart_rules: Rule[];
  last_refreshed_at: string | null;
}
interface Member {
  user_id: string;
  added_at: string | null;
  user: { username: string; email: string | null } | null;
}
interface User {
  id: string;
  username: string;
  email: string | null;
}
interface Rule {
  attribute: string;
  operator: string;
  value: (string | number)[];
}

const ATTRIBUTES: { key: string; label: string; hint: string }[] = [
  { key: "days_since_signup", label: "Days since signup", hint: "e.g. new users: lte 7" },
  { key: "purchase_count", label: "Purchase count", hint: "e.g. buyers: gte 1" },
  { key: "total_spent", label: "Total spent (USD)", hint: "e.g. high value: gte 30" },
  { key: "days_since_last_purchase", label: "Days since last purchase", hint: "e.g. churned: gte 90" },
  { key: "chapters_started", label: "Chapters started", hint: "" },
  { key: "chapters_completed", label: "Chapters completed", hint: "" },
  { key: "days_since_active", label: "Days since last activity", hint: "e.g. dormant: gte 30" },
  { key: "current_streak", label: "Current streak", hint: "" },
  { key: "longest_streak", label: "Longest streak", hint: "" },
  { key: "referrals_made", label: "Referrals made", hint: "e.g. super refs: gte 3" },
  { key: "emails_sent", label: "Emails sent", hint: "" },
  { key: "emails_opened", label: "Emails opened", hint: "" },
  { key: "emails_clicked", label: "Emails clicked", hint: "" },
  { key: "email_opted_out", label: "Email opted out (bool)", hint: "use is_true / is_false" },
  { key: "email_confirmed", label: "Email confirmed (bool)", hint: "use is_true / is_false" },
  { key: "coin_balance", label: "Coin balance", hint: "" },
];

const OPERATORS: { key: string; label: string; needsValue: boolean }[] = [
  { key: "eq", label: "equals", needsValue: true },
  { key: "neq", label: "not equal", needsValue: true },
  { key: "gt", label: "greater than", needsValue: true },
  { key: "gte", label: "≥", needsValue: true },
  { key: "lt", label: "less than", needsValue: true },
  { key: "lte", label: "≤", needsValue: true },
  { key: "is_true", label: "is true", needsValue: false },
  { key: "is_false", label: "is false", needsValue: false },
  { key: "is_null", label: "is empty", needsValue: false },
  { key: "is_not_null", label: "is set", needsValue: false },
];

export default function ListMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [list, setList] = useState<DripList | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: l }, { data: m }] = await Promise.all([
        supabase.from("drip_lists").select("id, slug, name, description, is_smart, smart_rules, last_refreshed_at").eq("id", id).maybeSingle(),
        supabase.from("drip_list_members").select("user_id, added_at, user:users!user_id(username, email)").eq("list_id", id).order("added_at", { ascending: false }).limit(200),
      ]);
      setList(l as DripList | null);
      setMembers(((m ?? []) as unknown as Member[]));
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    async function searchUsers() {
      const q = search.trim();
      if (!q) { setCandidates([]); return; }
      const { data } = await supabase
        .from("users")
        .select("id, username, email")
        .or(`username.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(15);
      const memberIds = new Set(members.map((m) => m.user_id));
      setCandidates(((data ?? []) as User[]).filter((u) => !memberIds.has(u.id)));
    }
    const timer = setTimeout(searchUsers, 200);
    return () => clearTimeout(timer);
  }, [search, members]);

  async function toggleSmart() {
    if (!list) return;
    const next = !list.is_smart;
    await supabase.from("drip_lists").update({ is_smart: next }).eq("id", id);
    setList({ ...list, is_smart: next });
  }

  async function saveRules(rules: Rule[]) {
    if (!list) return;
    await supabase.from("drip_lists").update({ smart_rules: rules }).eq("id", id);
    setList({ ...list, smart_rules: rules });
  }

  function addRule() {
    if (!list) return;
    saveRules([...(list.smart_rules ?? []), { attribute: "purchase_count", operator: "eq", value: [0] }]);
  }
  function updateRule(idx: number, patch: Partial<Rule>) {
    if (!list) return;
    const next = list.smart_rules.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    saveRules(next);
  }
  function removeRule(idx: number) {
    if (!list) return;
    saveRules(list.smart_rules.filter((_, i) => i !== idx));
  }

  async function refresh() {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await fetch("/api/lists/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list_id: id }),
      });
      const body = await res.json();
      if (res.ok) {
        const [row] = body.result ?? [];
        setRefreshMsg(`✓ Synced — ${row?.added ?? 0} members after re-computing rules`);
        // Reload members
        const { data: m } = await supabase.from("drip_list_members").select("user_id, added_at, user:users!user_id(username, email)").eq("list_id", id).order("added_at", { ascending: false }).limit(200);
        setMembers(((m ?? []) as unknown as Member[]));
        if (list) setList({ ...list, last_refreshed_at: new Date().toISOString() });
      } else {
        setRefreshMsg(`✕ ${body.error ?? "Refresh failed"}`);
      }
    } catch (e) {
      setRefreshMsg(`✕ ${(e as Error).message}`);
    }
    setRefreshing(false);
  }

  async function addMember(u: User) {
    const { error } = await supabase.from("drip_list_members").insert({ list_id: id, user_id: u.id });
    if (error) { alert(error.message); return; }
    setMembers([{ user_id: u.id, added_at: new Date().toISOString(), user: { username: u.username, email: u.email } }, ...members]);
    setCandidates(candidates.filter((c) => c.id !== u.id));
  }

  async function removeMember(user_id: string) {
    await supabase.from("drip_list_members").delete().eq("list_id", id).eq("user_id", user_id);
    setMembers(members.filter((m) => m.user_id !== user_id));
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!list) return (
    <div className="space-y-4">
      <Link href="/drips/lists" className="inline-flex items-center text-sm text-muted-foreground"><ChevronLeft className="mr-1 h-4 w-4" /> Back to lists</Link>
      <p className="text-sm text-red-500">List not found</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/drips/lists" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="mr-1 h-4 w-4" /> Back to lists</Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{list.name}</h1>
            {list.is_smart && (
              <Badge className="gap-1 bg-purple-600 hover:bg-purple-600"><Sparkles className="h-3 w-3" /> Smart</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {list.description ?? "—"} · {members.length} members
            {list.last_refreshed_at && ` · last refreshed ${new Date(list.last_refreshed_at).toLocaleString()}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={toggleSmart} className="gap-1">
          {list.is_smart ? <><UserIcon className="h-3 w-3" /> Convert to manual</> : <><Sparkles className="h-3 w-3" /> Convert to smart</>}
        </Button>
      </div>

      {list.is_smart ? (
        // Smart list — rule builder
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-purple-600" /> Smart rules</CardTitle>
                <CardDescription>All conditions must match (AND). Attributes auto-computed from user activity.</CardDescription>
              </div>
              <Button onClick={refresh} disabled={refreshing} className="gap-1 bg-blue-600 hover:bg-blue-700">
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing…" : "Refresh members"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {refreshMsg && (
              <p className={`rounded-lg px-3 py-2 text-xs ${refreshMsg.startsWith("✓") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {refreshMsg}
              </p>
            )}
            {(list.smart_rules ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No rules yet — all users will match. Add a rule below to filter.
              </p>
            )}
            {(list.smart_rules ?? []).map((r, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 rounded-xl border border-gray-100 bg-white p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                <div>
                  <Label className="text-xs">Attribute</Label>
                  <Select value={r.attribute} onValueChange={(v) => v && updateRule(i, { attribute: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ATTRIBUTES.map((a) => (<SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Operator</Label>
                  <Select value={r.operator} onValueChange={(v) => v && updateRule(i, { operator: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((o) => (<SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    disabled={!OPERATORS.find((o) => o.key === r.operator)?.needsValue}
                    value={r.value?.[0] ?? ""}
                    onChange={(e) => updateRule(i, { value: [e.target.value] })}
                    placeholder="e.g. 7"
                  />
                </div>
                <div className="flex items-end justify-end">
                  <Button variant="ghost" size="sm" onClick={() => removeRule(i)}><X className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addRule} className="w-full gap-1"><Plus className="h-4 w-4" /> Add condition</Button>
          </CardContent>
        </Card>
      ) : (
        // Manual list — user search + add
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Add users</CardTitle><CardDescription>Search by username or email</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="pl-9" />
            </div>
            {candidates.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{c.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email ?? "no email"}</p>
                </div>
                <Button size="sm" onClick={() => addMember(c)} className="gap-1 bg-blue-600 hover:bg-blue-700"><Plus className="h-3 w-3" /> Add</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Members list */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Members ({members.length})</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {members.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No members yet</p>}
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 rounded-lg border border-gray-50 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{m.user?.username ?? "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{m.user?.email ?? "no email"}</p>
              </div>
              <p className="text-xs text-muted-foreground">{m.added_at ? new Date(m.added_at).toLocaleDateString() : ""}</p>
              {!list.is_smart && (
                <Button variant="ghost" size="sm" onClick={() => removeMember(m.user_id)}><X className="h-3 w-3 text-red-500" /></Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
