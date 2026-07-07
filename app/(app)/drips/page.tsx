"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Play, Pause, Plus, Users, Mail, MoveRight } from "lucide-react";

interface Campaign {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  trigger_event: string;
  enabled: boolean;
  updated_at: string | null;
}

interface EnrollmentCount { campaign_id: string; count: number }

const TRIGGER_LABEL: Record<string, string> = {
  signup: "Auto: on signup",
  purchase: "Auto: on first purchase",
  list: "Auto: joins list",
  manual: "Manual",
};
const TRIGGER_COLOR: Record<string, string> = {
  signup: "bg-blue-500 hover:bg-blue-500",
  purchase: "bg-green-600 hover:bg-green-600",
  list: "bg-purple-600 hover:bg-purple-600",
  manual: "bg-gray-500 hover:bg-gray-500",
};

export default function DripCampaignsPage() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data }, { data: enr }] = await Promise.all([
        supabase.from("drip_campaigns").select("id, slug, name, description, trigger_event, enabled, updated_at").order("name"),
        supabase.from("drip_enrollments").select("campaign_id").eq("status", "active"),
      ]);
      setRows((data as Campaign[]) ?? []);
      const map: Record<string, number> = {};
      for (const e of (enr ?? []) as { campaign_id: string }[]) {
        map[e.campaign_id] = (map[e.campaign_id] ?? 0) + 1;
      }
      setCounts(map);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleEnabled(c: Campaign) {
    const next = !c.enabled;
    await supabase.from("drip_campaigns").update({ enabled: next, updated_at: new Date().toISOString() }).eq("id", c.id);
    setRows((prev) => prev.map((r) => (r.id === c.id ? { ...r, enabled: next } : r)));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Drip Campaigns</h1>
              <p className="text-sm text-muted-foreground">Sequences of emails sent on a schedule after a trigger fires.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No campaigns yet. Run Migration 1g to seed the defaults.</p>
        )}
        {rows.map((c) => (
          <Card key={c.id} className={`rounded-2xl border-0 shadow-sm transition ${c.enabled ? "" : "opacity-70"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link href={`/drips/${c.id}`}>
                    <CardTitle className="text-base hover:text-blue-700">{c.name}</CardTitle>
                  </Link>
                  <CardDescription className="line-clamp-2 mt-1">{c.description}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleEnabled(c)}
                  className={c.enabled ? "text-green-600" : "text-gray-500"}
                >
                  {c.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3 pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={TRIGGER_COLOR[c.trigger_event] ?? "bg-gray-500"}>
                  {TRIGGER_LABEL[c.trigger_event] ?? c.trigger_event}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {counts[c.id] ?? 0} enrolled
                </span>
              </div>
              <Link href={`/drips/${c.id}`}>
                <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
                  Edit <MoveRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/drips/lists">
          <Card className="cursor-pointer rounded-2xl border-0 shadow-sm hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Audience Lists</p>
                <p className="text-xs text-muted-foreground">Bundle users to target specific drips</p>
              </div>
              <MoveRight className="ml-auto h-4 w-4 text-blue-500" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/auto/templates">
          <Card className="cursor-pointer rounded-2xl border-0 shadow-sm hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-teal-500">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Email Templates</p>
                <p className="text-xs text-muted-foreground">Edit the messages drips send</p>
              </div>
              <MoveRight className="ml-auto h-4 w-4 text-blue-500" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
