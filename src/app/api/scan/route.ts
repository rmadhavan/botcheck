import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import robotsParser from "robots-parser";
import * as cheerio from "cheerio";

// ─── Types ───────────────────────────────────────────────────────────

interface BotEntry {
  name: string;
  userAgent: string;
  operator: string;
  purpose: string;
  respectsRobots: boolean | string;
}

interface BotResult {
  name: string;
  userAgent: string;
  operator: string;
  purpose: string;
  respectsRobots: boolean | string;
  allowed: boolean;
}

interface CheckResult {
  id: string;
  name: string;
  score: number; // 0-100 for this check
  weight: number; // weight used in final score
  status: "pass" | "warn" | "fail";
  summary: string;
  details: string[];
  recommendation?: {
    text: string;
    snippet?: string;
    snippetLang?: string;
  };
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

interface Insight {
  type: "good" | "warning" | "tip";
  text: string;
}

// ─── Scoring Weights ─────────────────────────────────────────────────
// Public and transparent — these are shown to the user.

const WEIGHTS = {
  block: {
    robotsTxt: 35,
    metaDirectives: 20,
    httpHeaders: 15,
    aiDiscoveryFiles: 5,
    responseStability: 5,
    paywallDetection: 10,
    contentStructure: 10,
  },
  allow: {
    robotsTxt: 30,
    metaDirectives: 15,
    httpHeaders: 10,
    aiDiscoveryFiles: 10,
    responseStability: 15,
    paywallDetection: 10,
    contentStructure: 10,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────

function loadBots(): BotEntry[] {
  const filePath = path.join(process.cwd(), "src/data/bots.yaml");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const data = yaml.load(fileContents) as { bots: BotEntry[] };
  return data.bots;
}

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url;
}

function getBaseUrl(siteUrl: string): string {
  const parsed = new URL(siteUrl);
  return `${parsed.protocol}//${parsed.host}`;
}

function statusLabel(score: number): "pass" | "warn" | "fail" {
  if (score >= 70) return "pass";
  if (score >= 40) return "warn";
  return "fail";
}

// ─── Check 1: robots.txt ─────────────────────────────────────────────

function checkRobotsTxt(
  robotsTxtContent: string,
  robotsTxtFound: boolean,
  normalizedUrl: string,
  robotsTxtUrl: string,
  bots: BotEntry[],
  mode: "block" | "allow"
): { check: CheckResult; botResults: BotResult[] } {
  const robots = robotsParser(robotsTxtUrl, robotsTxtContent);

  const botResults: BotResult[] = bots.map((bot) => {
    const isAllowed = robotsTxtFound
      ? robots.isAllowed(normalizedUrl, bot.userAgent) ?? true
      : true;
    return { ...bot, allowed: isAllowed };
  });

  const total = botResults.length;
  const blocked = botResults.filter((b) => !b.allowed).length;
  const allowed = botResults.filter((b) => b.allowed).length;

  let score: number;
  const details: string[] = [];

  if (mode === "block") {
    score = Math.round((blocked / total) * 100);
    if (!robotsTxtFound) {
      details.push("No robots.txt found — all bots have unrestricted access");
      score = 0;
    } else {
      details.push(`${blocked} of ${total} AI crawlers blocked`);
      if (allowed > 0) {
        const allowedNames = botResults
          .filter((b) => b.allowed)
          .slice(0, 5)
          .map((b) => b.name);
        details.push(
          `Still allowed: ${allowedNames.join(", ")}${allowed > 5 ? ` (+${allowed - 5} more)` : ""}`
        );
      }
    }
  } else {
    score = Math.round((allowed / total) * 100);
    if (!robotsTxtFound) {
      details.push("No robots.txt found — all bots can access by default");
      score = 100;
    } else {
      details.push(`${allowed} of ${total} AI crawlers can access your site`);
      if (blocked > 0) {
        const blockedNames = botResults
          .filter((b) => !b.allowed)
          .slice(0, 5)
          .map((b) => b.name);
        details.push(
          `Blocked: ${blockedNames.join(", ")}${blocked > 5 ? ` (+${blocked - 5} more)` : ""}`
        );
      }
    }
  }

  // Generate recommendation
  let recommendation: CheckResult["recommendation"];
  if (mode === "block" && score < 100) {
    const stillAllowed = botResults.filter((b) => b.allowed).map((b) => b.userAgent);
    if (!robotsTxtFound) {
      recommendation = {
        text: "Create a robots.txt file to block AI crawlers.",
        snippet: `# Add to your robots.txt\n${stillAllowed.map((ua) => `User-agent: ${ua}\nDisallow: /\n`).join("\n")}`,
        snippetLang: "txt",
      };
    } else if (stillAllowed.length > 0) {
      recommendation = {
        text: `Add these ${stillAllowed.length} bots to your robots.txt to block them.`,
        snippet: `# Add to your robots.txt\n${stillAllowed.map((ua) => `User-agent: ${ua}\nDisallow: /\n`).join("\n")}`,
        snippetLang: "txt",
      };
    }
  } else if (mode === "allow" && score < 100) {
    const blockedBots = botResults.filter((b) => !b.allowed).map((b) => b.userAgent);
    if (blockedBots.length > 0) {
      recommendation = {
        text: `Remove or allow these ${blockedBots.length} bots in your robots.txt.`,
        snippet: `# Allow AI crawlers in robots.txt\n${blockedBots.map((ua) => `User-agent: ${ua}\nAllow: /\n`).join("\n")}`,
        snippetLang: "txt",
      };
    }
  }

  return {
    check: {
      id: "robotsTxt",
      name: "🤖 robots.txt",
      score,
      weight: WEIGHTS[mode].robotsTxt,
      status: statusLabel(score),
      summary: robotsTxtFound
        ? `${blocked}/${total} bots blocked`
        : "No robots.txt found",
      details,
      recommendation,
    },
    botResults,
  };
}

// ─── Check 2: Meta Directives ────────────────────────────────────────

function checkMetaDirectives(
  $: cheerio.CheerioAPI,
  mode: "block" | "allow"
): CheckResult {
  const details: string[] = [];
  const found: string[] = [];

  // Check for robots meta tag
  const robotsMeta = $('meta[name="robots"]').attr("content") || "";
  if (robotsMeta) {
    details.push(`robots meta: "${robotsMeta}"`);
    const directives = robotsMeta.toLowerCase().split(",").map((d) => d.trim());
    if (directives.includes("noindex")) found.push("noindex");
    if (directives.includes("nofollow")) found.push("nofollow");
    if (directives.includes("none")) found.push("none");
    if (directives.includes("nosnippet")) found.push("nosnippet");
    if (directives.includes("noarchive")) found.push("noarchive");
  }

  // Check for AI-specific meta tags
  const noai = $('meta[name="robots"][content*="noai"]').length > 0 ||
    $('meta[name="noai"]').length > 0;
  if (noai) {
    found.push("noai");
    details.push("noai directive found");
  }

  const noimageai = $('meta[name="robots"][content*="noimageai"]').length > 0 ||
    $('meta[name="noimageai"]').length > 0;
  if (noimageai) {
    found.push("noimageai");
    details.push("noimageai directive found");
  }

  // Check for Google-specific AI directives
  const googleNoAi = $('meta[name="googlebot"][content*="noai"]').length > 0 ||
    $('meta[name="google"][content*="nositelinkssearchbox"]').length > 0;
  if (googleNoAi) {
    found.push("google-noai");
    details.push("Google-specific AI directive found");
  }

  if (found.length === 0) {
    details.push("No AI-blocking meta directives found");
  }

  let score: number;
  if (mode === "block") {
    if (found.includes("noai") || found.includes("none")) score = 100;
    else if (found.includes("noindex")) score = 70;
    else if (found.length > 0) score = 50;
    else score = 0;
  } else {
    if (found.length === 0) score = 100;
    else if (found.includes("noai") || found.includes("none") || found.includes("noindex"))
      score = 0;
    else score = 50;
  }

  // Recommendation
  let recommendation: CheckResult["recommendation"];
  if (mode === "block" && score < 70) {
    recommendation = {
      text: "Add meta directives to block AI from indexing this page.",
      snippet: `<!-- Add inside <head> -->\n<meta name="robots" content="noai, noimageai">\n<meta name="robots" content="noindex, nofollow">`,
      snippetLang: "html",
    };
  } else if (mode === "allow" && score < 70) {
    recommendation = {
      text: "Remove AI-blocking meta directives so crawlers can index your content.",
      snippet: `<!-- Ensure your robots meta allows indexing -->\n<meta name="robots" content="index, follow">`,
      snippetLang: "html",
    };
  }

  return {
    id: "metaDirectives",
    name: "🏷️ Meta Directives",
    score,
    weight: WEIGHTS[mode].metaDirectives,
    status: statusLabel(score),
    summary:
      found.length > 0
        ? `Found: ${found.join(", ")}`
        : "No AI-blocking directives",
    details,
    recommendation,
  };
}

// ─── Check 3: HTTP Headers ───────────────────────────────────────────

function checkHttpHeaders(
  headers: Headers,
  mode: "block" | "allow"
): CheckResult {
  const details: string[] = [];
  const findings: string[] = [];

  // X-Robots-Tag
  const xRobotsTag = headers.get("x-robots-tag");
  if (xRobotsTag) {
    details.push(`X-Robots-Tag: "${xRobotsTag}"`);
    const lower = xRobotsTag.toLowerCase();
    if (lower.includes("noindex")) findings.push("noindex");
    if (lower.includes("nofollow")) findings.push("nofollow");
    if (lower.includes("noai")) findings.push("noai");
    if (lower.includes("noimageai")) findings.push("noimageai");
    if (lower.includes("none")) findings.push("none");
  } else {
    details.push("No X-Robots-Tag header");
  }

  // Cache-Control
  const cacheControl = headers.get("cache-control");
  if (cacheControl) {
    details.push(`Cache-Control: "${cacheControl}"`);
    if (cacheControl.includes("no-store") || cacheControl.includes("private")) {
      findings.push("restrictive-cache");
    }
  }

  // Content-Type
  const contentType = headers.get("content-type");
  if (contentType) {
    details.push(`Content-Type: "${contentType}"`);
  }

  // CORS
  const cors = headers.get("access-control-allow-origin");
  if (cors) {
    details.push(`CORS: "${cors}"`);
    if (cors === "*") findings.push("open-cors");
  } else {
    details.push("No CORS header (cross-origin access restricted)");
  }

  let score: number;
  if (mode === "block") {
    if (findings.includes("noai") || findings.includes("none")) score = 100;
    else if (findings.includes("noindex")) score = 80;
    else if (findings.includes("restrictive-cache")) score = 40;
    else score = 0;
  } else {
    const blockers = findings.filter((f) =>
      ["noai", "none", "noindex", "noimageai"].includes(f)
    );
    if (blockers.length > 0) score = 0;
    else score = 100;
  }

  // Recommendation
  let recommendation: CheckResult["recommendation"];
  if (mode === "block" && score < 70) {
    recommendation = {
      text: "Add X-Robots-Tag headers to block AI crawlers at the server level.",
      snippet: `# Nginx\nadd_header X-Robots-Tag "noai, noimageai" always;\n\n# Apache (.htaccess)\nHeader set X-Robots-Tag "noai, noimageai"\n\n# Cloudflare (Transform Rules)\n# Add response header: X-Robots-Tag = noai, noimageai`,
      snippetLang: "bash",
    };
  } else if (mode === "allow" && score < 70) {
    recommendation = {
      text: "Remove X-Robots-Tag headers that block AI crawlers.",
      snippet: `# Check your server config for X-Robots-Tag headers\n# Remove any containing: noai, noimageai, noindex, none`,
      snippetLang: "bash",
    };
  }

  return {
    id: "httpHeaders",
    name: "📡 HTTP Headers",
    score,
    weight: WEIGHTS[mode].httpHeaders,
    status: statusLabel(score),
    summary:
      findings.length > 0
        ? `Found: ${findings.join(", ")}`
        : "No AI-specific headers",
    details,
    recommendation,
  };
}

// ─── Check 4: AI Discovery Files (llms.txt, ai.txt, etc.) ───────────

async function checkAiDiscoveryFiles(
  baseUrl: string,
  mode: "block" | "allow"
): Promise<CheckResult> {
  const details: string[] = [];
  const filesFound: string[] = [];
  const filesChecked: string[] = [];

  // Check each AI discovery file
  const filesToCheck = [
    { path: "/llms.txt", name: "llms.txt", description: "LLM-friendly site description" },
    { path: "/llms-full.txt", name: "llms-full.txt", description: "Full LLM content" },
    { path: "/ai.txt", name: "ai.txt", description: "AI crawler permissions" },
    { path: "/.well-known/ai-plugin.json", name: "ai-plugin.json", description: "OpenAI plugin manifest" },
  ];

  for (const file of filesToCheck) {
    filesChecked.push(file.name);
    try {
      const res = await fetch(`${baseUrl}${file.path}`, {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "BotCheck/1.0 (https://botcheck.app)" },
      });

      if (res.ok) {
        const text = await res.text();
        if (text.length > 10) {
          filesFound.push(file.name);
          details.push(`✓ ${file.name} found (${text.length} bytes) — ${file.description}`);
        } else {
          details.push(`⚠ ${file.name} exists but appears empty`);
        }
      } else {
        details.push(`✗ ${file.name} not found (HTTP ${res.status})`);
      }
    } catch {
      details.push(`✗ ${file.name} not accessible`);
    }
  }

  const foundCount = filesFound.length;
  const totalCount = filesToCheck.length;

  let score: number;
  if (mode === "block") {
    // AI discovery files help AI — having them is bad for blocking
    if (foundCount === 0) score = 100;
    else if (foundCount === 1) score = 60;
    else if (foundCount === 2) score = 30;
    else score = 0;
  } else {
    // AI discovery files help AI find you — having them is good
    if (foundCount >= 3) score = 100;
    else if (foundCount === 2) score = 80;
    else if (foundCount === 1) score = 50;
    else score = 0;
  }

  // Recommendation
  let recommendation: CheckResult["recommendation"];
  if (mode === "block" && foundCount > 0) {
    recommendation = {
      text: `Remove ${filesFound.join(", ")} to reduce AI discoverability.`,
      snippet: `# Delete these files from your server:\n${filesFound.map((f) => `# - ${f}`).join("\n")}`,
      snippetLang: "bash",
    };
  } else if (mode === "allow" && foundCount < 2) {
    recommendation = {
      text: "Add AI discovery files so AI systems can understand your site.",
      snippet: `# Create /llms.txt in your root:\n# BotCheck\n> A tool to check AI crawler access to websites.\n\nThis site provides free AI visibility analysis.\n\n## Docs\n- [Homepage](${baseUrl}): Main scanning tool\n\n# Create /ai.txt in your root:\n# See https://site.spawning.ai/spawning-ai-txt\nUser-Agent: *\nAllowed: Yes`,
      snippetLang: "txt",
    };
  }

  return {
    id: "aiDiscoveryFiles",
    name: "📄 AI Discovery Files",
    score,
    weight: WEIGHTS[mode].aiDiscoveryFiles,
    status: statusLabel(score),
    summary: foundCount > 0
      ? `${foundCount}/${totalCount} files found: ${filesFound.join(", ")}`
      : `No AI discovery files found (checked ${totalCount})`,
    details,
    recommendation,
  };
}

// ─── Check 5: Response Stability ─────────────────────────────────────

function checkResponseStability(
  latencyMs: number,
  httpStatus: number,
  fetchError: string | null,
  mode: "block" | "allow"
): CheckResult {
  const details: string[] = [];

  if (fetchError) {
    details.push(`Fetch error: ${fetchError}`);
    return {
      id: "responseStability",
      name: "⚡ Response Speed",
      score: mode === "block" ? 80 : 0,
      weight: WEIGHTS[mode].responseStability,
      status: mode === "block" ? "pass" : "fail",
      summary: "Site unreachable",
      details,
      recommendation: mode === "allow" ? {
        text: "Your site is unreachable. Crawlers can't access content they can't load.",
        snippet: `# Check your server is running and responding\ncurl -I ${fetchError}`,
        snippetLang: "bash",
      } : undefined,
    };
  }

  details.push(`HTTP status: ${httpStatus}`);
  details.push(`Latency: ${latencyMs}ms`);

  let latencyScore: number;
  if (latencyMs < 500) latencyScore = 100;
  else if (latencyMs < 1500) latencyScore = 80;
  else if (latencyMs < 3000) latencyScore = 50;
  else if (latencyMs < 5000) latencyScore = 30;
  else latencyScore = 10;

  const statusOk = httpStatus >= 200 && httpStatus < 400;

  let score: number;
  if (mode === "block") {
    if (!statusOk) score = 70;
    else score = 100 - latencyScore;
  } else {
    if (!statusOk) score = 20;
    else score = latencyScore;
  }

  let summary: string;
  if (!statusOk) summary = `HTTP ${httpStatus} — non-success response`;
  else if (latencyMs < 500) summary = `Fast response (${latencyMs}ms)`;
  else if (latencyMs < 2000) summary = `Moderate response (${latencyMs}ms)`;
  else summary = `Slow response (${latencyMs}ms)`;

  // Recommendation
  let recommendation: CheckResult["recommendation"];
  if (mode === "allow" && latencyMs > 2000) {
    recommendation = {
      text: "Slow pages cause crawlers to time out or skip your content. Improve server response time.",
    };
  }

  return {
    id: "responseStability",
    name: "⚡ Response Speed",
    score,
    weight: WEIGHTS[mode].responseStability,
    status: statusLabel(score),
    summary,
    details,
    recommendation,
  };
}

// ─── Check 6: Paywall Detection ─────────────────────────────────────

function checkPaywall(
  $: cheerio.CheerioAPI,
  httpStatus: number,
  finalUrl: string,
  originalUrl: string,
  mode: "block" | "allow"
): CheckResult {
  const details: string[] = [];
  const signals: string[] = [];

  // Check HTTP status
  if (httpStatus === 401 || httpStatus === 403) {
    signals.push("auth-required");
    details.push(`HTTP ${httpStatus} — authentication required`);
  }

  // Check for redirect to login page
  if (finalUrl !== originalUrl) {
    const finalLower = finalUrl.toLowerCase();
    if (
      finalLower.includes("login") ||
      finalLower.includes("signin") ||
      finalLower.includes("auth") ||
      finalLower.includes("subscribe") ||
      finalLower.includes("register")
    ) {
      signals.push("login-redirect");
      details.push(`Redirected to login/auth page: ${finalUrl}`);
    }
  }

  // Check page content for paywall indicators
  const bodyText = $.text().toLowerCase();
  const paywallKeywords = [
    "subscribe to continue",
    "sign in to read",
    "create an account",
    "members only",
    "premium content",
    "paywall",
    "subscription required",
    "log in to view",
  ];

  for (const keyword of paywallKeywords) {
    if (bodyText.includes(keyword)) {
      signals.push("paywall-text");
      details.push(`Paywall indicator found: "${keyword}"`);
      break;
    }
  }

  // Check for paywall schema
  const paywallSchema = $('[itemtype*="CreativeWork"]').find(
    '[itemprop="isAccessibleForFree"]'
  );
  if (paywallSchema.length > 0) {
    const value = paywallSchema.attr("content");
    if (value === "false" || value === "False") {
      signals.push("schema-paywall");
      details.push("Schema.org indicates content is not free");
    }
  }

  // Check for JSON-LD paywall signals
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text());
      if (json.isAccessibleForFree === false || json.isAccessibleForFree === "False") {
        signals.push("jsonld-paywall");
        details.push("JSON-LD indicates content is not free");
      }
    } catch {
      // ignore invalid JSON-LD
    }
  });

  if (signals.length === 0) {
    details.push("No paywall or login wall detected");
  }

  let score: number;
  if (mode === "block") {
    if (signals.includes("auth-required")) score = 100;
    else if (signals.length >= 2) score = 80;
    else if (signals.length === 1) score = 60;
    else score = 0;
  } else {
    if (signals.includes("auth-required")) score = 0;
    else if (signals.length >= 2) score = 20;
    else if (signals.length === 1) score = 50;
    else score = 100;
  }

  // Recommendation
  let recommendation: CheckResult["recommendation"];
  if (mode === "allow" && signals.length > 0) {
    recommendation = {
      text: "Paywalls and login walls prevent AI crawlers from accessing your content. Consider making key pages publicly accessible.",
    };
  } else if (mode === "block" && signals.length === 0) {
    recommendation = {
      text: "Your content is publicly accessible. Add authentication or use schema markup to signal restricted access.",
      snippet: `<!-- Add to JSON-LD to signal paywall -->\n<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "isAccessibleForFree": false\n}\n</script>`,
      snippetLang: "html",
    };
  }

  return {
    id: "paywallDetection",
    name: "🚪 Access Control",
    score,
    weight: WEIGHTS[mode].paywallDetection,
    status: statusLabel(score),
    summary:
      signals.length > 0
        ? `${signals.length} paywall signal${signals.length > 1 ? "s" : ""} detected`
        : "No paywall detected",
    details,
    recommendation,
  };
}

// ─── Check 7: Content Structure ──────────────────────────────────────

function checkContentStructure(
  $: cheerio.CheerioAPI,
  mode: "block" | "allow"
): CheckResult {
  const details: string[] = [];
  const maxPoints = 7;
  let points = 0;

  // 1. Has <article> or <main> tag
  const hasArticle = $("article").length > 0;
  const hasMain = $("main").length > 0;
  if (hasArticle || hasMain) {
    points++;
    details.push(`✓ Semantic containers: ${hasArticle ? "<article>" : ""} ${hasMain ? "<main>" : ""}`.trim());
  } else {
    details.push("✗ No <article> or <main> tags found");
  }

  // 2. Has proper heading hierarchy
  const h1Count = $("h1").length;
  const h2Count = $("h2").length;
  if (h1Count === 1 && h2Count > 0) {
    points++;
    details.push(`✓ Good heading structure: 1 <h1>, ${h2Count} <h2>`);
  } else if (h1Count >= 1) {
    points += 0.5;
    details.push(`⚠ ${h1Count} <h1> tag${h1Count > 1 ? "s" : ""}, ${h2Count} <h2> tags`);
  } else {
    details.push("✗ No <h1> tag found");
  }

  // 3. Has structured data (JSON-LD or microdata)
  const jsonLd = $('script[type="application/ld+json"]').length;
  const microdata = $("[itemscope]").length;
  if (jsonLd > 0 || microdata > 0) {
    points++;
    details.push(
      `✓ Structured data: ${jsonLd > 0 ? `${jsonLd} JSON-LD block${jsonLd > 1 ? "s" : ""}` : ""} ${microdata > 0 ? `${microdata} microdata element${microdata > 1 ? "s" : ""}` : ""}`.trim()
    );
  } else {
    details.push("✗ No structured data (JSON-LD or microdata)");
  }

  // 4. Has meta description
  const metaDesc = $('meta[name="description"]').attr("content");
  if (metaDesc && metaDesc.length > 20) {
    points++;
    details.push("✓ Meta description present");
  } else {
    details.push("✗ No meta description or too short");
  }

  // 5. Has Open Graph tags
  const ogTitle = $('meta[property="og:title"]').length > 0;
  const ogDesc = $('meta[property="og:description"]').length > 0;
  if (ogTitle && ogDesc) {
    points++;
    details.push("✓ Open Graph tags present");
  } else {
    details.push("✗ Missing Open Graph tags");
  }

  // 6. Has proper lang attribute
  const lang = $("html").attr("lang");
  if (lang) {
    points++;
    details.push(`✓ Language declared: ${lang}`);
  } else {
    details.push("✗ No lang attribute on <html>");
  }

  // 7. Has nav and footer (good page structure)
  const hasNav = $("nav").length > 0;
  const hasFooter = $("footer").length > 0;
  if (hasNav && hasFooter) {
    points++;
    details.push("✓ Good page structure (<nav> and <footer> present)");
  } else {
    details.push(
      `⚠ Page structure: ${hasNav ? "<nav> found" : "no <nav>"}, ${hasFooter ? "<footer> found" : "no <footer>"}`
    );
  }

  const qualityScore = Math.round((points / maxPoints) * 100);

  let score: number;
  if (mode === "block") {
    score = 100 - qualityScore;
  } else {
    score = qualityScore;
  }

  // Recommendation
  let recommendation: CheckResult["recommendation"];
  const missing: string[] = [];
  if (!hasArticle && !hasMain) missing.push("<main> or <article> wrapper");
  if (h1Count !== 1) missing.push("single <h1> tag");
  if (jsonLd === 0 && microdata === 0) missing.push("structured data (JSON-LD)");
  if (!metaDesc || metaDesc.length <= 20) missing.push("meta description");
  if (!ogTitle || !ogDesc) missing.push("Open Graph tags");

  if (mode === "allow" && missing.length > 0) {
    recommendation = {
      text: `Add ${missing.slice(0, 3).join(", ")} to improve AI readability.`,
      snippet: `<!-- Example structured data -->\n<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Your Page Title",\n  "description": "Your page description"\n}\n</script>\n\n<!-- Meta description -->\n<meta name="description" content="Your page description here">\n\n<!-- Open Graph -->\n<meta property="og:title" content="Your Page Title">\n<meta property="og:description" content="Your page description">`,
      snippetLang: "html",
    };
  }

  return {
    id: "contentStructure",
    name: "🏗️ Page Structure",
    score,
    weight: WEIGHTS[mode].contentStructure,
    status: statusLabel(score),
    summary: `${Math.round(points)}/${maxPoints} quality signals`,
    details,
    recommendation,
  };
}

// ─── Generate Insights ──────────────────────────────────────────────

function generateInsights(
  checks: CheckResult[],
  botResults: BotResult[],
  mode: "block" | "allow",
  finalScore: number
): Insight[] {
  const insights: Insight[] = [];

  if (mode === "allow") {
    // Good news
    const robotsCheck = checks.find((c) => c.id === "robotsTxt");
    const allowedCount = botResults.filter((b) => b.allowed).length;
    const totalCount = botResults.length;

    if (finalScore >= 80) {
      insights.push({ type: "good", text: `Your site is well-configured for AI visibility. ${allowedCount}/${totalCount} crawlers can reach your content.` });
    } else if (allowedCount > totalCount * 0.5) {
      insights.push({ type: "good", text: `Most AI crawlers (${allowedCount}/${totalCount}) can access your content.` });
    }

    // Warnings
    const blockedBots = botResults.filter((b) => !b.allowed);
    const majorBlockedBots = blockedBots.filter((b) =>
      ["GPTBot", "ClaudeBot", "Google-Extended", "PerplexityBot"].includes(b.name)
    );
    if (majorBlockedBots.length > 0) {
      insights.push({ type: "warning", text: `Major AI crawlers blocked: ${majorBlockedBots.map((b) => b.name).join(", ")}. These are high-traffic AI systems.` });
    }

    // Tips
    const aiFiles = checks.find((c) => c.id === "aiDiscoveryFiles");
    if (aiFiles && aiFiles.score < 50) {
      insights.push({ type: "tip", text: "Add an llms.txt file to help AI systems understand your site's content and structure." });
    }

    const structure = checks.find((c) => c.id === "contentStructure");
    if (structure && structure.score < 50) {
      insights.push({ type: "tip", text: "Improve your HTML structure (headings, meta tags, structured data) so AI can better parse your content." });
    }

    if (robotsCheck && robotsCheck.score === 100 && finalScore < 80) {
      insights.push({ type: "tip", text: "robots.txt looks good, but other factors are limiting visibility. Check the details below." });
    }
  } else {
    // Block mode
    const blockedCount = botResults.filter((b) => !b.allowed).length;
    const totalCount = botResults.length;

    if (finalScore >= 80) {
      insights.push({ type: "good", text: `Strong protection. ${blockedCount}/${totalCount} AI crawlers are blocked.` });
    }

    const allowedBots = botResults.filter((b) => b.allowed);
    const majorAllowedBots = allowedBots.filter((b) =>
      ["GPTBot", "ClaudeBot", "Google-Extended", "PerplexityBot", "CCBot"].includes(b.name)
    );
    if (majorAllowedBots.length > 0) {
      insights.push({ type: "warning", text: `Still exposed: ${majorAllowedBots.map((b) => b.name).join(", ")} can access your content.` });
    }

    if (finalScore < 50) {
      insights.push({ type: "tip", text: "Your content is largely unprotected. Start with robots.txt — it's the most impactful and easiest fix." });
    }

    const meta = checks.find((c) => c.id === "metaDirectives");
    if (meta && meta.score < 50) {
      insights.push({ type: "tip", text: "Add noai and noimageai meta tags for an extra layer of protection beyond robots.txt." });
    }
  }

  return insights.slice(0, 4); // Max 4 insights
}

// ─── Main Handler ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, mode } = body as { url: string; mode: "block" | "allow" };

    if (!url || !mode) {
      return NextResponse.json(
        { error: "Missing required fields: url, mode" },
        { status: 400 }
      );
    }

    if (mode !== "block" && mode !== "allow") {
      return NextResponse.json(
        { error: 'Mode must be "block" or "allow"' },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeUrl(url);
    const baseUrl = getBaseUrl(normalizedUrl);
    const robotsTxtUrl = `${baseUrl}/robots.txt`;
    const bots = loadBots();

    // ── Fetch robots.txt ──
    let robotsTxtContent = "";
    let robotsTxtFound = false;

    try {
      const res = await fetch(robotsTxtUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "BotCheck/1.0 (https://botcheck.app)" },
      });
      if (res.ok) {
        robotsTxtContent = await res.text();
        robotsTxtFound = true;
      }
    } catch {
      // not accessible
    }

    // ── Fetch the actual page ──
    let pageHtml = "";
    let pageHeaders: Headers = new Headers();
    let pageStatus = 0;
    let pageLatency = 0;
    let pageFetchError: string | null = null;
    let pageFinalUrl = normalizedUrl;

    try {
      const start = Date.now();
      const res = await fetch(normalizedUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "BotCheck/1.0 (https://botcheck.app)" },
        redirect: "follow",
      });
      pageLatency = Date.now() - start;
      pageStatus = res.status;
      pageHeaders = res.headers;
      pageFinalUrl = res.url;

      // Limit how much HTML we read (1MB max)
      const reader = res.body?.getReader();
      if (reader) {
        const chunks: Uint8Array[] = [];
        let totalSize = 0;
        const maxSize = 1024 * 1024;

        while (totalSize < maxSize) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          totalSize += value.length;
        }
        reader.cancel();

        const decoder = new TextDecoder();
        pageHtml = chunks.map((c) => decoder.decode(c, { stream: true })).join("");
      }
    } catch (err) {
      pageFetchError =
        err instanceof Error ? err.message : "Failed to fetch page";
    }

    const $ = cheerio.load(pageHtml);

    // ── Run all 7 checks ──
    const { check: robotsCheck, botResults } = checkRobotsTxt(
      robotsTxtContent,
      robotsTxtFound,
      normalizedUrl,
      robotsTxtUrl,
      bots,
      mode
    );

    const metaCheck = checkMetaDirectives($, mode);
    const headersCheck = checkHttpHeaders(pageHeaders, mode);
    const aiFilesCheck = await checkAiDiscoveryFiles(baseUrl, mode);
    const stabilityCheck = checkResponseStability(
      pageLatency,
      pageStatus,
      pageFetchError,
      mode
    );
    const paywallCheck = checkPaywall(
      $,
      pageStatus,
      pageFinalUrl,
      normalizedUrl,
      mode
    );
    const structureCheck = checkContentStructure($, mode);

    const checks: CheckResult[] = [
      robotsCheck,
      metaCheck,
      headersCheck,
      aiFilesCheck,
      stabilityCheck,
      paywallCheck,
      structureCheck,
    ];

    // ── Calculate weighted score ──
    const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
    const weightedScore = checks.reduce(
      (sum, c) => sum + (c.score * c.weight) / totalWeight,
      0
    );
    const finalScore = Math.round(weightedScore);

    // ── Generate insights ──
    const insights = generateInsights(checks, botResults, mode, finalScore);

    // ── Generate summary ──
    const passCount = checks.filter((c) => c.status === "pass").length;
    const failCount = checks.filter((c) => c.status === "fail").length;

    let summary: string;
    if (mode === "block") {
      if (finalScore >= 80)
        summary = `Strong AI protection. ${passCount} of ${checks.length} checks indicate effective blocking.`;
      else if (finalScore >= 50)
        summary = `Moderate protection. Some AI crawlers may still access your content. ${failCount} check${failCount !== 1 ? "s" : ""} need attention.`;
      else
        summary = `Weak AI protection. Most crawlers can freely access your content. ${failCount} of ${checks.length} checks are failing.`;
    } else {
      if (finalScore >= 80)
        summary = `Excellent AI visibility. ${passCount} of ${checks.length} checks confirm your content is accessible to AI systems.`;
      else if (finalScore >= 50)
        summary = `Moderate visibility. Some issues may prevent AI from fully accessing your content. ${failCount} check${failCount !== 1 ? "s" : ""} need attention.`;
      else
        summary = `Poor AI visibility. Your site is largely invisible to AI systems. ${failCount} of ${checks.length} checks are failing.`;
    }

    const result: ScanResult = {
      url: normalizedUrl,
      mode,
      score: finalScore,
      checks,
      robotsTxtFound,
      robotsTxtUrl,
      bots: botResults,
      summary,
      scannedAt: new Date().toISOString(),
      insights,
    };

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
