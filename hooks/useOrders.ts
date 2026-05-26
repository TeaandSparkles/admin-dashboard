import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

export type Order = Pick<
  Database["public"]["Tables"]["orders"]["Row"],
  | "id" | "user_id" | "total_amount" | "status" | "created_at"
  | "shipping_name" | "shipping_email" | "shipping_phone" | "shipping_address"
  | "story_id" | "story_price" | "base_print_cost" | "shipping_cost"
  | "cancellation_deadline"
>;

export type Shipment = Pick<
  Database["public"]["Tables"]["shipments"]["Row"],
  "id" | "order_id" | "tracking_number" | "carrier" | "status" | "created_at" | "package_photo_url"
>;

interface UseOrdersResult {
  orders: Order[];
  shipments: Shipment[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOrders(): UseOrdersResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      setLoading(true);
      setError(null);

      const [ordersRes, shipmentsRes] = await Promise.all([
        supabase
          .from("orders")
          .select(
            "id, user_id, total_amount, status, created_at, shipping_name, shipping_email, shipping_phone, shipping_address, story_id, story_price, base_print_cost, shipping_cost, cancellation_deadline"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("shipments")
          .select("id, order_id, tracking_number, carrier, status, created_at, package_photo_url")
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;

      const fetchError = ordersRes.error ?? shipmentsRes.error;
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setOrders(ordersRes.data ?? []);
        setShipments(shipmentsRes.data ?? []);
      }
      setLoading(false);
    }

    fetchOrders();
    return () => { cancelled = true; };
  }, [tick]);

  return { orders, shipments, loading, error, refetch: () => setTick((t) => t + 1) };
}
