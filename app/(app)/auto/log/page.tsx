"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface Send {
  id: string;
  template_key: string;
  to_email: string;
  subject: string | null;
  status: string;
  error: string | null;
  sent_at: string | null;
  provider_id: string | null;
}

export default function EmailSendLogPage() {
  const [rows, setRows] = useState<Send[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("email_sends")
        .select("id, template_key, to_email, subject, status, error, sent_at, provider_id")
        .order("sent_at", { ascending: false })
        .limit(100);
      setRows((data as Send[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email Send Log</h1>
        <p className="text-sm text-muted-foreground">
          Every email the system has attempted to send. Newest first. Failures include the provider error for debugging.
        </p>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Recent sends ({rows.length})</CardTitle>
          <CardDescription>Latest 100 attempts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead>Status</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No sends yet. Once RESEND_API_KEY is set, sends appear here.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((s) => (
                  <TableRow key={s.id} className="border-gray-50">
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="font-medium">{s.template_key}</TableCell>
                    <TableCell className="text-muted-foreground">{s.to_email}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{s.subject ?? "—"}</TableCell>
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
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "sent") return <Badge className="gap-1 bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3" /> Sent</Badge>;
  if (status === "failed") return <Badge className="gap-1 bg-red-500 hover:bg-red-500"><XCircle className="h-3 w-3" /> Failed</Badge>;
  return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
}
