export const metadata = {
  title: "Terms of Service | FunBx",
  description: "Terms for using FunBx.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-4xl space-y-8 pb-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-customRed">
          Legal
        </p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Terms of Service
        </h1>
        <p className="text-muted-foreground">Last updated: May 27, 2026</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Using FunBx</h2>
        <p className="leading-7 text-muted-foreground">
          FunBx is an entertainment app for watching videos, playing games, and
          discovering media experiences. By using the app, you agree to use it
          responsibly and comply with applicable laws and platform rules.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Accounts</h2>
        <p className="leading-7 text-muted-foreground">
          You are responsible for keeping your account secure. Some features,
          including uploads, likes, saved videos, subscriptions, and watch
          history, require authentication.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Content and Services</h2>
        <p className="leading-7 text-muted-foreground">
          FunBx may display or embed content from third-party providers. Access,
          availability, metadata, and playback can change based on those
          providers and their policies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Acceptable Use</h2>
        <p className="leading-7 text-muted-foreground">
          Do not abuse the app, attempt to bypass security controls, upload
          unlawful content, or interfere with other users&apos; access. We may limit
          or remove access if activity is harmful or violates these terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Changes</h2>
        <p className="leading-7 text-muted-foreground">
          FunBx is still evolving. Features, integrations, and these terms may
          change as the product grows.
        </p>
      </section>
    </article>
  );
}
