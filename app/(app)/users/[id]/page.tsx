"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
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
import { ChevronLeft, CheckCircle2, BookOpen, Check, X, Search } from "lucide-react";

interface UserDetail {
  id: string;
  username: string;
  email: string | null;
  role: string | null;
  phone_number: string | null;
  email_verified: boolean | null;
  phone_verified: boolean | null;
  referred_by_user_id: string | null;
  referral_code: string | null;
  coin_balance: number | null;
  created_at: string | null;
}

interface UserOrder {
  id: string;
  status: string | null;
  total_amount: number | null;
  created_at: string | null;
  story: { title: string } | null;
}

interface CoinTx {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string | null;
}

interface AccessRow {
  id: string;
  story_id: string;
  access_type: string | null;
  created_at: string | null;
  story: { title: string; language: string | null } | null;
}

interface NovelOption {
  id: string;
  title: string;
  language: string | null;
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [coins, setCoins] = useState<CoinTx[]>([]);
  const [access, setAccess] = useState<AccessRow[]>([]);
  const [allNovels, setAllNovels] = useState<NovelOption[]>([]);
  const [novelSearch, setNovelSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form, setForm] = useState({ role: "user", username: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [userRes, ordersRes, coinsRes, accessRes, novelsRes] = await Promise.all([
        supabase
          .from("users")
          .select(
            "id, username, email, role, phone_number, email_verified, phone_verified, referred_by_user_id, referral_code, coin_balance, created_at"
          )
          .eq("id", id)
          .single(),
        supabase
          .from("orders")
          .select("id, status, total_amount, created_at, story:stories(title)")
          .eq("user_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("coin_transactions")
          .select("id, amount, reason, created_at")
          .eq("user_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("story_access")
          .select("id, story_id, access_type, created_at, story:stories(title, language)")
          .eq("user_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("stories")
          .select("id, title, language")
          .eq("published", true)
          .order("title"),
      ]);

      if (userRes.error) setError(userRes.error.message);
      else if (userRes.data) {
        const u = userRes.data as unknown as UserDetail;
        setUser(u);
        setForm({ role: u.role ?? "user", username: u.username });
      }

      setOrders((ordersRes.data as unknown as UserOrder[]) ?? []);
      setCoins((coinsRes.data as unknown as CoinTx[]) ?? []);
      setAccess((accessRes.data as unknown as AccessRow[]) ?? []);
      setAllNovels((novelsRes.data as unknown as NovelOption[]) ?? []);
      setLoading(false);
    }
    fetchAll();
  }, [id]);

  async function toggleAccess(novel: NovelOption) {
    setError(null);
    setTogglingId(novel.id);
    const existing = access.find((a) => a.story_id === novel.id);
    try {
      if (existing) {
        // Currently enabled → disable (delete row)
        const { error: err } = await supabase.from("story_access").delete().eq("id", existing.id);
        if (err) throw err;
        setAccess((prev) => prev.filter((a) => a.id !== existing.id));
      } else {
        // Currently disabled → enable (insert row)
        const { data, error: err } = await supabase
          .from("story_access")
          .insert({
            user_id: id,
            story_id: novel.id,
            access_type: "admin_grant",
          })
          .select("id, story_id, access_type, created_at, story:stories(title, language)")
          .single();
        if (err) throw err;
        setAccess((prev) => [data as unknown as AccessRow, ...prev]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("users")
      .update({ role: form.role, username: form.username })
      .eq("id", id);

    if (err) setError(err.message);
    else {
      setUser((prev) => (prev ? { ...prev, role: form.role, username: form.username } : prev));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading user…</p>;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Link href="/users" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to users
        </Link>
        <p className="text-sm text-red-500">{error ?? "User not found"}</p>
      </div>
    );
  }

  const totalCoins = coins.reduce((s, t) => s + (t.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <Link href="/users" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to users
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{user.username}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" /> Saved successfully
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Edit panel */}
        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Editable by admin / management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={form.role} onValueChange={(v) => v && setForm({ ...form, role: v })}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="accounting">accounting</SelectItem>
                  <SelectItem value="management">management</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Account Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Coin Balance" value={(user.coin_balance ?? 0).toLocaleString()} />
            <Stat label="Total Earned" value={totalCoins.toLocaleString()} />
            <Stat label="Orders" value={orders.length.toString()} />
            <Stat label="Referral Code" value={user.referral_code ?? "—"} />
            <Stat label="Phone" value={user.phone_number ?? "—"} />
            <Stat
              label="Email Verified"
              value={
                <Badge variant={user.email_verified ? "default" : "secondary"}>
                  {user.email_verified ? "Yes" : "No"}
                </Badge>
              }
            />
            <Stat
              label="Phone Verified"
              value={
                <Badge variant={user.phone_verified ? "default" : "secondary"}>
                  {user.phone_verified ? "Yes" : "No"}
                </Badge>
              }
            />
            <Stat
              label="Joined"
              value={user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
            />
          </CardContent>
        </Card>
      </div>

      {/* Novel access — enable / disable per novel */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-blue-600" />
            Novel access ({access.length} of {allNovels.length} enabled)
          </CardTitle>
          <CardDescription>
            Tap Enable to unlock a novel for this user (no purchase needed). Tap Disable to take it away.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={novelSearch}
              onChange={(e) => setNovelSearch(e.target.value)}
              placeholder="Search novels…"
              className="pl-9"
            />
          </div>

          {/* Novel rows */}
          <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
            {allNovels.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No published novels yet.</p>
            )}
            {allNovels
              .filter((n) =>
                novelSearch.trim() === ""
                  ? true
                  : n.title.toLowerCase().includes(novelSearch.trim().toLowerCase())
              )
              // Sort: enabled first, then by title
              .sort((a, b) => {
                const aOn = access.some((x) => x.story_id === a.id) ? 0 : 1;
                const bOn = access.some((x) => x.story_id === b.id) ? 0 : 1;
                if (aOn !== bOn) return aOn - bOn;
                return a.title.localeCompare(b.title);
              })
              .map((novel) => {
                const enabled = access.some((a) => a.story_id === novel.id);
                const busy = togglingId === novel.id;
                return (
                  <div
                    key={novel.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                      enabled ? "border-green-200 bg-green-50/60" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {novel.language && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                            {novel.language}
                          </span>
                        )}
                        <p className="truncate text-sm font-medium">{novel.title}</p>
                      </div>
                      {enabled && (
                        <p className="mt-0.5 text-[11px] text-green-700">
                          ✓ Enabled — user can play these chapters
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={() => toggleAccess(novel)}
                      disabled={busy}
                      size="sm"
                      className={
                        enabled
                          ? "gap-1 bg-red-500 hover:bg-red-600 text-white"
                          : "gap-1 bg-green-600 hover:bg-green-700 text-white"
                      }
                    >
                      {busy ? (
                        "…"
                      ) : enabled ? (
                        <><X className="h-4 w-4" /> Disable</>
                      ) : (
                        <><Check className="h-4 w-4" /> Enable</>
                      )}
                    </Button>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Orders */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead>Story</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    No orders yet
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id} className="border-gray-50">
                    <TableCell>{o.story?.title ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{o.status ?? "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${(o.total_amount ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Coin transactions */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Coin Transactions ({coins.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    No transactions yet
                  </TableCell>
                </TableRow>
              ) : (
                coins.map((t) => (
                  <TableRow key={t.id} className="border-gray-50">
                    <TableCell>{t.reason ?? "—"}</TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${t.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {t.amount >= 0 ? "+" : ""}{t.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
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

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}
