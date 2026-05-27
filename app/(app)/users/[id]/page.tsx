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
import { ChevronLeft, CheckCircle2 } from "lucide-react";

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

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [coins, setCoins] = useState<CoinTx[]>([]);
  const [form, setForm] = useState({ role: "user", username: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [userRes, ordersRes, coinsRes] = await Promise.all([
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
      ]);

      if (userRes.error) setError(userRes.error.message);
      else if (userRes.data) {
        const u = userRes.data as unknown as UserDetail;
        setUser(u);
        setForm({ role: u.role ?? "user", username: u.username });
      }

      setOrders((ordersRes.data as unknown as UserOrder[]) ?? []);
      setCoins((coinsRes.data as unknown as CoinTx[]) ?? []);
      setLoading(false);
    }
    fetchAll();
  }, [id]);

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
