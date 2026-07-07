export const metadata = {
  title: "Support — Starship StoryTime",
  description: "How to reach us",
};

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-slate-800">
      <header className="mb-10 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-indigo-900">
          Support
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Starship StoryTime
        </p>
      </header>

      <div className="space-y-8 text-[15px] leading-relaxed text-slate-700">
        <p>
          We&apos;re a small team and we read every message. Whether it&apos;s a
          bug, a suggestion for a new story, or a question about your order,
          we want to hear from you.
        </p>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
          <h2 className="text-lg font-semibold text-indigo-900">Email us</h2>
          <p className="mt-2">
            <a
              href="mailto:learningchateau@gmail.com"
              className="text-indigo-700 underline"
            >
              learningchateau@gmail.com
            </a>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            We usually reply within one business day.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight text-indigo-900">
            Common questions
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-900">
                Where is my physical book?
              </h3>
              <p>
                Books usually ship within 7 business days of your purchase. If
                it&apos;s been longer, email us with your order number and
                we&apos;ll track it down.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-slate-900">
                I can&apos;t sign in — what do I do?
              </h3>
              <p>
                Double-check your email address for typos. If you&apos;ve
                forgotten your password, use the &quot;Forgot password&quot;
                link on the login screen. If that doesn&apos;t work, email us.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-slate-900">
                Can I get a refund?
              </h3>
              <p>
                Digital access is non-refundable, but we accept returns of
                unopened physical books within 30 days. Email us to start a
                return.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-slate-900">
                My streak reset — did I do something wrong?
              </h3>
              <p>
                No! Streaks are meant to be gentle, not stressful. You can
                always start a new one. Watching the AI visuals doesn&apos;t
                count toward streaks — only listening or reading does. That&apos;s
                on purpose so you&apos;re rewarded for reflective time, not
                passive time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
