"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, ExternalLink, Bell, type LucideIcon } from "lucide-react";

interface Alert {
  id: string;
  title: string;
  body: string | null;
  external_url: string | null;
  is_read: boolean;
  created_at: string | null;
  kind: string;
}

interface Connection {
  connected_at: string | null;
  account_label: string | null;
}

export function ChannelHeader({
  title,
  description,
  platform,
  icon: Icon,
  color,
}: {
  title: string;
  description: string;
  platform: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{platform}</p>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function ConnectionStatus({ platform, connectHelp }: { platform: string; connectHelp: string }) {
  const [conn, setConn] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("promo_connections")
        .select("connected_at, account_label")
        .eq("platform", platform)
        .maybeSingle();
      setConn(data as Connection | null);
      setLoading(false);
    }
    load();
  }, [platform]);

  if (loading) return null;

  const connected = !!conn?.connected_at;

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {connected ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          {connected ? "Connected" : "Not connected"}
        </CardTitle>
        <CardDescription>
          {connected
            ? `Signed in as ${conn?.account_label ?? "your account"} · ${
                conn?.connected_at ? new Date(conn.connected_at).toLocaleDateString() : ""
              }`
            : "Link your account to start seeing activity here"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!connected && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium mb-1">One-time setup needed</p>
            <p className="text-amber-800 leading-relaxed">{connectHelp}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AlertsFeed({ platform, emptyLabel }: { platform: string; emptyLabel: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("promo_alerts")
        .select("id, title, body, external_url, is_read, created_at, kind")
        .eq("platform", platform)
        .order("created_at", { ascending: false })
        .limit(50);
      setAlerts((data as Alert[]) ?? []);
      setLoading(false);
    }
    load();
  }, [platform]);

  async function markRead(id: string) {
    await supabase.from("promo_alerts").update({ is_read: true }).eq("id", id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
  }

  async function markAllRead() {
    await supabase
      .from("promo_alerts")
      .update({ is_read: true })
      .eq("platform", platform)
      .eq("is_read", false);
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  }

  const unread = alerts.filter((a) => !a.is_read).length;

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-blue-600" />
            Alerts
            {unread > 0 && <Badge className="bg-red-500 hover:bg-red-500">{unread} unread</Badge>}
          </CardTitle>
          <CardDescription>New activity here needs a reply</CardDescription>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && alerts.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        )}
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`flex items-start gap-3 rounded-xl border p-3 ${
              a.is_read ? "border-gray-100 bg-white" : "border-blue-200 bg-blue-50/40"
            }`}
          >
            {!a.is_read && <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{a.title}</p>
              {a.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{a.body}</p>}
              <p className="mt-1 text-[11px] text-muted-foreground">
                {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              {a.external_url && (
                <a
                  href={a.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-700"
                >
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {!a.is_read && (
                <button
                  onClick={() => markRead(a.id)}
                  className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
