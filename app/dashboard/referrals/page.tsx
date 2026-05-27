"use client";

import { useReferrals } from "@/hooks/useReferrals";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function ReferralsPage() {
  const { referrals, loading, error } = useReferrals();

  const confirmed = referrals.filter((r) => r.status === "confirmed").length;
  const pending = referrals.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>
        <p className="text-sm text-muted-foreground">
          {confirmed} confirmed · {pending} pending
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{referrals.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{confirmed}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{pending}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Referral Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && <p className="px-6 py-4 text-sm text-red-500">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead>Referrer</TableHead>
                <TableHead></TableHead>
                <TableHead>Referred User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No referrals yet
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map((ref) => (
                  <TableRow key={ref.id} className="border-gray-50">
                    <TableCell>
                      <p className="font-medium">{ref.referrer?.username ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{ref.referrer?.email ?? ""}</p>
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{ref.referred?.username ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{ref.referred?.email ?? ""}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={ref.status === "confirmed" ? "default" : "secondary"}
                      >
                        {ref.status ?? "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ref.created_at
                        ? new Date(ref.created_at).toLocaleDateString()
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
