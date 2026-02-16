"use client";

import { useState, useEffect, useCallback } from "react";
import ScoreRing from "@/components/ScoreRing";
import CheckCard from "@/components/CheckCard";
import BotList from "@/components/BotList";
import ShareBar from "@/components/ShareBar";

interface BotResult {
  name: string;
  userAgent: string;
  operator: string;
  purpose: string;
  respectsRobots: boolean | string;
  allowed: boolean;
}

interface Recommendation {
  text: string;
  snippet?: string;
  snippetLang?: string;
}

interface CheckResult {
  id: string;
  name: string;
  score: number;
  weight: number;
  status: "pass" | "warn" | "fail";
  summary: string;
  details: string[];
  recommendation?: Recommendation;
}

interface Insight {
  type: "good" | "warning" | "tip";
  text: string;
}

interface ScanResult {
  url: string;
  mode: "block" | "allow";
  score: number;
  checks: CheckResult[];
  robotsTxtFound: boolean;
  robotsTxtUrl: string;
  bots: BotResult[];
  summary: string;
  scannedAt: string;
  insights: Insight[];
}

interface HistoryEntry {
  url: string;
  mode: "block" | "allow";
  score: number;
  scannedAt: string;
}

// ─── Loading Steps ──────────────────────────────────────────────────

const LOADING_STEPS = [
  { label: "Fetching robots.txt", delay: 0 },
  { label: "Loading page content", delay: 800 },
  { label: "Checking meta directives", delay: 1600 },
  { label: "Inspecting HTTP headers", delay: 2200 },
  { label: "Scanning AI discovery files", delay: 2800 },
  { label: "Analyzing page structure", delay: 3500 },
  { label: "Calculating score", delay: 4200 },
];

// ─── Scan History Helpers ───────────────────────────────────────────

const HISTORY_KEY = "botcheck_history";
const MAX_HISTORY = 10;

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToHistory(entry: HistoryEntry) {
  try {
    const history = loadHistory();
    const filtered = history.filter(
      (h) => !(h.url === entry.url && h.mode === entry.mode)
    );
    filtered.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)));
  } catch {
    // localStorage not available
  }
}

// ─── Site tagline (used in footer + sharing) ────────────────────────
const SITE_TAGLINE = "Free and open-source AI crawler visibility checker. No login. No tracking. Free to use.";

// ─── Component ──────────────────────────────────────────────────────

export default function Home() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"block" | "allow">("allow");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBots, setShowBots] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleScan = useCallback(async (scanUrl?: string, scanMode?: "block" | "allow") => {
    const targetUrl = scanUrl || url;
    const targetMode = scanMode || mode;
    if (!targetUrl.trim()) return;

    setLoading(true);
    setLoadingStep(0);
    setError(null);
    setResult(null);
    setShowBots(false);
    setShowHistory(false);
    setShowEmailForm(false);

    const timers: NodeJS.Timeout[] = [];
    LOADING_STEPS.forEach((step, i) => {
      if (i > 0) {
        timers.push(setTimeout(() => setLoadingStep(i), step.delay));
      }
    });

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim(), mode: targetMode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Scan failed");
        return;
      }

      setResult(data);
      setUrl(targetUrl.trim());
      setMode(targetMode);

      const entry: HistoryEntry = {
        url: data.url,
        mode: targetMode,
        score: data.score,
        scannedAt: data.scannedAt,
      };
      saveToHistory(entry);
      setHistory(loadHistory());
    } catch {
      setError("Could not reach the scan service.\n\nThis could be a network issue or the server may be temporarily unavailable.\n\nTry refreshing the page and scanning again.");
    } finally {
      timers.forEach(clearTimeout);
      setLoading(false);
    }
  }, [url, mode]);

  function handleModeSwitch(newMode: "block" | "allow") {
    if (result && newMode !== result.mode) {
      setMode(newMode);
      handleScan(result.url, newMode);
    } else {
      setMode(newMode);
    }
  }

  function buildResultsText() {
    if (!result) return "";
    const modeLabel = result.mode === "block" ? "AI Protection" : "AI Visibility";
    let text = `BotCheck Report\n`;
    text += `================================\n\n`;
    text += `URL: ${result.url}\n`;
    text += `Mode: ${modeLabel}\n`;
    text += `Score: ${result.score}/100\n`;
    text += `Summary: ${result.summary}\n\n`;
    text += `Check Results\n`;
    text += `--------------------------------\n`;
    for (const check of result.checks) {
      const statusIcon = check.status === "pass" ? "PASS" : check.status === "warn" ? "WARN" : "FAIL";
      text += `[${statusIcon}] ${check.name}: ${check.score}/100\n`;
      text += `  ${check.summary}\n`;
      for (const detail of check.details) {
        text += `  - ${detail}\n`;
      }
      if (check.recommendation) {
        text += `  Recommendation: ${check.recommendation.text}\n`;
      }
      text += `\n`;
    }
    text += `Bot Results (${result.bots.length} crawlers)\n`;
    text += `--------------------------------\n`;
    const allowed = result.bots.filter((b) => b.allowed);
    const blocked = result.bots.filter((b) => !b.allowed);
    text += `Allowed: ${allowed.map((b) => b.name).join(", ") || "None"}\n`;
    text += `Blocked: ${blocked.map((b) => b.name).join(", ") || "None"}\n\n`;
    text += `================================\n`;
    text += `Scanned: ${new Date(result.scannedAt).toLocaleString()}\n`;
    text += `Run your own scan at https://botcheck.app`;
    return text;
  }

  function handleEmailResults() {
    if (!emailAddress.trim() || !result) return;
    const subject = encodeURIComponent(`BotCheck Report: ${result.url} - Score ${result.score}/100`);
    const body = encodeURIComponent(buildResultsText());
    window.location.href = `mailto:${emailAddress.trim()}?subject=${subject}&body=${body}`;
    setEmailSent(true);
    setTimeout(() => { setEmailSent(false); setShowEmailForm(false); }, 3000);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText("https://botcheck.app");
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* fallback */ }
  }

  function handleShareSite(platform: string) {
    const siteUrl = "https://botcheck.app";
    const twitterText = "Did you know AI crawlers like GPTBot and ClaudeBot might be visiting your site right now? BotCheck shows you exactly what they can see. Free, no login, takes seconds.";
    const urls: Record<string, string> = {
      twitter: `https://x.com/intent/post?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(siteUrl)}`,
      linkedin: `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent("AI crawlers from OpenAI, Anthropic, Google and others are constantly visiting websites. But can they actually access yours?\n\nBotCheck scans your site and shows you exactly which crawlers are allowed or blocked based on your robots.txt, meta tags and headers. Takes seconds, no login required.\n\n" + siteUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`,
    };
    if (urls[platform]) window.open(urls[platform], "_blank", "noopener,noreferrer");
  }

  const passCount = result?.checks.filter((c) => c.status === "pass").length ?? 0;
  const warnCount = result?.checks.filter((c) => c.status === "warn").length ?? 0;
  const failCount = result?.checks.filter((c) => c.status === "fail").length ?? 0;

  const insightIcons = { good: "✅", warning: "⚠️", tip: "💡" };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "BotCheck",
            description: "See which AI crawlers are allowed or blocked on your site based on your current configuration.",
            applicationCategory: "WebApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }),
        }}
      />
      <nav className="w-full px-4 py-4 border-b" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-primary)" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1
            className="text-[15px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            BotCheck
          </h1>
          <div className="flex items-center gap-2">
            <a
              href="/how-it-works"
              className="text-xs px-3 py-2 rounded-md transition-all font-medium hover:bg-[var(--bg-secondary)]"
              style={{ color: "var(--text-secondary)" }}
            >
              How It Works
            </a>
            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs px-3 py-2 rounded-md transition-all font-medium"
                style={{
                  backgroundColor: showHistory ? "var(--bg-tertiary)" : "transparent",
                  color: showHistory ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                History
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* History Dropdown */}
      {showHistory && history.length > 0 && (
        <div className="w-full border-b" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-light)" }}>
          <div className="max-w-3xl mx-auto px-4 py-3">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-tertiary)" }}>Recent Scans</p>
            <div className="space-y-1.5">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setUrl(h.url.replace(/^https?:\/\//, ""));
                    setMode(h.mode);
                    handleScan(h.url, h.mode);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-md text-sm hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-light)" }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{
                      backgroundColor: h.mode === "allow" ? "var(--accent-sage-light)" : "var(--accent-red-light)",
                      color: h.mode === "allow" ? "var(--accent-sage)" : "var(--accent-red)",
                    }}>
                      {h.mode === "allow" ? "Find" : "Block"}
                    </span>
                    <span className="truncate" style={{ color: "var(--text-primary)" }}>
                      {h.url.replace(/^https?:\/\//, "")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span className="font-semibold text-sm" style={{
                      color: h.score >= 70 ? "var(--accent-sage)" : h.score >= 40 ? "var(--accent-warm)" : "var(--accent-red)",
                    }}>
                      {h.score}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {new Date(h.scannedAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-primary)" }}>
        {/* Hero Section */}
        <div className={`flex flex-col items-center justify-center px-4 pt-12 sm:pt-20 pb-8 sm:pb-12 ${result ? "" : "flex-1"}`}>
          <div className="max-w-2xl w-full text-center">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              How <span style={{ color: "var(--accent)" }}>visible</span> is your site to AI?
            </h1>
            <p className="text-base sm:text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
              Run a scan to see which AI crawlers are allowed or blocked on your site based on your current configuration.
              <br />
              <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                No login. No tracking. Free to use.
              </span>
            </p>

            {/* Mode Toggle */}
            <div className="flex flex-col items-center mb-8">
              <div className="inline-flex rounded-lg border p-1" style={{ borderColor: "var(--border-medium)", backgroundColor: "var(--bg-secondary)" }}>
                <button
                  onClick={() => result ? handleModeSwitch("allow") : setMode("allow")}
                  className="px-4 sm:px-6 py-2.5 text-sm font-medium transition-all rounded-md"
                  style={{
                    backgroundColor: mode === "allow" ? "#fff" : "transparent",
                    color: mode === "allow" ? "var(--bg-primary)" : "var(--text-secondary)",
                  }}
                >
                  Be Found by AI
                </button>
                <button
                  onClick={() => result ? handleModeSwitch("block") : setMode("block")}
                  className="px-4 sm:px-6 py-2.5 text-sm font-medium transition-all rounded-md"
                  style={{
                    backgroundColor: mode === "block" ? "#fff" : "transparent",
                    color: mode === "block" ? "var(--bg-primary)" : "var(--text-secondary)",
                  }}
                >
                  Block AI
                </button>
              </div>
              <p className="text-sm mt-3 max-w-md" style={{ color: "var(--text-tertiary)" }}>
                {mode === "block"
                  ? "Check whether your defenses are actually blocking AI crawlers from accessing your content."
                  : "See if AI crawlers can find and index your pages or if something is getting in the way."}
              </p>
            </div>

            {/* URL Input + Share Icons */}
            <div className="max-w-xl mx-auto">
              <div className="flex items-center gap-2 sm:gap-3">
                <form onSubmit={(e) => { e.preventDefault(); handleScan(); }} className="flex gap-2 sm:gap-3 flex-1 min-w-0">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="example.com"
                    className="flex-1 px-4 py-3 rounded-lg border text-base focus:outline-none transition-all min-w-0"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-light)",
                      color: "var(--text-primary)",
                    }}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !url.trim()}
                    className="px-5 sm:px-6 py-3 font-medium transition-all text-base shrink-0 rounded-lg"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "#fff",
                      opacity: loading || !url.trim() ? 0.5 : 1,
                      cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                      minHeight: "48px",
                    }}
                  >
                    {loading ? "Scanning..." : "Scan"}
                  </button>
                </form>

                {/* Share icons to the right of search */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleShareSite("twitter")} className="p-2 rounded-md transition-opacity hover:opacity-70" title="Share on X">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="var(--text-tertiary)">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </button>
                  <button onClick={() => handleShareSite("linkedin")} className="p-2 rounded-md transition-opacity hover:opacity-70" title="Share on LinkedIn">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="var(--text-tertiary)">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </button>
                  <button onClick={handleCopyLink} className="p-2 rounded-md transition-opacity hover:opacity-70" title="Copy link">
                    {linkCopied ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="var(--accent-sage)" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth={2}>
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {linkCopied && (
                <p className="text-xs text-center mt-2" style={{ color: "var(--accent-sage)" }}>Link copied</p>
              )}
            </div>

            {/* Loading Progress */}
            {loading && (
              <div className="mt-6 max-w-sm mx-auto text-left">
                <div className="space-y-2">
                  {LOADING_STEPS.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-sm transition-all duration-300"
                      style={{
                        opacity: i <= loadingStep ? 1 : 0.3,
                        color: i < loadingStep ? "var(--text-primary)" : i === loadingStep ? "var(--text-primary)" : "var(--text-tertiary)",
                      }}
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${i === loadingStep ? "loading-dot-active" : ""}`}
                        style={{
                          backgroundColor: i < loadingStep ? "var(--success)" : i === loadingStep ? "var(--accent)" : "var(--text-tertiary)",
                        }}
                      />
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 p-4 rounded-lg border text-left" style={{ backgroundColor: "var(--accent-red-light)", borderColor: "var(--accent-red)" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--accent-red)" }}>
                  Scan failed
                </p>
                <p className="text-sm whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                  {error}
                </p>
                <p className="text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>
                  Try visiting this URL in your browser first. If it does not load there it will not load here either.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="w-full max-w-3xl mx-auto px-4 pb-16">
            <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "40px" }}>

              {/* Insight Cards */}
              {result.insights && result.insights.length > 0 && (
                <div className="mb-8 space-y-2">
                  {result.insights.map((insight, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                      style={{
                        backgroundColor: insight.type === "good" ? "var(--accent-sage-light)"
                          : insight.type === "warning" ? "var(--accent-warm-light)"
                          : "var(--bg-secondary)",
                        borderColor: insight.type === "good" ? "var(--accent-sage)"
                          : insight.type === "warning" ? "var(--accent-warm)"
                          : "var(--border-light)",
                      }}
                    >
                      <span className="text-base shrink-0 mt-0.5">{insightIcons[insight.type]}</span>
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {insight.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Score + Summary */}
              <div className="flex flex-col items-center mb-10">
                <ScoreRing score={result.score} mode={result.mode} />
                <p className="mt-6 text-center max-w-md text-base sm:text-lg" style={{ color: "var(--text-secondary)" }}>
                  {result.summary}
                </p>
                <p className="mt-3 text-sm" style={{ color: "var(--text-tertiary)" }}>
                  {result.url}
                </p>

                {/* Mode Switch on Results */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Viewing:
                  </span>
                  <div className="inline-flex rounded-md border p-0.5" style={{ borderColor: "var(--border-medium)", backgroundColor: "var(--bg-secondary)" }}>
                    <button
                      onClick={() => handleModeSwitch("allow")}
                      className="px-3 py-1 rounded text-xs font-medium transition-all"
                      style={{
                        backgroundColor: result.mode === "allow" ? "var(--accent-sage)" : "transparent",
                        color: result.mode === "allow" ? "var(--bg-primary)" : "var(--text-secondary)",
                      }}
                    >
                      Be Found
                    </button>
                    <button
                      onClick={() => handleModeSwitch("block")}
                      className="px-3 py-1 rounded text-xs font-medium transition-all"
                      style={{
                        backgroundColor: result.mode === "block" ? "var(--accent-red)" : "transparent",
                        color: result.mode === "block" ? "var(--bg-primary)" : "var(--text-secondary)",
                      }}
                    >
                      Block
                    </button>
                  </div>
                </div>

                {/* Results sharing */}
                <div className="mt-6 flex flex-col items-center gap-4">
                  {/* Share your results */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Share your results</span>
                    <div className="flex items-center gap-2">
                      <ShareBar url={result.url} score={result.score} mode={result.mode} />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-32 h-px" style={{ backgroundColor: "var(--border-light)" }} />

                  {/* Email + Copy */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowEmailForm(!showEmailForm)}
                      className="text-xs px-3 py-1.5 rounded-md border transition-all font-medium flex items-center gap-1.5"
                      style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)" }}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M22 4l-10 8L2 4" />
                      </svg>
                      Email a copy to yourself
                    </button>
                    <button
                      onClick={async () => {
                        const text = buildResultsText();
                        try {
                          await navigator.clipboard.writeText(text);
                          const btn = document.getElementById("copy-results-btn");
                          if (btn) { btn.textContent = "Copied!"; setTimeout(() => { btn.textContent = "Copy results"; }, 2000); }
                        } catch { /* fallback */ }
                      }}
                      id="copy-results-btn"
                      className="text-xs px-3 py-1.5 rounded-md border transition-all font-medium flex items-center gap-1.5"
                      style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)" }}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copy results
                    </button>
                  </div>

                  {/* Email form */}
                  {showEmailForm && (
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="you@example.com"
                        className="px-3 py-1.5 rounded-md border text-sm focus:outline-none"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          borderColor: "var(--border-light)",
                          color: "var(--text-primary)",
                          width: "220px",
                        }}
                      />
                      <button
                        onClick={handleEmailResults}
                        disabled={!emailAddress.trim()}
                        className="text-xs px-3 py-1.5 rounded-md font-medium transition-all"
                        style={{
                          backgroundColor: "var(--accent-sage)",
                          color: "var(--bg-primary)",
                          opacity: !emailAddress.trim() ? 0.5 : 1,
                        }}
                      >
                        {emailSent ? "Sent!" : "Send"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Bar */}
              <div className="flex justify-center gap-8 sm:gap-12 mb-12">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--accent-sage)" }}>
                    {passCount}
                  </div>
                  <div className="text-xs mt-2 font-semibold" style={{ color: "var(--text-secondary)" }}>
                    Passed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--accent-warm)" }}>
                    {warnCount}
                  </div>
                  <div className="text-xs mt-2 font-semibold" style={{ color: "var(--text-secondary)" }}>
                    Warning
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--accent-red)" }}>
                    {failCount}
                  </div>
                  <div className="text-xs mt-2 font-semibold" style={{ color: "var(--text-secondary)" }}>
                    Failed
                  </div>
                </div>
              </div>

              {/* Check Cards */}
              <div className="space-y-3 sm:space-y-4 mb-10">
                <h2 className="text-lg sm:text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  Detailed Results
                </h2>
                {result.checks.map((check) => (
                  <CheckCard key={check.id} check={check} mode={result.mode} />
                ))}
              </div>

              {/* Scoring Weights */}
              <div className="mb-10 p-4 sm:p-5 rounded-lg border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-light)" }}>
                <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  Scoring Weights ({result.mode === "block" ? "Block" : "Be Found"} Mode)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {result.checks.map((check) => (
                    <div
                      key={check.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span style={{ color: "var(--text-secondary)" }}>{check.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-light)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${check.weight}%`, backgroundColor: "var(--text-secondary)" }}
                          />
                        </div>
                        <span style={{ color: "var(--text-tertiary)", width: "24px", textAlign: "right" }}>
                          {check.weight}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bot List (collapsible) */}
              <div>
                <button
                  onClick={() => setShowBots(!showBots)}
                  className="flex items-center gap-2 text-sm transition-colors mb-4 font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <svg
                    className="w-4 h-4 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{ transform: showBots ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  {showBots ? "Hide" : "Show"} individual bot results ({result.bots.length} crawlers)
                </button>
                {showBots && <BotList bots={result.bots} mode={result.mode} />}
              </div>

              {/* Note */}
              <p className="mt-8 text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
                robots.txt is advisory. Reputable crawlers respect it but compliance is not guaranteed. Scores reflect configuration not certainty.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-6 mt-auto" style={{ color: "var(--text-tertiary)", borderTop: "1px solid var(--border-light)" }}>
          <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
            <span style={{ color: "var(--text-primary)" }}>BotCheck</span>
            {" \u00B7 "}{SITE_TAGLINE}
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs">Know someone who should check their site?</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => handleShareSite("twitter")} className="p-1.5 transition-opacity hover:opacity-70" title="Share on X">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="var(--text-tertiary)">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>
              <button onClick={() => handleShareSite("linkedin")} className="p-1.5 transition-opacity hover:opacity-70" title="Share on LinkedIn">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="var(--text-tertiary)">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>
              <button onClick={handleCopyLink} className="p-1.5 transition-opacity hover:opacity-70" title="Copy link">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth={2}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
