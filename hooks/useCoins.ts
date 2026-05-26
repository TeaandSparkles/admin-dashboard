import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

export type CoinTransaction = Pick<
  Database["public"]["Tables"]["coin_transactions"]["Row"],
  "id" | "user_id" | "amount" | "reason" | "created_at"
>;

interface UseCoinsResult {
  transactions: CoinTransaction[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCoins(): UseCoinsResult {
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchTransactions() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("coin_transactions")
        .select("id, user_id, amount, reason, created_at")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setTransactions(data ?? []);
      }
      setLoading(false);
    }

    fetchTransactions();
    return () => { cancelled = true; };
  }, [tick]);

  return { transactions, loading, error, refetch: () => setTick((t) => t + 1) };
}
