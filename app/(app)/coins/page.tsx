"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDollarSign } from "lucide-react";

interface CoinRow {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string | null;
  user: { email: string | null; username: string } | null;
}

interface UserTotal {
  username: string;
  email: string | null;
  total: number;
}

export default function CoinsPage() {
  const [transactions, setTransactions] = useState<CoinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCoins() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("coin_transactions")
        .select("id, amount, reason, created_at, user:users(email, username)")
        .order("created_at", { ascending: false });

      if (err) setError(err.message);
      else setTransactions((data as unknown as CoinRow[]) ?? []);
      setLoading(false);
    }
    fetchCoins();
  }, []);

  const grandTotal = transactions.reduce((s, t) => s + (t.amount ?? 0), 0);

  // Top spenders / earners
  const byUser = transactions.reduce<Record<string, UserTotal>>((acc, t) => {
    const key = t.user?.username ?? "unknown";
    if (!acc[key]) acc[key] = { username: key, email: t.user?.email ?? null, total: 0 };
    acc[key].total += t.amount ?? 0;
    return acc;
  }, {});

  const topUsers = Object.values(byUser)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Coins</h1>
        <p className="text-sm text-muted-foreground">
          {transactions.length} transactions · {grandTotal.toLocaleString()} coins total
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Grand total */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Coins Issued
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{grandTotal.toLocaleString()}</p>
          </CardContent>
        </Card>

        {/* Top users */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Top Users by Coins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topUsers.map((u) => (
              <div key={u.username} className="flex items-center justify-between text-sm">
                <span className="font-medium">{u.username}</span>
                <span className="tabular-nums text-muted-foreground">
                  {u.total.toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Transaction ledger */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Transaction Ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && <p className="px-6 py-4 text-sm text-red-500">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead>User</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No transactions yet
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-gray-50">
                    <TableCell>
                      <p className="font-medium">{tx.user?.username ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{tx.user?.email ?? ""}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.reason ?? "—"}
                    </TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${tx.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.created_at
                        ? new Date(tx.created_at).toLocaleDateString()
                        : "—"}
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
