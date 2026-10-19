import Link from "next/link";

export default function Landing() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-16">
      <p className="font-semibold text-primary">HerVest</p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight">See your future, shape your wealth.</h1>
      <p className="mt-4 text-lg text-muted">
        A calm place to understand investing, explore what changes when life changes, and build confidence at
        your own pace. Built for Canadians starting out, and open to everyone.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/onboarding" className="btn">
          Try the demo
        </Link>
        <Link href="/future-you" className="btn-secondary">
          Jump to Future You
        </Link>
      </div>
      <ul className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          ["Future You", "Model a career break or a new monthly amount and see the difference."],
          ["Learn", "Short lessons on compounding, risk, ETFs and Canadian accounts."],
          ["Ask HerVest", "Plain-language explanations. Education, not advice."],
        ].map(([t, d]) => (
          <li key={t} className="card">
            <h2 className="font-semibold">{t}</h2>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </li>
        ))}
      </ul>
      <section aria-labelledby="privacy" className="card mt-10">
        <h2 id="privacy" className="font-semibold">
          Private by default
        </h2>
        <p className="mt-1 text-sm text-muted">
          Demo mode keeps everything in your browser. We never ask for your SIN, banking login or income proof, and
          HerVest cannot buy, sell or link to any account. All numbers are hypothetical illustrations, not forecasts
          or guarantees.
        </p>
      </section>
    </main>
  );
}
