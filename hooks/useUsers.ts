import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

export type AppUserRecord = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "email" | "username" | "role" | "created_at" | "phone_number" | "email_verified" | "referred_by_user_id"
>;

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
        .select("id, email, username, role, created_at, phone_number, email_verified, referred_by_user_id")
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
