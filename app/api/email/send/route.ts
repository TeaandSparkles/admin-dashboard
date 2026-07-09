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
    // Also fetch unsubscribe_token so we can auto-append the unsub link
    const { data: userRow } = await supabase
      .from("users")
      .select("email_opted_out, unsubscribe_token")
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

    // Compute unsubscribe URL and inject it into template variables + as email header
    const origin = new URL(req.url).origin;
    const unsubUrl = (userRow as { unsubscribe_token?: string })?.unsubscribe_token
      ? `${origin}/u/${(userRow as { unsubscribe_token: string }).unsubscribe_token}`
      : `${origin}/u/unknown`;
    const fullVars = { ...variables, unsubscribe_url: unsubUrl };

    const subject = render(template.subject, fullVars);
    let html = render(template.html_body, fullVars);
    let text = render(template.text_body, fullVars);
    const from = `${template.from_name} <${template.from_email}>`;

    // Auto-append a footer if the template didn't use {{unsubscribe_url}}
    if (!template.html_body.includes("unsubscribe_url")) {
      html += `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" /><p style="font-size:11px;color:#94a3b8">You&#39;re receiving this because you have an account with Starship StoryTime. <a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline">Unsubscribe</a>.</p>`;
    }
    if (!template.text_body.includes("unsubscribe_url")) {
      text += `\n\n---\nYou're receiving this because you have an account with Starship StoryTime.\nUnsubscribe: ${unsubUrl}`;
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to_email],
        subject,
        html,
        text,
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
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
