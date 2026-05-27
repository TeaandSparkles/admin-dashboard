"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { settings, loading, error, saving, saveSettings } = useSettings();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    story_default_coin_cost: "",
    referral_signup_reward: "",
    referral_purchase_reward: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        story_default_coin_cost: settings.story_default_coin_cost?.toString() ?? "",
        referral_signup_reward: settings.referral_signup_reward?.toString() ?? "",
        referral_purchase_reward: settings.referral_purchase_reward?.toString() ?? "",
      });
    }
  }, [settings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const ok = await saveSettings({
      story_default_coin_cost: form.story_default_coin_cost
        ? Number(form.story_default_coin_cost)
        : null,
      referral_signup_reward: form.referral_signup_reward
        ? Number(form.referral_signup_reward)
        : null,
      referral_purchase_reward: form.referral_purchase_reward
        ? Number(form.referral_purchase_reward)
        : null,
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  function handleChange(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide rules — changes reflect immediately in the mobile app via Supabase
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Settings saved successfully
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Coin rules */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Coin Rules</CardTitle>
            <CardDescription>
              Controls how coins are earned and spent across the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="story_cost">Coins to unlock a story (default)</Label>
              <Input
                id="story_cost"
                type="number"
                min="0"
                value={form.story_default_coin_cost}
                onChange={handleChange("story_default_coin_cost")}
                placeholder="e.g. 100"
                className="max-w-xs"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Applied when a story has no individual price set
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-gray-100" />

        {/* Referral rules */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Referral Rewards</CardTitle>
            <CardDescription>
              Coin bonuses awarded when referrals are completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup_reward">Coins on referral sign-up</Label>
              <Input
                id="signup_reward"
                type="number"
                min="0"
                value={form.referral_signup_reward}
                onChange={handleChange("referral_signup_reward")}
                placeholder="e.g. 50"
                className="max-w-xs"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Awarded to referrer when referred user creates an account
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_reward">Coins on referral purchase</Label>
              <Input
                id="purchase_reward"
                type="number"
                min="0"
                value={form.referral_purchase_reward}
                onChange={handleChange("referral_purchase_reward")}
                placeholder="e.g. 200"
                className="max-w-xs"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Awarded to referrer when referred user makes their first purchase
              </p>
            </div>
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
