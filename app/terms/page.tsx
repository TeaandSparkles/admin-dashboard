export const metadata = {
  title: "Terms of Service — Starship StoryTime",
  description: "The rules for using Starship StoryTime",
};

const LAST_UPDATED = "May 27, 2026";
const COMPANY = "Tea and Sparkles";
const APP = "Starship StoryTime";
const CONTACT_EMAIL = "learningchateau@gmail.com";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-slate-800">
      <header className="mb-10 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-indigo-900">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {APP} · {COMPANY} · Last updated {LAST_UPDATED}
        </p>
      </header>

      <div className="space-y-8 text-[15px] leading-relaxed">
        <Section title="Welcome">
          <p>
            These terms apply when you use {APP}, an audio storytelling app
            published by {COMPANY}. By creating an account or making a purchase,
            you agree to these terms.
          </p>
        </Section>

        <Section title="What Starship StoryTime is">
          <p>
            {APP} is a serialized audio storytelling platform. Each story series
            you purchase includes:
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>Lifetime digital access to all chapters (audio and text)</li>
            <li>A printed tiny book shipped to your home</li>
            <li>AI-generated visual illustrations that accompany the audio</li>
          </ul>
        </Section>

        <Section title="Your account">
          <p>
            You must be at least 18 years old, or have permission from a parent
            or guardian, to create an account. You are responsible for keeping
            your password secure. One account is intended for one household.
          </p>
        </Section>

        <Section title="Purchases and shipping">
          <p>
            When you buy a series, you receive lifetime digital access along
            with a physical book shipped to the address you provide. Physical
            books typically ship within 7 business days. Shipping times depend
            on your location and carrier.
          </p>
          <p>
            All prices are shown in United States dollars unless otherwise
            noted. Taxes and shipping costs are calculated at checkout.
          </p>
        </Section>

        <Section title="Refunds">
          <p>
            Digital access is non-refundable once granted. For physical books,
            we accept returns of unopened items within 30 days of delivery.
            Contact{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">
              {CONTACT_EMAIL}
            </a>{" "}
            to start a return.
          </p>
        </Section>

        <Section title="Content ownership">
          <p>
            All stories, audio, illustrations, and printed books are the
            copyright of {COMPANY} or their respective creators. When you
            purchase a series, you receive a personal, non-transferable license
            to enjoy it. You may not copy, redistribute, sell, or publicly
            perform the content.
          </p>
        </Section>

        <Section title="Family use and lessons">
          <p>
            {APP} is designed to help families share meaningful stories.
            Some stories address hard themes like loss, courage, and change,
            because real life contains those things. Every story is written
            to leave the listener with something to reflect on. We do our best
            to signal age suitability so families can choose thoughtfully.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-inside list-disc space-y-2">
            <li>Try to break into other users&apos; accounts</li>
            <li>
              Copy, redistribute, or publicly rebroadcast the audio, printed
              books, or illustrations
            </li>
            <li>Attempt to reverse-engineer the app</li>
            <li>Use the app to harass others</li>
          </ul>
        </Section>

        <Section title="Changes to these terms">
          <p>
            We may update these terms occasionally. When we make material
            changes, we will let you know through the app. Continued use of
            {" "}{APP} after we notify you means you accept the changes.
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
