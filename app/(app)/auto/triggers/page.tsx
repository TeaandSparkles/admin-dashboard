import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, Zap, Info } from "lucide-react";

const TRIGGERS = [
  { event: "New user signup", template: "welcome", source: "auth.users insert" },
  { event: "Order placed", template: "order_confirmation", source: "orders insert" },
  { event: "Payment received", template: "payment_received", source: "payments insert where status='completed'" },
  { event: "Shipment created", template: "shipping_started", source: "shipments insert" },
  { event: "Shipment delivered", template: "shipping_delivered", source: "shipments update where status='delivered'" },
  { event: "Streak bonus earned", template: "streak_reward", source: "coin_transactions insert where reason='streak_bonus'" },
];

export default function TriggersPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Triggers</h1>
        <p className="text-sm text-muted-foreground">
          Real events that fire an auto-email. Each trigger reads the corresponding template, fills variables from the event row, and sends via Resend.
        </p>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-blue-600" />
            Trigger map
          </CardTitle>
          <CardDescription>Event → Template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {TRIGGERS.map((t) => (
            <div key={t.event} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.event}</p>
                <p className="text-xs text-muted-foreground font-mono">{t.source}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-blue-500" />
              <a
                href={`/auto/templates/${t.template}`}
                className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                {t.template}
              </a>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-teal-600" />
            How the triggers fire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Every trigger is a Postgres row-level trigger that calls
            <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs">/api/email/send</code>
            via the <code className="text-xs">pg_net</code> extension.
            Templates render server-side with variables from the triggering row.
          </p>
          <p>
            <b>Setup:</b> enable <code className="text-xs">pg_net</code> in Supabase → run the trigger install SQL
            (grab it from Setup / SQL → Migration 1f) → add <code className="text-xs">RESEND_API_KEY</code> to Vercel env.
          </p>
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Test individual templates from the template editor before enabling triggers.
            Every send lands in <b>Send Log</b> with success or failure detail.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
