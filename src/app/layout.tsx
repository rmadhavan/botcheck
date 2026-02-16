import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://botcheck.app"),
  title: "BotCheck - How visible is your site to AI?",
  description:
    "Run a scan to see which AI crawlers are allowed or blocked on your site based on your current configuration. No login. No tracking. Free to use.",
  openGraph: {
    title: "BotCheck - How visible is your site to AI?",
    description:
      "Run a scan to see which AI crawlers are allowed or blocked on your site based on your current configuration. No login. No tracking. Free to use.",
    url: "https://botcheck.app",
    siteName: "BotCheck",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BotCheck - How visible is your site to AI?",
    description:
      "Run a scan to see which AI crawlers are allowed or blocked on your site based on your current configuration. No login. No tracking. Free to use.",
  },
  icons: {
    icon: "/favicon.svg",
  },
  alternates: {
    canonical: "https://botcheck.app",
  },
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
