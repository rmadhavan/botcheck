import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://botcheck.app"),
  title: {
    default: "BotCheck - How visible is your site to AI?",
    template: "%s | BotCheck",
  },
  description:
    "Free tool to check which AI crawlers like GPTBot, ClaudeBot and Google-Extended are allowed or blocked on your site. Scans robots.txt, meta tags, headers and more. No login. No tracking.",
  keywords: [
    "AI crawler checker",
    "robots.txt checker",
    "GPTBot",
    "ClaudeBot",
    "Google-Extended",
    "AI visibility",
    "AI bot blocker",
    "robots.txt tester",
    "AI crawlers",
    "AI SEO",
    "llms.txt",
    "AI scraping",
    "block AI bots",
    "AI content protection",
    "website AI scanner",
  ],
  authors: [{ name: "BotCheck", url: "https://botcheck.app" }],
  creator: "BotCheck",
  publisher: "BotCheck",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "BotCheck - How visible is your site to AI?",
    description:
      "Free tool to check which AI crawlers are allowed or blocked on your site. Scans robots.txt, meta tags, headers and more. No login required.",
    url: "https://botcheck.app",
    siteName: "BotCheck",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BotCheck - How visible is your site to AI?",
    description:
      "Free tool to check which AI crawlers are allowed or blocked on your site. Scans robots.txt, meta tags, headers and more. No login required.",
  },
  icons: {
    icon: "/favicon.svg",
  },
  alternates: {
    canonical: "https://botcheck.app",
  },
  category: "Technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
        {children}
      </body>
    </html>
  );
}
