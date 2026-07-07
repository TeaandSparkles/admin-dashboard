"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, MoveRight } from "lucide-react";

interface DripList {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}
interface Count { list_id: string; count: number }

export default function DripListsPage() {
  const [rows, setRows] = useState<DripList[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    async function load() {
      const [{ data }, { data: mem }] = await Promise.all([
        supabase.from("drip_lists").select("id, slug, name, description").order("name"),
        supabase.from("drip_list_members").select("list_id"),
      ]);
      setRows((data as DripList[]) ?? []);
      const map: Record<string, number> = {};
      for (const m of (mem ?? []) as { list_id: string }[]) {
        map[m.list_id] = (map[m.list_id] ?? 0) + 1;
      }
      setCounts(map);
      setLoading(false);
    }
    load();
  }, []);

  async function createList() {
    const name = newName.trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    setCreating(true);
    const { data, error } = await supabase.from("drip_lists").insert({ slug, name, description: null }).select().single();
    setCreating(false);
    if (error) { alert(error.message); return; }
    setRows((prev) => [...prev, data as DripList].sort((a, b) => a.name.localeCompare(b.name)));
    setNewName("");
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Audience Lists</h1>
            <p className="text-sm text-muted-foreground">Bundle users into segments you can target with drips.</p>
          </div>
        </div>
      </div>

      {/* New list */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">New list</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Launch Waitlist" onKeyDown={(e) => e.key === "Enter" && createList()} />
          <Button onClick={createList} disabled={creating || !newName.trim()} className="gap-1 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" /> Create</Button>
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {rows.map((l) => (
          <Link key={l.id} href={`/drips/lists/${l.id}`}>
            <Card className="cursor-pointer rounded-2xl border-0 shadow-sm transition hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{l.name}</CardTitle>
                {l.description && <CardDescription>{l.description}</CardDescription>}
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-blue-700">{counts[l.id] ?? 0}</span> members
                </span>
                <MoveRight className="h-4 w-4 text-blue-500" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
