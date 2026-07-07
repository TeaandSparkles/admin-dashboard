import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/email/send
 * Body: { template_key: string, to_email: string, variables?: Record<string, string | number> }
 * Env: RESEND_API_KEY  +  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 *
 * Reads the template from Supabase, substitutes {{variables}}, hits Resend,
 * logs the outcome to email_sends. Called by DB triggers and manual test button.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const resendKey = process.env.RESEND_API_KEY ?? "";

function render(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`
  );
}

export async function POST(req: Request) {
  try {
    if (!resendKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not set in Vercel env. Add it to enable sending." },
        { status: 500 }
      );
    }
    if (!serviceKey) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY is not set in Vercel env." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { template_key, to_email, variables = {} } = body ?? {};
    if (!template_key || !to_email) {
      return NextResponse.json({ error: "template_key and to_email are required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: template, error: tErr } = await supabase
      .from("email_templates")
      .select("key, subject, html_body, text_body, from_name, from_email, enabled")
      .eq("key", template_key)
      .maybeSingle();

    if (tErr || !template) {
      return NextResponse.json({ error: `Template not found: ${template_key}` }, { status: 404 });
    }
    if (!template.enabled) {
      return NextResponse.json({ error: `Template ${template_key} is disabled` }, { status: 403 });
    }

    // Per-user opt-out check — the global kill switch
    const { data: userRow } = await supabase
      .from("users")
      .select("email_opted_out")
      .eq("email", to_email)
      .maybeSingle();
    if (userRow?.email_opted_out) {
      await supabase.from("email_sends").insert({
        template_key,
        to_email,
        subject: template.subject,
        status: "skipped",
        error: "recipient opted out",
        variables,
      });
      return NextResponse.json({ ok: true, skipped: true, reason: "opted out" });
    }

    const subject = render(template.subject, variables);
    const html = render(template.html_body, variables);
    const text = render(template.text_body, variables);
    const from = `${template.from_name} <${template.from_email}>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to_email], subject, html, text }),
    });

    const resendBody = await resendRes.json().catch(() => ({}));

    if (!resendRes.ok) {
      await supabase.from("email_sends").insert({
        template_key,
        to_email,
        subject,
        status: "failed",
        error: JSON.stringify(resendBody).slice(0, 500),
        variables,
      });
      return NextResponse.json({ error: "Resend rejected the send", detail: resendBody }, { status: 502 });
    }

    await supabase.from("email_sends").insert({
      template_key,
      to_email,
      subject,
      status: "sent",
      provider_id: resendBody?.id ?? null,
      variables,
    });

    return NextResponse.json({ ok: true, id: resendBody?.id ?? null });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
