"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface OrderRow {
  id: string;
  status: string | null;
  total_amount: number | null;
  base_print_cost: number | null;
  shipping_cost: number | null;
  story_price: number | null;
  created_at: string | null;
  shipping_name: string | null;
  user: { email: string | null; username: string } | null;
  story: { title: string } | null;
  shipment: { status: string | null; tracking_number: string | null } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("orders")
        .select(
          `id, status, total_amount, base_print_cost, shipping_cost, story_price,
           created_at, shipping_name,
           user:users(email, username),
           story:stories(title),
           shipment:shipments(status, tracking_number)`
        )
        .order("created_at", { ascending: false });

      if (err) setError(err.message);
      else setOrders((data as unknown as OrderRow[]) ?? []);
      setLoading(false);
    }
    fetchOrders();
  }, []);

  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} total orders
          </p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Order Ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && <p className="px-6 py-4 text-sm text-red-500">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead>Customer</TableHead>
                <TableHead>Story</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Shipping</TableHead>
                <TableHead className="text-right">Story</TableHead>
                <TableHead className="text-right">Print</TableHead>
                <TableHead className="text-right">Shipping</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order) => (
                  <TableRow key={order.id} className="border-gray-50">
                    <TableCell>
                      <p className="font-medium">{order.user?.username ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{order.user?.email ?? ""}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.story?.title ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status ?? ""] ?? "bg-gray-100 text-gray-600"}`}>
                        {order.status ?? "unknown"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {order.shipment ? (
                        <div>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.shipment.status ?? ""] ?? "bg-gray-100 text-gray-600"}`}>
                            {order.shipment.status ?? "—"}
                          </span>
                          {order.shipment.tracking_number && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {order.shipment.tracking_number}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No shipment</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      ${(order.story_price ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      ${(order.base_print_cost ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      ${(order.shipping_cost ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${(order.total_amount ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString()
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
