"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Gift, TrendingUp, Users as UsersIcon, Trophy } from "lucide-react";

interface Referral {
  id: string;
  code_used: string;
  status: string;
  reward_coins: number;
  created_at: string | null;
  qualified_at: string | null;
  rewarded_at: string | null;
  referrer: { username: string; email: string | null } | null;
  referred: { username: string; email: string | null } | null;
}

interface Leader {
  key: string;
  count: number;
  coins: number;
  username: string;
}

export default function ReferralsPage() {
  const [rows, setRows] = useState<Referral[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<{ signup: number; purchase: number }>({ signup: 25, purchase: 100 });

  useEffect(() => {
    async function load() {
      const [{ data }, { data: setting }] = await Promise.all([
        supabase
          .from("referrals")
          .select("id, code_used, status, reward_coins, created_at, qualified_at, rewarded_at, referrer:users!referrer_user_id(username, email), referred:users!referred_user_id(username, email)")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("settings")
          .select("referral_signup_reward, referral_purchase_reward")
          .limit(1)
          .maybeSingle(),
      ]);
      const referrals = ((data ?? []) as unknown as Referral[]);
      setRows(referrals);

      const byUser = new Map<string, Leader>();
      for (const r of referrals) {
        const uname = r.referrer?.username ?? "unknown";
        const existing = byUser.get(uname) ?? { key: uname, count: 0, coins: 0, username: uname };
        existing.count += 1;
        existing.coins += r.reward_coins;
        byUser.set(uname, existing);
      }
      setLeaders(Array.from(byUser.values()).sort((a, b) => b.count - a.count).slice(0, 10));

      if (setting) {
        setSettings({
          signup: (setting as { referral_signup_reward?: number }).referral_signup_reward ?? 25,
          purchase: (setting as { referral_purchase_reward?: number }).referral_purchase_reward ?? 100,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const totalRewarded = rows.filter((r) => r.status === "rewarded").length;
  const pending = rows.filter((r) => r.status === "pending").length;
  const totalCoins = rows.reduce((s, r) => s + (r.reward_coins ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600">
          <Gift className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>
          <p className="text-sm text-muted-foreground">Every user has a code. Share, friend buys, both get rewarded.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={UsersIcon}
          label="Total referrals"
          value={rows.length.toString()}
          hint={`${pending} pending · ${totalRewarded} rewarded`}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Coins issued"
          value={totalCoins.toLocaleString()}
          hint={`+${settings.signup} on signup · +${settings.purchase} on first buy`}
          color="from-amber-500 to-orange-500"
        />
        <StatCard
          icon={Trophy}
          label="Top referrer"
          value={leaders[0]?.username ?? "—"}
          hint={leaders[0] ? `${leaders[0].count} referrals` : "no data yet"}
          color="from-pink-500 to-purple-600"
        />
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-500" />
            Top 10 referrers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Referrals</TableHead>
                <TableHead className="text-right">Coins earned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaders.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No referrals yet</TableCell></TableRow>
              ) : leaders.map((l, i) => (
                <TableRow key={l.key} className="border-gray-50">
                  <TableCell className="font-mono text-sm">#{i + 1}</TableCell>
                  <TableCell className="font-medium">{l.username}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.count}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-amber-700">{l.coins.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent referrals ({rows.length})</CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead>Referrer</TableHead>
                <TableHead>Referred</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Coins</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No referrals yet. As users share codes, referrals land here.</TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id} className="border-gray-50">
                  <TableCell className="font-medium">{r.referrer?.username ?? "—"}</TableCell>
                  <TableCell>{r.referred?.username ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{r.code_used}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right tabular-nums">{r.reward_coins}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <b>How it works:</b> when a user signs up using someone else&apos;s <code className="text-xs">referral_code</code>,
        a row lands in <code className="text-xs">referrals</code>. When they make their first order, a DB trigger
        auto-grants <b>{settings.purchase} coins</b> to the referrer. Adjust reward amounts on the
        <Link href="/settings" className="ml-1 underline">Settings</Link> page.
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  color: string;
}) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="p-5">
        <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-amber-500 hover:bg-amber-500" },
    qualified: { label: "Qualified", className: "bg-blue-600 hover:bg-blue-600" },
    rewarded: { label: "Rewarded", className: "bg-green-600 hover:bg-green-600" },
    void: { label: "Void", className: "bg-gray-400 hover:bg-gray-400" },
  };
  const m = map[status] ?? { label: status, className: "bg-gray-500" };
  return <Badge className={m.className}>{m.label}</Badge>;
}
