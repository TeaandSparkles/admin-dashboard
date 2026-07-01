"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Flame, Gift, Users, CheckCircle2, Heart, Moon } from "lucide-react";

interface StreakRow {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_listened_date: string | null;
  total_rewards_earned: number;
  updated_at: string;
  user: { username: string; email: string | null } | null;
}

export default function StreaksPage() {
  const { settings, loading: settingsLoading, saveSettings, saving } = useSettings();

  const [streaks, setStreaks] = useState<StreakRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [config, setConfig] = useState({
    enabled: false,
    nights: 5,
    bonus: 2,
  });

  useEffect(() => {
    if (settings) {
      setConfig({
        enabled: settings.streak_enabled ?? false,
        nights: settings.streak_nights_required ?? 5,
        bonus: settings.streak_bonus_chapters ?? 2,
      });
    }
  }, [settings]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("listening_streaks")
        .select("user_id, current_streak, longest_streak, last_listened_date, total_rewards_earned, updated_at, user:users(username, email)")
        .order("current_streak", { ascending: false })
        .limit(50);

      if (err) setError(err.message);
      else setStreaks((data as unknown as StreakRow[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSaveConfig() {
    const ok = await saveSettings({
      streak_enabled: config.enabled,
      streak_nights_required: config.nights,
      streak_bonus_chapters: config.bonus,
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  // Metrics
  const activeStreaks = streaks.filter(s => (s.current_streak ?? 0) > 0).length;
  const totalRewards = streaks.reduce((sum, s) => sum + (s.total_rewards_earned ?? 0), 0);
  const avgStreak = streaks.length > 0
    ? Math.round(streaks.reduce((sum, s) => sum + (s.current_streak ?? 0), 0) / streaks.length * 10) / 10
    : 0;
  const longestEver = streaks.reduce((max, s) => Math.max(max, s.longest_streak ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Flame className="h-6 w-6 text-rose-500" />
          Listening Streaks
        </h1>
        <p className="text-sm text-muted-foreground">
          Post-purchase family ritual reward. Only counts audio + reading on paid series. Never gates content, never shames breaks.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" /> Streak settings saved
        </div>
      )}

      {/* Config */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Streak Rules</CardTitle>
          <CardDescription>How the milestone works. Changes apply to all future streaks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              disabled={settingsLoading}
            />
            <div>
              <p className="text-sm font-medium">Listening streaks enabled</p>
              <p className="text-xs text-muted-foreground">
                When OFF, streak events are recorded but no rewards are granted
              </p>
            </div>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nights">Nights of storytime required</Label>
              <Input
                id="nights"
                type="number"
                min="1"
                max="30"
                value={config.nights}
                onChange={(e) => setConfig({ ...config, nights: Number(e.target.value) || 1 })}
                className="max-w-xs"
                disabled={settingsLoading}
              />
              <p className="text-xs text-muted-foreground">
                Currently: <strong>{config.nights} nights</strong> in a row
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonus">Free bonus episodes granted</Label>
              <Input
                id="bonus"
                type="number"
                min="1"
                max="20"
                value={config.bonus}
                onChange={(e) => setConfig({ ...config, bonus: Number(e.target.value) || 1 })}
                className="max-w-xs"
                disabled={settingsLoading}
              />
              <p className="text-xs text-muted-foreground">
                Currently: <strong>{config.bonus} chapters</strong> from another series
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-800">
            <div className="flex items-start gap-2">
              <Heart className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              <div>
                <p className="font-medium">The rule in plain words:</p>
                <p className="mt-1 text-indigo-700/90">
                  When a family listens or reads their purchased series on{" "}
                  <strong>{config.nights} nights in a row</strong>, they receive{" "}
                  <strong>{config.bonus} free bonus chapters</strong> from a series they haven&apos;t bought yet.
                  Watching the AI visuals does <em>not</em> count — this rewards the reflective ritual, not passive viewing.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleSaveConfig} disabled={saving || settingsLoading}>
            {saving ? "Saving…" : "Save streak rules"}
          </Button>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Active Households" value={activeStreaks} icon={Users} gradient="from-indigo-500 to-purple-500" />
        <MetricCard label="Avg Streak" value={avgStreak.toString()} icon={Moon} gradient="from-cyan-500 to-sky-500" />
        <MetricCard label="Longest Ever" value={longestEver.toString()} icon={Flame} gradient="from-pink-500 to-rose-500" />
        <MetricCard label="Bonus Chapters Gifted" value={totalRewards} icon={Gift} gradient="from-amber-500 to-orange-500" />
      </div>

      {/* Active streaks */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Family Streaks</CardTitle>
          <CardDescription>Warm, ranked by current streak. This is a celebration, not a leaderboard.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead>Household</TableHead>
                <TableHead className="text-right">Current Streak</TableHead>
                <TableHead className="text-right">Longest</TableHead>
                <TableHead className="text-right">Bonus Earned</TableHead>
                <TableHead>Last Storytime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : streaks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No streaks yet — they&apos;ll appear here as families settle into storytime.
                  </TableCell>
                </TableRow>
              ) : (
                streaks.map((s) => (
                  <TableRow key={s.user_id} className="border-gray-50">
                    <TableCell>
                      <p className="font-medium">{s.user?.username ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{s.user?.email ?? ""}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-100 to-pink-100 px-3 py-1 text-xs font-semibold text-rose-700">
                        <Flame className="h-3 w-3" /> {s.current_streak} nights
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{s.longest_streak}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{s.total_rewards_earned}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.last_listened_date ? new Date(s.last_listened_date).toLocaleDateString() : "—"}
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

function MetricCard({
  label, value, icon: Icon, gradient,
}: { label: string; value: string | number; icon: typeof Flame; gradient: string }) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="p-4">
        <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
