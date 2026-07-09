import { createClient } from "@supabase/supabase-js";

/**
 * Public unsubscribe page — no auth required.
 * URL: /u/{unsubscribe_token}
 * Emails include a link here so recipients can opt out with one click.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const metadata = {
  title: "Unsubscribe — Starship StoryTime",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Look up the user by token and opt them out
  const { data: user } = await supabase
    .from("users")
    .select("id, email, username, email_opted_out")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center text-slate-800">
        <h1 className="mb-4 text-2xl font-semibold">Link not recognized</h1>
        <p className="text-sm text-slate-600">
          This unsubscribe link is invalid or expired. If you meant to opt out of Starship StoryTime emails,
          reply to any of our messages and we&apos;ll take care of it.
        </p>
      </main>
    );
  }

  // If not already opted out, opt them out
  const alreadyOptedOut = user.email_opted_out;
  if (!alreadyOptedOut) {
    await supabase
      .from("users")
      .update({
        email_opted_out: true,
        email_opted_out_at: new Date().toISOString(),
        email_opted_out_reason: "user_unsubscribed",
      })
      .eq("id", user.id);

    // Also pause any in-flight drip enrollments
    await supabase
      .from("drip_enrollments")
      .update({ status: "unsubscribed" })
      .eq("user_id", user.id)
      .eq("status", "active");
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-20 text-center text-slate-800">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500">
        <span className="text-3xl">✉️</span>
      </div>
      <h1 className="mb-3 text-2xl font-semibold">You&apos;re unsubscribed</h1>
      <p className="mb-6 text-sm text-slate-600 leading-relaxed">
        We won&apos;t send any more marketing emails to <b>{user.email}</b>.
        You&apos;ll still get transactional emails (order confirmations, shipping updates) — those are required.
      </p>
      <p className="text-xs text-slate-500">
        Changed your mind?{" "}
        <a href={`mailto:hello@starshipstorytime.com?subject=Resubscribe%20${encodeURIComponent(user.email ?? "")}`} className="underline">
          Email us
        </a>{" "}
        and we&apos;ll turn communications back on.
      </p>
    </main>
  );
}
