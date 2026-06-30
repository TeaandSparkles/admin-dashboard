import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface DashboardStats {
  totalUsers: number;
  totalNovels: number;
  totalStories: number;
  totalOrders: number;
  totalCoinsIssued: number;
  totalCoinsSpent: number;
  totalCoinsEarned: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalRevenue: number;
  totalShipments: number;
  pendingShipments: number;
}

export interface TimeSeriesPoint {
  date: string;
  users: number;
  orders: number;
  revenue: number;
  coins: number;
}

export interface TopStory {
  id: string;
  title: string;
  novelTitle: string;
  orderCount: number;
  revenue: number;
  engagementPct: number;
}

export interface CoinBreakdown {
  earned: number;
  spent: number;
  net: number;
}

export interface DashboardData {
  stats: DashboardStats | null;
  timeSeries: TimeSeriesPoint[];
  topStories: TopStory[];
  coinBreakdown: CoinBreakdown;
}

export function useDashboardStats() {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    timeSeries: [],
    topStories: [],
    coinBreakdown: { earned: 0, spent: 0, net: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Back-compat: useDashboardStats was used as { stats, loading, error }
  // We add data.timeSeries / topStories / coinBreakdown as new fields.
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        const [
          users, novels, stories, orders, ordersFull,
          coinsTx, referralsConfirmed, referralsPending, shipments, shipmentsPending,
        ] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("novels").select("*", { count: "exact", head: true }),
          supabase.from("stories").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("id, total_amount, story_id, created_at"),
          supabase.from("coin_transactions").select("amount, created_at"),
          supabase.from("referrals").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
          supabase.from("referrals").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("shipments").select("*", { count: "exact", head: true }),
          supabase.from("shipments").select("*", { count: "exact", head: true }).neq("status", "delivered"),
        ]);

        // Coin breakdown — earned (positive) vs spent (negative)
        const coinTransactions = coinsTx.data ?? [];
        const earned = coinTransactions.filter(c => (c.amount ?? 0) > 0).reduce((s, c) => s + (c.amount ?? 0), 0);
        const spent = Math.abs(coinTransactions.filter(c => (c.amount ?? 0) < 0).reduce((s, c) => s + (c.amount ?? 0), 0));

        // Revenue
        const allOrders = ordersFull.data ?? [];
        const totalRevenue = allOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0);

        const stats: DashboardStats = {
          totalUsers: users.count ?? 0,
          totalNovels: novels.count ?? 0,
          totalStories: stories.count ?? 0,
          totalOrders: orders.count ?? 0,
          totalCoinsIssued: earned,
          totalCoinsSpent: spent,
          totalCoinsEarned: earned,
          activeReferrals: referralsConfirmed.count ?? 0,
          pendingReferrals: referralsPending.count ?? 0,
          totalRevenue,
          totalShipments: shipments.count ?? 0,
          pendingShipments: shipmentsPending.count ?? 0,
        };

        // Build time series (last 30 days)
        const days = 30;
        const today = new Date();
        const timeSeries: TimeSeriesPoint[] = Array.from({ length: days }, (_, i) => {
          const d = new Date(today);
          d.setDate(d.getDate() - (days - 1 - i));
          const dateKey = d.toISOString().slice(0, 10);
          const ordersOnDay = allOrders.filter(o => o.created_at?.startsWith(dateKey));
          const coinsOnDay = coinTransactions.filter(c => c.created_at?.startsWith(dateKey));
          return {
            date: dateKey,
            users: 0, // would require a `users.created_at` join — keep for future
            orders: ordersOnDay.length,
            revenue: ordersOnDay.reduce((s, o) => s + (o.total_amount ?? 0), 0),
            coins: coinsOnDay.reduce((s, c) => s + Math.max(0, c.amount ?? 0), 0),
          };
        });

        // Top stories by order revenue
        const storyRevenue = new Map<string, { orders: number; revenue: number }>();
        for (const o of allOrders) {
          if (!o.story_id) continue;
          const cur = storyRevenue.get(o.story_id) ?? { orders: 0, revenue: 0 };
          cur.orders += 1;
          cur.revenue += o.total_amount ?? 0;
          storyRevenue.set(o.story_id, cur);
        }
        const topIds = [...storyRevenue.entries()]
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .slice(0, 5)
          .map(([id]) => id);

        let topStories: TopStory[] = [];
        if (topIds.length) {
          const { data: storyRows } = await supabase
            .from("stories")
            .select("id, title, novel:novels(title)")
            .in("id", topIds);
          const maxRevenue = Math.max(...topIds.map(id => storyRevenue.get(id)?.revenue ?? 0), 1);
          topStories = (storyRows ?? []).map((s) => {
            const r = storyRevenue.get(s.id) ?? { orders: 0, revenue: 0 };
            const novelObj = s.novel as { title?: string } | { title?: string }[] | null;
            const novelTitle = Array.isArray(novelObj) ? novelObj[0]?.title ?? "—" : novelObj?.title ?? "—";
            return {
              id: s.id,
              title: s.title,
              novelTitle,
              orderCount: r.orders,
              revenue: r.revenue,
              engagementPct: Math.round((r.revenue / maxRevenue) * 100),
            };
          }).sort((a, b) => b.revenue - a.revenue);
        }

        setData({
          stats,
          timeSeries,
          topStories,
          coinBreakdown: { earned, spent, net: earned - spent },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  return { ...data, loading, error };
}
