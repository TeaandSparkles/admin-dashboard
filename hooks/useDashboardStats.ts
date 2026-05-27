import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface DashboardStats {
  totalUsers: number;
  totalNovels: number;
  totalStories: number;
  totalOrders: number;
  totalCoinsIssued: number;
  activeReferrals: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);

      const [users, novels, stories, orders, coins, referrals] =
        await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("novels").select("*", { count: "exact", head: true }),
          supabase.from("stories").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("*", { count: "exact", head: true }),
          supabase.from("coin_transactions").select("amount"),
          supabase
            .from("referrals")
            .select("*", { count: "exact", head: true })
            .eq("status", "confirmed"),
        ]);

      const firstError =
        users.error ??
        novels.error ??
        stories.error ??
        orders.error ??
        coins.error ??
        referrals.error;

      if (firstError) {
        setError(firstError.message);
        setLoading(false);
        return;
      }

      const totalCoins = (coins.data ?? []).reduce(
        (sum, t) => sum + (t.amount ?? 0),
        0
      );

      setStats({
        totalUsers: users.count ?? 0,
        totalNovels: novels.count ?? 0,
        totalStories: stories.count ?? 0,
        totalOrders: orders.count ?? 0,
        totalCoinsIssued: totalCoins,
        activeReferrals: referrals.count ?? 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
