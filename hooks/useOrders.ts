import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  tracking_number?: string | null;
  carrier?: string | null;
  status: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
}

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
          .select("id, user_id, total_amount, status, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("shipments")
          .select("id, order_id, tracking_number, carrier, status, shipped_at, delivered_at")
          .order("shipped_at", { ascending: false }),
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

  return {
    orders,
    shipments,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}
