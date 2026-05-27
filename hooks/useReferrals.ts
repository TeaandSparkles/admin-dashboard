import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface ReferralRow {
  id: string;
  status: string | null;
  created_at: string | null;
  referrer: { email: string | null; username: string } | null;
  referred: { email: string | null; username: string } | null;
}

interface UseReferralsResult {
  referrals: ReferralRow[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReferrals(): UseReferralsResult {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchReferrals() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("referrals")
        .select(
          `id, status, created_at,
           referrer:users!referrals_referrer_user_id_fkey(email, username),
           referred:users!referrals_referred_user_id_fkey(email, username)`
        )
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setReferrals((data as ReferralRow[]) ?? []);
      }
      setLoading(false);
    }

    fetchReferrals();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { referrals, loading, error, refetch: () => setTick((t) => t + 1) };
}
