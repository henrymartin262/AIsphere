"use client";

export interface AgentExperience {
  id: string;
  agentId: number;
  type: string;
  category: string;
  content: string;
  context: string;
  outcome: "success" | "failure" | "neutral";
  importance: number;
  learnings: string[];
  timestamp: number;
}

interface SoulTimelineProps {
  experiences: AgentExperience[];
  loading?: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  inference:   "🔮",
  bounty:      "🏆",
  interaction: "🤝",
  knowledge:   "📚",
  error:       "⚠️",
  trade:       "💱",
};

function typeIcon(type: string): string {
  return TYPE_ICONS[type.toLowerCase()] ?? "✦";
}

function OutcomeBadge({ outcome }: { outcome: "success" | "failure" | "neutral" }) {
  const styles: Record<string, string> = {
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    failure: "bg-red-500/10 text-red-400 border border-red-500/20",
    neutral: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[outcome]}`}>
      {outcome}
    </span>
  );
}

function ImportanceBar({ importance }: { importance: number }) {
  const pct = Math.min(100, Math.max(0, importance * 100));
  const color =
    importance >= 0.7
      ? "bg-cyan-400"
      : importance >= 0.4
      ? "bg-indigo-400"
      : "bg-slate-500";
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="h-1 w-20 rounded-full bg-slate-700/50 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-slate-500">{(importance * 100).toFixed(0)}%</span>
    </div>
  );
}

function SkeletonItem() {
  return (
    <div className="flex gap-4 animate-pulse">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 rounded-full bg-slate-800" />
        <div className="w-px flex-1 bg-slate-800 mt-1" />
      </div>
      <div className="flex-1 pb-6 space-y-2">
        <div className="h-3 w-1/3 rounded bg-slate-800" />
        <div className="h-3 w-2/3 rounded bg-slate-800/70" />
        <div className="h-1.5 w-20 rounded bg-slate-800/50 mt-2" />
      </div>
    </div>
  );
}

export function SoulTimeline({ experiences, loading = false }: SoulTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-0">
        {[1, 2, 3].map((n) => <SkeletonItem key={n} />)}
      </div>
    );
  }

  if (experiences.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-4xl opacity-40">🧬</span>
        <p className="text-sm text-slate-500">No experiences recorded yet</p>
        <p className="text-xs text-slate-600">Experiences accumulate as the agent interacts with the world.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {experiences.map((exp, idx) => {
        const isLast = idx === experiences.length - 1;
        return (
          <div key={exp.id} className="flex gap-4">
            {/* Left: icon + connector line */}
            <div className="flex flex-col items-center shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-base shadow-sm z-10">
                {typeIcon(exp.type)}
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-gradient-to-b from-slate-700 to-slate-800 mt-1" />
              )}
            </div>

            {/* Right: content */}
            <div className={`flex-1 min-w-0 ${isLast ? "pb-2" : "pb-5"}`}>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-200 capitalize">{exp.category}</span>
                <OutcomeBadge outcome={exp.outcome} />
                <span className="ml-auto text-[10px] text-slate-600 shrink-0">
                  {new Date(exp.timestamp * 1000).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {exp.content && (
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{exp.content}</p>
              )}

              <ImportanceBar importance={exp.importance} />

              {exp.learnings && exp.learnings.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {exp.learnings.slice(0, 2).map((l, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[9px] text-indigo-400 truncate max-w-[180px]"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
