import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/email/webhook
 * Resend calls this when an email is delivered / opened / clicked / bounced.
 * Configure in Resend dashboard → Webhooks with URL:
 *   https://<your-vercel-domain>/api/email/webhook
 * Then paste RESEND_WEBHOOK_SECRET into Vercel env.
 *
 * Payload shape:
 *   { type: "email.opened" | "email.clicked" | "email.delivered" | "email.bounced" | ...,
 *     data: { email_id: string, to: string[], created_at: string, ... } }
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function POST(req: Request) {
  try {
    if (!serviceKey) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY missing" }, { status: 500 });
    }

    const body = await req.json();
    const type: string = body?.type ?? "";
    const providerId: string | undefined = body?.data?.email_id;
    if (!providerId) {
      return NextResponse.json({ ok: true, ignored: "no email_id" });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const now = new Date().toISOString();

    const updates: Record<string, string | number> = {};
    switch (type) {
      case "email.delivered":
        updates.delivered_at = now;
        break;
      case "email.opened":
        updates.opened_at = now;
        break;
      case "email.clicked":
        updates.clicked_at = now;
        break;
      case "email.bounced":
      case "email.hard_bounced":
      case "email.soft_bounced":
        updates.bounced_at = now;
        updates.status = "bounced";
        break;
      case "email.complained":
        updates.complained_at = now;
        updates.status = "complained";
        break;
      default:
        return NextResponse.json({ ok: true, ignored: type });
    }

    // Load the current row to increment counters
    const { data: current } = await supabase
      .from("email_sends")
      .select("id, open_count, click_count, to_email")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (!current) {
      return NextResponse.json({ ok: true, ignored: "no matching send" });
    }

    if (type === "email.opened") {
      updates.open_count = ((current as { open_count?: number }).open_count ?? 0) + 1;
    }
    if (type === "email.clicked") {
      updates.click_count = ((current as { click_count?: number }).click_count ?? 0) + 1;
    }

    await supabase.from("email_sends").update(updates).eq("id", (current as { id: string }).id);

    // On complaint or hard bounce: auto opt-out the recipient
    if (type === "email.complained" || type === "email.hard_bounced") {
      await supabase
        .from("users")
        .update({
          email_opted_out: true,
          email_opted_out_at: now,
          email_opted_out_reason: type === "email.complained" ? "complained" : "hard_bounced",
        })
        .eq("email", (current as { to_email: string }).to_email);
    }

    return NextResponse.json({ ok: true, applied: type });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
