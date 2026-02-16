import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works - BotCheck",
  description:
    "Learn how BotCheck checks your site for AI crawler visibility. Understand the scoring system, what gets checked and how to improve your results.",
};

const FAQ_ITEMS = [
  {
    q: "What does BotCheck actually check?",
    a: "BotCheck runs 7 checks against your URL: robots.txt rules for 30+ AI crawlers, meta directives like noai and noindex, HTTP headers such as X-Robots-Tag, AI discovery files like llms.txt and ai.txt, response speed, paywall and login wall detection, and HTML content structure quality.",
  },
  {
    q: "How is the score calculated?",
    a: 'Each check gets a score from 0 to 100 and they are combined using weighted averages. Weights change based on your selected mode. In "Be Found" mode robots.txt is 30% and response speed is 15%. In "Block" mode robots.txt is 35% and meta directives are 20%. All weights are shown in your results.',
  },
  {
    q: "Is robots.txt enough to block AI?",
    a: "Not on its own. robots.txt is advisory. Reputable crawlers from OpenAI, Anthropic and Google respect it but it is not enforcement. For stronger protection combine robots.txt with meta directives, X-Robots-Tag headers and access controls. BotCheck checks all of these.",
  },
  {
    q: "What are AI discovery files?",
    a: "Emerging standards like llms.txt, ai.txt and ai-plugin.json help AI systems understand your site. llms.txt provides an LLM-friendly description of your content. These are optional but increasingly useful for AI visibility.",
  },
  {
    q: "Does BotCheck store my URL or data?",
    a: "No. BotCheck is completely stateless. There is no database, no user accounts and no logging. Your scan history is stored only in your browser and never leaves your device.",
  },
  {
    q: "Why does my score change between modes?",
    a: 'The same configuration means different things depending on your goal. For example blocking a major crawler is great for "Block" mode but bad for "Be Found" mode. The weights also shift because response speed matters more for visibility than for blocking.',
  },
];

export default function HowItWorks() {
  return (
    <>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-primary)" }}
      >
        <Link
          href="/"
          className="text-[15px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          BotCheck
        </Link>
        <Link
          href="/"
          className="px-4 py-2 text-xs font-medium rounded-lg"
          style={{
            backgroundColor: "var(--accent)",
            color: "#fff",
          }}
        >
          Run a Scan
        </Link>
      </nav>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-tight mb-3"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          How It Works
        </h1>
        <p className="text-sm mb-12" style={{ color: "var(--text-secondary)" }}>
          Everything you need to know about BotCheck scans, scoring and AI crawler visibility.
        </p>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="rounded-xl border group"
              style={{ borderColor: "var(--border-light)" }}
            >
              <summary
                className="flex items-center justify-between p-5 cursor-pointer select-none list-none"
                style={{ color: "var(--text-primary)" }}
              >
                <span className="text-sm font-medium pr-4">{item.q}</span>
                <svg
                  className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 pt-0 border-t" style={{ borderColor: "var(--border-light)" }}>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {item.a}
                </p>
              </div>
            </details>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link
            href="/"
            className="inline-block px-8 py-3 text-sm font-medium rounded-lg"
            style={{
              backgroundColor: "var(--accent)",
              color: "#fff",
            }}
          >
            Run a Scan
          </Link>
          <p className="text-xs mt-4" style={{ color: "var(--text-tertiary)" }}>
            No login. No tracking. Free to use.
          </p>
        </div>
      </main>
    </>
  );
}
