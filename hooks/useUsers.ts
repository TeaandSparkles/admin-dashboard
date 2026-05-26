import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface AppUserRecord {
  id: string;
  email: string;
  role: string;
  created_at: string;
  referral_code?: string | null;
}

interface UseUsersResult {
  users: AppUserRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<AppUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("users")
        .select("id, email, role, created_at, referral_code")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setUsers(data ?? []);
      }
      setLoading(false);
    }

    fetchUsers();
    return () => { cancelled = true; };
  }, [tick]);

  return { users, loading, error, refetch: () => setTick((t) => t + 1) };
}
