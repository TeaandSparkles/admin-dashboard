"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { settings, loading, error, saving, saveSettings } = useSettings();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    default_series_price: "",
    default_shipping_cost: "",
    default_print_cost: "",
    founders_pass_enabled: false,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        // Reuse story_default_coin_cost column as USD default series price
        default_series_price: settings.story_default_coin_cost?.toString() ?? "",
        default_shipping_cost: settings.default_shipping_cost?.toString() ?? "",
        default_print_cost: settings.default_print_cost?.toString() ?? "",
        founders_pass_enabled: settings.founders_pass_enabled ?? false,
      });
    }
  }, [settings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const ok = await saveSettings({
      story_default_coin_cost: form.default_series_price ? Number(form.default_series_price) : null,
      default_shipping_cost: form.default_shipping_cost ? Number(form.default_shipping_cost) : null,
      default_print_cost: form.default_print_cost ? Number(form.default_print_cost) : null,
      founders_pass_enabled: form.founders_pass_enabled,
      // referral coin rewards remain unused (kept null)
      referral_signup_reward: null,
      referral_purchase_reward: null,
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  function handleChange<K extends keyof typeof form>(key: K) {
    return (value: typeof form[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide defaults — synced via Supabase, reflects instantly in the mobile app
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Settings saved
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Series Pricing</CardTitle>
            <CardDescription>Default price applied to a new series bundle (book + audio + visuals)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <NumberField
              id="series_price"
              label="Default series price (USD)"
              hint="Used when a series has no individual price set"
              value={form.default_series_price}
              onChange={handleChange("default_series_price")}
              disabled={loading}
              step="0.01"
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Fulfillment Defaults</CardTitle>
            <CardDescription>Default costs for the tiny physical book that ships with each purchase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <NumberField
              id="ship_cost"
              label="Default shipping cost (USD)"
              hint="Applied to new orders unless overridden per order"
              value={form.default_shipping_cost}
              onChange={handleChange("default_shipping_cost")}
              disabled={loading}
              step="0.01"
            />
            <NumberField
              id="print_cost"
              label="Default print cost (USD)"
              hint="Base cost to print one tiny book"
              value={form.default_print_cost}
              onChange={handleChange("default_print_cost")}
              disabled={loading}
              step="0.01"
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Founders Pass</CardTitle>
            <CardDescription>Grant lifetime access to founding-member households</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={form.founders_pass_enabled}
                onChange={(e) => handleChange("founders_pass_enabled")(e.target.checked)}
                disabled={loading}
              />
              <div>
                <p className="text-sm font-medium">Founders Pass enabled</p>
                <p className="text-xs text-muted-foreground">
                  When ON, founding members automatically get access to every series
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving || loading}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
          {settings?.updated_at && (
            <p className="text-xs text-muted-foreground">
              Last updated {new Date(settings.updated_at).toLocaleString()}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

function NumberField({
  id, label, hint, value, onChange, disabled, step,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min="0"
        step={step ?? "1"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-xs"
        disabled={disabled}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
