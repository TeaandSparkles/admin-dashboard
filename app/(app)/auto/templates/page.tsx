"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Mail, MoveRight, CheckCircle2, XCircle } from "lucide-react";

interface Template {
  key: string;
  subject: string;
  enabled: boolean;
  updated_at: string | null;
}

const KEY_LABEL: Record<string, { label: string; hint: string }> = {
  welcome: { label: "Welcome", hint: "Sent after signup" },
  order_confirmation: { label: "Order Confirmation", hint: "After an order is placed" },
  payment_received: { label: "Payment Received", hint: "After payment clears" },
  shipping_started: { label: "Shipping Started", hint: "When printed book ships" },
  shipping_delivered: { label: "Delivered", hint: "When package is delivered" },
  streak_reward: { label: "Streak Reward", hint: "When a streak bonus is earned" },
};

export default function EmailTemplatesPage() {
  const [rows, setRows] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("email_templates")
        .select("key, subject, enabled, updated_at")
        .order("key");
      setRows((data as Template[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email Templates</h1>
        <p className="text-sm text-muted-foreground">
          Edit the auto-emails sent on account signup, orders, shipping, and streak rewards.
          Variables like <code className="text-xs">{"{{user_name}}"}</code> get filled in when the email fires.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {rows.map((t) => {
          const meta = KEY_LABEL[t.key] ?? { label: t.key, hint: "" };
          return (
            <Link key={t.key} href={`/auto/templates/${t.key}`}>
              <Card className="cursor-pointer rounded-2xl border-0 shadow-sm transition hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Mail className="h-4 w-4 text-blue-600" />
                        {meta.label}
                      </CardTitle>
                      <CardDescription>{meta.hint}</CardDescription>
                    </div>
                    <Badge variant={t.enabled ? "default" : "secondary"} className="gap-1">
                      {t.enabled ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {t.enabled ? "Enabled" : "Off"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <p className="min-w-0 flex-1 truncate text-sm text-gray-700">{t.subject}</p>
                  <MoveRight className="h-4 w-4 shrink-0 text-blue-500" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <FileText className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Setup checklist</p>
          <ol className="mt-1 list-decimal ml-5 space-y-0.5 text-xs">
            <li>Sign up at <a className="underline" href="https://resend.com" target="_blank" rel="noreferrer">resend.com</a> (free 3k emails/mo)</li>
            <li>Verify your sending domain (or use resend.dev for testing)</li>
            <li>Add <code>RESEND_API_KEY</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> to Vercel env vars</li>
            <li>Redeploy — every template's <b>Send test</b> button will start working</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
