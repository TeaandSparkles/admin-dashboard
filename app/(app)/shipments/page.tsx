"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Truck, Package, CheckCircle2, RotateCcw, Clock } from "lucide-react";

interface ShipmentRow {
  id: string;
  order_id: string | null;
  tracking_number: string | null;
  carrier: string | null;
  status: string | null;
  package_photo_url: string | null;
  created_at: string | null;
  order: {
    id: string;
    status: string | null;
    total_amount: number | null;
    shipping_name: string | null;
    shipping_address: string | null;
    user: { username: string; email: string | null } | null;
    story: { title: string } | null;
  } | null;
}

const SHIPMENT_STATUSES = [
  "pending",
  "packed",
  "shipped",
  "delivered",
  "refunded",
] as const;

const statusStyles: Record<string, { bg: string; icon: typeof Truck }> = {
  pending: { bg: "bg-yellow-100 text-yellow-700", icon: Clock },
  packed: { bg: "bg-blue-100 text-blue-700", icon: Package },
  shipped: { bg: "bg-indigo-100 text-indigo-700", icon: Truck },
  delivered: { bg: "bg-green-100 text-green-700", icon: CheckCircle2 },
  refunded: { bg: "bg-red-100 text-red-700", icon: RotateCcw },
};

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function fetchShipments() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("shipments")
      .select(
        `id, order_id, tracking_number, carrier, status, package_photo_url, created_at,
         order:orders(id, status, total_amount, shipping_name, shipping_address,
           user:users(username, email), story:stories(title))`
      )
      .order("created_at", { ascending: false });

    if (err) setError(err.message);
    else setShipments((data as unknown as ShipmentRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchShipments(); }, []);

  async function updateShipment(
    id: string,
    patch: { status?: string; tracking_number?: string; carrier?: string }
  ) {
    setSavingId(id);
    const { error: err } = await supabase
      .from("shipments")
      .update(patch)
      .eq("id", id);
    if (err) {
      setError(err.message);
    } else {
      // Refresh local state
      setShipments((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      );
    }
    setSavingId(null);
  }

  const filtered =
    statusFilter === "all"
      ? shipments
      : shipments.filter((s) => s.status === statusFilter);

  // KPI counts
  const counts = SHIPMENT_STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: shipments.filter((sh) => sh.status === s).length }),
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shipments</h1>
          <p className="text-sm text-muted-foreground">
            {shipments.length} total · fulfillment & tracking
          </p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {SHIPMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {SHIPMENT_STATUSES.map((s) => {
          const { icon: Icon } = statusStyles[s];
          return (
            <Card key={s} className="rounded-2xl border-0 shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`rounded-lg p-2 ${statusStyles[s].bg}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs capitalize text-muted-foreground">{s}</p>
                  <p className="text-lg font-semibold tabular-nums">{counts[s] ?? 0}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Shipment Ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && <p className="px-6 py-4 text-sm text-red-500">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead>Customer / Story</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No shipments yet
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id} className="border-gray-50">
                    <TableCell>
                      <p className="font-medium">{s.order?.user?.username ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.order?.story?.title ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={s.status ?? "pending"}
                        onValueChange={(v) => v && updateShipment(s.id, { status: v })}
                        disabled={savingId === s.id}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIPMENT_STATUSES.map((st) => (
                            <SelectItem key={st} value={st}>{st}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={s.carrier ?? ""}
                        placeholder="UPS, FedEx…"
                        className="h-8 w-28 text-xs"
                        onBlur={(e) => {
                          if (e.target.value !== (s.carrier ?? ""))
                            updateShipment(s.id, { carrier: e.target.value });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={s.tracking_number ?? ""}
                        placeholder="Tracking #"
                        className="h-8 w-40 text-xs"
                        onBlur={(e) => {
                          if (e.target.value !== (s.tracking_number ?? ""))
                            updateShipment(s.id, { tracking_number: e.target.value });
                        }}
                      />
                    </TableCell>
                    <TableCell className="max-w-xs text-xs text-muted-foreground">
                      {s.order?.shipping_address ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.created_at
                        ? new Date(s.created_at).toLocaleDateString()
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
