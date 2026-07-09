"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock, Eye, MousePointerClick, AlertTriangle } from "lucide-react";

interface Send {
  id: string;
  template_key: string;
  to_email: string;
  subject: string | null;
  status: string;
  error: string | null;
  sent_at: string | null;
  provider_id: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  open_count: number;
  click_count: number;
}

export default function EmailSendLogPage() {
  const [rows, setRows] = useState<Send[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("email_sends")
        .select("id, template_key, to_email, subject, status, error, sent_at, provider_id, delivered_at, opened_at, clicked_at, bounced_at, open_count, click_count")
        .order("sent_at", { ascending: false })
        .limit(200);
      setRows((data as Send[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const totalSent = rows.filter((r) => r.status === "sent").length;
  const totalOpened = rows.filter((r) => r.opened_at).length;
  const totalClicked = rows.filter((r) => r.clicked_at).length;
  const totalBounced = rows.filter((r) => r.bounced_at).length;
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const clickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
  const bounceRate = totalSent > 0 ? Math.round((totalBounced / totalSent) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email Send Log</h1>
        <p className="text-sm text-muted-foreground">
          Every send, plus open / click / bounce tracking from the Resend webhook. Newest first.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Sent" value={totalSent.toLocaleString()} sub="in this batch" color="from-blue-500 to-cyan-500" icon={CheckCircle2} />
        <StatCard label="Open rate" value={`${openRate}%`} sub={`${totalOpened} of ${totalSent}`} color="from-green-500 to-teal-500" icon={Eye} />
        <StatCard label="Click rate" value={`${clickRate}%`} sub={`${totalClicked} of ${totalSent}`} color="from-amber-500 to-orange-500" icon={MousePointerClick} />
        <StatCard label="Bounce rate" value={`${bounceRate}%`} sub={`${totalBounced} bounced`} color="from-red-500 to-pink-500" icon={AlertTriangle} />
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Recent sends ({rows.length})</CardTitle>
          <CardDescription>Latest 200 attempts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead>Status</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Opens</TableHead>
                <TableHead className="text-center">Clicks</TableHead>
                <TableHead>Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No sends yet. Once RESEND_API_KEY is set, sends appear here.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((s) => (
                  <TableRow key={s.id} className="border-gray-50">
                    <TableCell>
                      <StatusBadge status={s.status} bounced={!!s.bounced_at} />
                    </TableCell>
                    <TableCell className="font-medium">{s.template_key}</TableCell>
                    <TableCell className="text-muted-foreground">{s.to_email}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{s.subject ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      {s.open_count > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          <Eye className="h-3 w-3" /> {s.open_count}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {s.click_count > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <MousePointerClick className="h-3 w-3" /> {s.click_count}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.sent_at ? new Date(s.sent_at).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <b>Enabling open / click tracking:</b> in your Resend dashboard → Webhooks → Add Endpoint →
        URL: <code className="text-xs">https://your-vercel-domain/api/email/webhook</code> ·
        events: <code className="text-xs">email.opened</code>, <code className="text-xs">email.clicked</code>,
        <code className="text-xs">email.delivered</code>, <code className="text-xs">email.bounced</code>,
        <code className="text-xs">email.complained</code>. That&apos;s it — stats populate on their own.
      </div>
    </div>
  );
}

function StatusBadge({ status, bounced }: { status: string; bounced: boolean }) {
  if (bounced) return <Badge className="gap-1 bg-red-500 hover:bg-red-500"><AlertTriangle className="h-3 w-3" /> Bounced</Badge>;
  if (status === "sent") return <Badge className="gap-1 bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3" /> Sent</Badge>;
  if (status === "failed") return <Badge className="gap-1 bg-red-500 hover:bg-red-500"><XCircle className="h-3 w-3" /> Failed</Badge>;
  if (status === "skipped") return <Badge className="gap-1 bg-gray-400 hover:bg-gray-400">Skipped</Badge>;
  if (status === "complained") return <Badge className="gap-1 bg-red-600 hover:bg-red-600">Spam</Badge>;
  return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
}

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string;
  value: string;
  sub: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="p-4">
        <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
