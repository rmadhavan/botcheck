"use client";

interface ScoreRingProps {
  score: number;
  mode: "block" | "allow";
}

export default function ScoreRing({ score, mode }: ScoreRingProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const strokeColor =
    score >= 70
      ? "var(--accent-sage)"
      : score >= 40
        ? "var(--accent-warm)"
        : "var(--accent-red)";

  const label = mode === "block" ? "Protection" : "Visibility";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--border-light)"
            strokeWidth="6"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              stroke: strokeColor,
              transition: "stroke-dashoffset 1s ease-out, stroke 0.3s ease-out",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-bold"
            style={{ color: strokeColor }}
          >
            {score}
          </span>
          <span className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            out of 100
          </span>
        </div>
      </div>
      <span
        className="text-xs font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {label} Score
      </span>
    </div>
  );
}
