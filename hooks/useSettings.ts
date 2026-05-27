import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

export type SettingsRow = Database["public"]["Tables"]["settings"]["Row"];

interface UseSettingsResult {
  settings: SettingsRow | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveSettings: (values: Partial<Omit<SettingsRow, "id" | "updated_at">>) => Promise<boolean>;
  refetch: () => void;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<SettingsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchSettings() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setSettings(data);
      }
      setLoading(false);
    }

    fetchSettings();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  async function saveSettings(
    values: Partial<Omit<SettingsRow, "id" | "updated_at">>
  ): Promise<boolean> {
    setSaving(true);
    setError(null);

    const payload = {
      ...(settings ?? {}),
      ...values,
      updated_at: new Date().toISOString(),
    };

    const { error: saveError } = await supabase
      .from("settings")
      .upsert(payload);

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return false;
    }

    setTick((t) => t + 1);
    return true;
  }

  return {
    settings,
    loading,
    error,
    saving,
    saveSettings,
    refetch: () => setTick((t) => t + 1),
  };
}
