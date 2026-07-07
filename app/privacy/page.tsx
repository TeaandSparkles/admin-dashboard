export const metadata = {
  title: "Privacy Policy — Starship StoryTime",
  description: "How Starship StoryTime handles your data",
};

const LAST_UPDATED = "May 27, 2026";
const COMPANY = "Starship StoryTime";
const APP = "Starship StoryTime";
const CONTACT_EMAIL = "learningchateau@gmail.com";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-slate-800">
      <header className="mb-10 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-indigo-900">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {APP} · {COMPANY} · Last updated {LAST_UPDATED}
        </p>
      </header>

      <div className="space-y-8 text-[15px] leading-relaxed">
        <Section title="Who we are">
          <p>
            {APP} is an audio storytelling app for families, published by {COMPANY}.
            This policy explains what data we collect when you use the app,
            how we use it, and the choices you have.
          </p>
          <p>
            Questions? Email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">
              {CONTACT_EMAIL}
            </a>.
          </p>
        </Section>

        <Section title="Information we collect">
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Account information</strong> — your email address, chosen
              username, and password (encrypted). Provided when you sign up.
            </li>
            <li>
              <strong>Purchase history</strong> — which story series your household
              has bought, along with your shipping address for physical books.
            </li>
            <li>
              <strong>Listening progress</strong> — which chapters you have listened
              to or read, and how far into each chapter you are. Used to sync your
              place across devices and to power the family listening streak.
            </li>
            <li>
              <strong>Device information</strong> — basic technical data such as
              device type, operating system version, and language, used to keep
              the app working correctly.
            </li>
            <li>
              <strong>Support communications</strong> — if you email us, we keep
              your message so we can help you.
            </li>
          </ul>
          <p>
            We do <strong>not</strong> collect location data, contacts, photos,
            microphone recordings, or health data. We do not use tracking
            advertising SDKs.
          </p>
        </Section>

        <Section title="How we use your information">
          <ul className="list-inside list-disc space-y-2">
            <li>To let you sign in and access the stories you have purchased.</li>
            <li>To ship the physical book that comes with each series purchase.</li>
            <li>To remember where you left off in a chapter across devices.</li>
            <li>
              To track your family listening streak so we can send you free bonus
              chapters as a thank-you (this is opt-in).
            </li>
            <li>To respond to your support questions.</li>
            <li>To fix bugs and improve the app.</li>
          </ul>
        </Section>

        <Section title="Who we share your information with">
          <p>
            We share only what is necessary, with a small number of service
            providers, and never sell your personal information.
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Supabase</strong> — the database and authentication provider
              we use to store your account and content library.
            </li>
            <li>
              <strong>Payment processors</strong> — when you buy a series, our
              payment processor handles the transaction. We never see or store
              your full card number.
            </li>
            <li>
              <strong>Shipping providers</strong> — to deliver the physical books
              you purchase, we share your shipping address with the carrier.
            </li>
            <li>
              <strong>Google Play Services</strong> — for app delivery and updates.
            </li>
          </ul>
        </Section>

        <Section title="Children">
          <p>
            {APP} is designed for families, and many of our listeners are children.
            However, the account is held by an adult in the household. We do not
            knowingly create direct accounts for children under 13 in the United
            States or under 16 in the European Economic Area. Parents are the
            account holders and choose which stories to purchase for their family.
          </p>
          <p>
            If you believe a child has created their own account without a
            parent&apos;s consent, please contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">
              {CONTACT_EMAIL}
            </a>{" "}
            and we will remove it.
          </p>
        </Section>

        <Section title="Your choices and rights">
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>View or update your data</strong> — you can see and change
              your account details from the app&apos;s profile screen.
            </li>
            <li>
              <strong>Delete your account</strong> — email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">
                {CONTACT_EMAIL}
              </a>{" "}
              and we will delete your account and all associated data within 30 days.
            </li>
            <li>
              <strong>Export your data</strong> — you can request a copy of the
              data we hold about you at any time.
            </li>
            <li>
              <strong>Opt out of streaks</strong> — the family listening streak
              feature is optional and can be turned off in-app.
            </li>
          </ul>
        </Section>

        <Section title="Data retention">
          <p>
            We keep your account and purchase history as long as your account is
            active. If you delete your account, we remove your personal data within
            30 days, except where we are legally required to keep records (for
            example, purchase receipts for tax purposes, which we keep for the
            legally required period).
          </p>
        </Section>

        <Section title="Security">
          <p>
            We use industry-standard security practices, including encrypted
            passwords, transport-layer encryption on all network requests, and
            row-level access controls that ensure you can only see your own data.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we make material changes to this policy, we will notify you
            through the app and update the &quot;last updated&quot; date at the
            top of this page.
          </p>
        </Section>

        <Section title="Contact us">
          <p>
            {COMPANY}
            <br />
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight text-indigo-900">{title}</h2>
      <div className="space-y-3 text-slate-700">{children}</div>
    </section>
  );
}
