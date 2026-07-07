import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/drips/tick
 * Cron endpoint. Finds every drip enrollment where next_send_at <= now(),
 * sends the current step's template, advances the step (or marks completed).
 *
 * Run every 5 minutes via Vercel Cron (see vercel.json) or Supabase pg_cron.
 * Called with header:  x-cron-secret: <CRON_SECRET env var>
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const cronSecret = process.env.CRON_SECRET ?? "";

interface Step {
  order_index: number;
  template_key: string;
  delay_hours: number;
  enabled: boolean;
}

export async function POST(req: Request) {
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!serviceKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY missing" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Fetch every enrollment that's due
  const { data: due } = await supabase
    .from("drip_enrollments")
    .select("id, user_id, campaign_id, current_step")
    .eq("status", "active")
    .lte("next_send_at", new Date().toISOString())
    .limit(200);

  const results: Array<{ enrollment: string; status: string; detail?: string }> = [];

  for (const enr of (due ?? []) as { id: string; user_id: string; campaign_id: string; current_step: number }[]) {
    try {
      // Look up user + campaign steps in parallel
      const [{ data: user }, { data: steps }] = await Promise.all([
        supabase.from("users").select("email, username, email_opted_out").eq("id", enr.user_id).single(),
        supabase
          .from("drip_steps")
          .select("order_index, template_key, delay_hours, enabled")
          .eq("campaign_id", enr.campaign_id)
          .order("order_index"),
      ]);

      const orderedSteps = ((steps ?? []) as Step[]).filter((s) => s.enabled);

      if (!user || !user.email) {
        await supabase.from("drip_enrollments").update({ status: "paused", paused_reason: "no email" }).eq("id", enr.id);
        results.push({ enrollment: enr.id, status: "paused_no_email" });
        continue;
      }

      if (user.email_opted_out) {
        await supabase.from("drip_enrollments").update({ status: "unsubscribed" }).eq("id", enr.id);
        results.push({ enrollment: enr.id, status: "unsubscribed" });
        continue;
      }

      const step = orderedSteps[enr.current_step];
      if (!step) {
        await supabase.from("drip_enrollments").update({ status: "completed" }).eq("id", enr.id);
        results.push({ enrollment: enr.id, status: "completed" });
        continue;
      }

      // Fire the send via the shared email API
      const origin = new URL(req.url).origin;
      const sendRes = await fetch(`${origin}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_key: step.template_key,
          to_email: user.email,
          variables: { user_name: user.username ?? "there" },
        }),
      });
      const sendBody = await sendRes.json().catch(() => ({}));

      if (!sendRes.ok) {
        // Don't advance; try again on the next tick, but log the failure
        results.push({ enrollment: enr.id, status: "send_failed", detail: sendBody?.error });
        continue;
      }

      // Advance to the next step
      const nextStep = orderedSteps[enr.current_step + 1];
      if (!nextStep) {
        await supabase
          .from("drip_enrollments")
          .update({ status: "completed", current_step: enr.current_step + 1, last_sent_at: new Date().toISOString() })
          .eq("id", enr.id);
        results.push({ enrollment: enr.id, status: "completed" });
      } else {
        const nextAt = new Date(Date.now() + nextStep.delay_hours * 3600_000).toISOString();
        await supabase
          .from("drip_enrollments")
          .update({
            current_step: enr.current_step + 1,
            next_send_at: nextAt,
            last_sent_at: new Date().toISOString(),
          })
          .eq("id", enr.id);
        results.push({ enrollment: enr.id, status: "advanced" });
      }
    } catch (e) {
      results.push({ enrollment: enr.id, status: "error", detail: (e as Error).message });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}

// Vercel Cron sends GET requests
export const GET = POST;
