import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | FunBx",
  description: "How FunBx handles account, media, and usage data.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-4xl space-y-8 pb-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-customRed">
          Legal
        </p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground">Last updated: May 27, 2026</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">What We Collect</h2>
        <p className="leading-7 text-muted-foreground">
          FunBx collects the account details you provide, such as your email
          address and display name, plus content and interaction data needed to
          power features like uploads, saved videos, likes, watch history,
          subscriptions, gaming access, and future entertainment categories.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How We Use Data</h2>
        <p className="leading-7 text-muted-foreground">
          We use your data to authenticate your account, personalize your
          experience, sync protected features, provide security emails, and keep
          the app reliable. We do not sell your personal information.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Third-Party Services</h2>
        <p className="leading-7 text-muted-foreground">
          FunBx uses services such as Firebase for authentication, Supabase for
          app data, Resend for transactional email, and media/content providers
          such as YouTube and GamePix. Those providers may process data under
          their own privacy policies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Your Choices</h2>
        <p className="leading-7 text-muted-foreground">
          You can manage account-related actions from{" "}
          <Link href="/settings" className="text-customRed hover:underline">
            Settings
          </Link>
          . You may also contact the project maintainer to request support with
          account data access or deletion.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Security</h2>
        <p className="leading-7 text-muted-foreground">
          We use authentication tokens, session cookies, protected server
          routes, and short-lived verification codes for sensitive account
          actions. No system is perfect, but FunBx is built to limit exposure
          and keep sensitive operations server-side.
        </p>
      </section>
    </article>
  );
}
