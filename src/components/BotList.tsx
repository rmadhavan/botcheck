"use client";

interface BotResult {
  name: string;
  userAgent: string;
  operator: string;
  purpose: string;
  respectsRobots: boolean | string;
  allowed: boolean;
}

interface BotListProps {
  bots: BotResult[];
  mode: "block" | "allow";
}

export default function BotList({ bots, mode }: BotListProps) {
  // Sort: problematic bots first (allowed in block mode, blocked in allow mode)
  const sorted = [...bots].sort((a, b) => {
    const aProblematic = mode === "block" ? a.allowed : !a.allowed;
    const bProblematic = mode === "block" ? b.allowed : !b.allowed;
    if (aProblematic && !bProblematic) return -1;
    if (!aProblematic && bProblematic) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="w-full">
      <h3
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        Bot-by-Bot Results
      </h3>
      <div className="grid gap-3">
        {sorted.map((bot) => {
          const isGood = mode === "block" ? !bot.allowed : bot.allowed;
          return (
            <div
              key={bot.userAgent}
              className="rounded-xl border flex items-center justify-between p-4 shadow-minimal transition-all hover:shadow-md"
              style={{
                backgroundColor: isGood ? "var(--bg-secondary)" : "var(--accent-warm-light)",
                borderColor: isGood ? "var(--border-light)" : "var(--accent-warm)",
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {bot.name}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {bot.operator}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  {bot.purpose}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                {bot.allowed ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: "var(--accent-sage-light)",
                      border: "1px solid var(--accent-sage)",
                      color: "var(--accent-sage)",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent-sage)" }} />
                    Allowed
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: "var(--accent-red-light)",
                      border: "1px solid var(--accent-red)",
                      color: "var(--accent-red)",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent-red)" }} />
                    Blocked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
