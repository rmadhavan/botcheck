"use client";

import { useState } from "react";

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

interface CheckCardProps {
  check: CheckResult;
  mode: "block" | "allow";
}

const statusConfig = {
  pass: {
    bgColor: "var(--accent-sage-light)",
    borderColor: "var(--accent-sage)",
    badgeColor: "var(--accent-sage)",
    dotColor: "var(--accent-sage)",
    label: "Pass",
  },
  warn: {
    bgColor: "var(--accent-warm-light)",
    borderColor: "var(--accent-warm)",
    badgeColor: "var(--accent-warm)",
    dotColor: "var(--accent-warm)",
    label: "Warning",
  },
  fail: {
    bgColor: "var(--accent-red-light)",
    borderColor: "var(--accent-red)",
    badgeColor: "var(--accent-red)",
    dotColor: "var(--accent-red)",
    label: "Fail",
  },
};

export default function CheckCard({ check }: CheckCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [snippetCopied, setSnippetCopied] = useState(false);
  const config = statusConfig[check.status];

  async function copySnippet() {
    if (!check.recommendation?.snippet) return;
    try {
      await navigator.clipboard.writeText(check.recommendation.snippet);
      setSnippetCopied(true);
      setTimeout(() => setSnippetCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div
      className="rounded-xl border transition-all shadow-minimal"
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {check.name}
              </span>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {check.weight}% weight
              </span>
            </div>
            <span className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {check.summary}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-3 shrink-0">
          <span className="text-lg font-bold" style={{ color: config.badgeColor }}>
            {check.score}
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
            style={{
              backgroundColor: config.bgColor,
              border: `1px solid ${config.badgeColor}`,
              color: config.badgeColor,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: config.dotColor }}
            />
            {config.label}
          </span>
          <svg
            className="w-4 h-4 transition-transform hidden sm:block"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{
              color: "var(--text-secondary)",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {expanded && (
        <div
          className="px-4 pb-4 pt-0 border-t"
          style={{ borderColor: config.borderColor }}
        >
          <ul className="mt-3 space-y-1.5">
            {check.details.map((detail, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--text-tertiary)" }} className="mt-0.5 shrink-0">
                  &#8227;
                </span>
                <span className="break-all">{detail}</span>
              </li>
            ))}
          </ul>

          {/* Recommendation */}
          {check.recommendation && (
            <div
              className="mt-4 p-3 rounded-lg border"
              style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-light)" }}
            >
              <div className="flex items-start gap-2 mb-2">
                <span className="text-sm" style={{ color: "var(--accent-sage)", marginTop: "1px" }}>
                  💡
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {check.recommendation.text}
                </span>
              </div>
              {check.recommendation.snippet && (
                <div className="relative mt-2">
                  <pre
                    className="text-xs p-3 rounded-md overflow-x-auto"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-light)",
                      maxHeight: "200px",
                    }}
                  >
                    <code>{check.recommendation.snippet}</code>
                  </pre>
                  <button
                    onClick={(e) => { e.stopPropagation(); copySnippet(); }}
                    className="absolute top-2 right-2 px-2 py-1 text-xs font-medium transition-all rounded"
                    style={{
                      backgroundColor: snippetCopied ? "var(--accent-sage)" : "var(--bg-primary)",
                      border: `1px solid ${snippetCopied ? "var(--accent-sage)" : "var(--border-medium)"}`,
                      color: snippetCopied ? "white" : "var(--text-secondary)",
                    }}
                  >
                    {snippetCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
