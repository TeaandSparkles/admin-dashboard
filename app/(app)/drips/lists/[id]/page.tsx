"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, X, Plus, Search } from "lucide-react";

interface DripList {
  id: string;
  slug: string;
  name: string;
  description: string | null;
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

export default function ListMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [list, setList] = useState<DripList | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: l }, { data: m }] = await Promise.all([
        supabase.from("drip_lists").select("id, slug, name, description").eq("id", id).maybeSingle(),
        supabase.from("drip_list_members").select("user_id, added_at, user:users!user_id(username, email)").eq("list_id", id).order("added_at", { ascending: false }),
      ]);
      setList(l as DripList | null);
      setMembers(((m ?? []) as unknown as Member[]));
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    async function search_users() {
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
    const timer = setTimeout(search_users, 200);
    return () => clearTimeout(timer);
  }, [search, members]);

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
    <div className="space-y-6 max-w-3xl">
      <Link href="/drips/lists" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="mr-1 h-4 w-4" /> Back to lists</Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{list.name}</h1>
        <p className="text-sm text-muted-foreground">{list.description ?? "—"} · {members.length} members</p>
      </div>

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

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Members</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {members.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No members yet</p>}
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 rounded-lg border border-gray-50 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{m.user?.username ?? "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{m.user?.email ?? "no email"}</p>
              </div>
              <p className="text-xs text-muted-foreground">{m.added_at ? new Date(m.added_at).toLocaleDateString() : ""}</p>
              <Button variant="ghost" size="sm" onClick={() => removeMember(m.user_id)}><X className="h-3 w-3 text-red-500" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
