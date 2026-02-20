import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAvailableLearnedSkills,
  getSkillLearningHistory,
  type LearnedSkillEntry,
  type SkillHistoryProvider,
  type SkillLearningHistoryEntry,
} from "../api";
import { type Agent, type AgentRole } from "../types";
import AgentAvatar from "./AgentAvatar";

const PROVIDER_ORDER: SkillHistoryProvider[] = [
  "claude",
  "codex",
  "gemini",
  "opencode",
  "copilot",
  "antigravity",
  "api",
];

const ROLE_ORDER: Record<AgentRole, number> = {
  team_leader: 0,
  senior: 1,
  junior: 2,
  intern: 3,
};

function providerLabel(provider: SkillHistoryProvider): string {
  if (provider === "claude") return "Claude Code";
  if (provider === "codex") return "Codex";
  if (provider === "gemini") return "Gemini";
  if (provider === "opencode") return "OpenCode";
  if (provider === "copilot") return "GitHub Copilot";
  if (provider === "antigravity") return "Antigravity";
  return "API Provider";
}

function statusLabel(status: SkillLearningHistoryEntry["status"]): string {
  if (status === "queued") return "Queued";
  if (status === "running") return "Running";
  if (status === "succeeded") return "Succeeded";
  return "Failed";
}

function statusClass(status: SkillLearningHistoryEntry["status"]): string {
  if (status === "succeeded") return "border-emerald-400/40 bg-emerald-500/10 text-emerald-300";
  if (status === "running") return "border-amber-400/40 bg-amber-500/10 text-amber-200";
  if (status === "queued") return "border-slate-500/40 bg-slate-600/10 text-slate-300";
  return "border-rose-400/40 bg-rose-500/10 text-rose-300";
}

function relativeTime(timestamp: number | null | undefined): string {
  if (!timestamp || !Number.isFinite(timestamp)) return "-";
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}y ago`;
}

function normalizeSkillLabel(row: { repo: string; skill_id: string; skill_label: string }): string {
  if (row.skill_label && row.skill_label.trim()) return row.skill_label;
  if (row.skill_id && row.skill_id.trim()) return `${row.repo}#${row.skill_id}`;
  return row.repo;
}

function pickRepresentativeForProvider(agents: Agent[], provider: SkillHistoryProvider): Agent | null {
  const candidates = agents.filter((agent) => agent.cli_provider === provider);
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => {
    const roleGap = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
    if (roleGap !== 0) return roleGap;
    if (b.stats_xp !== a.stats_xp) return b.stats_xp - a.stats_xp;
    return a.id.localeCompare(b.id);
  });
  return sorted[0];
}

interface SkillHistoryPanelProps {
  agents: Agent[];
  refreshToken?: number;
  className?: string;
}

export default function SkillHistoryPanel({
  agents,
  refreshToken = 0,
  className = "",
}: SkillHistoryPanelProps) {
  const [tab, setTab] = useState<"history" | "available">("history");
  const [providerFilter, setProviderFilter] = useState<"all" | SkillHistoryProvider>("all");
  const [historyRows, setHistoryRows] = useState<SkillLearningHistoryEntry[]>([]);
  const [availableRows, setAvailableRows] = useState<LearnedSkillEntry[]>([]);
  const [retentionDays, setRetentionDays] = useState<number>(180);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const representatives = useMemo(() => {
    const out = new Map<SkillHistoryProvider, Agent | null>();
    for (const provider of PROVIDER_ORDER) {
      out.set(provider, pickRepresentativeForProvider(agents, provider));
    }
    return out;
  }, [agents]);

  const activeProviders = useMemo(() => {
    const fromRows = new Set<SkillHistoryProvider>();
    for (const row of historyRows) fromRows.add(row.provider);
    for (const row of availableRows) fromRows.add(row.provider);
    for (const provider of PROVIDER_ORDER) {
      if (representatives.get(provider)) {
        fromRows.add(provider);
      }
    }
    return PROVIDER_ORDER.filter((provider) => fromRows.has(provider));
  }, [availableRows, historyRows, representatives]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = providerFilter === "all" ? undefined : providerFilter;
      const [historyData, availableData] = await Promise.all([
        getSkillLearningHistory({ provider, limit: 80 }),
        getAvailableLearnedSkills({ provider, limit: 30 }),
      ]);
      setHistoryRows(historyData.history);
      setAvailableRows(availableData);
      if (historyData.retentionDays > 0) {
        setRetentionDays(historyData.retentionDays);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [providerFilter]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void load();
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <div className={`flex h-full min-h-[360px] flex-col rounded-xl border border-slate-700/60 bg-slate-900/60 ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 px-3 py-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
              tab === "history"
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
            }`}
          >
            Learning History
          </button>
          <button
            type="button"
            onClick={() => setTab("available")}
            className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
              tab === "available"
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
            }`}
          >
            Available Skills
          </button>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md border border-slate-600 px-2 py-1 text-[11px] text-slate-300 transition-all hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto px-3 py-2">
        <button
          type="button"
          onClick={() => setProviderFilter("all")}
          className={`rounded-md border px-2 py-1 text-[10px] transition-all ${
            providerFilter === "all"
              ? "border-blue-500/50 bg-blue-600/20 text-blue-300"
              : "border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
          }`}
        >
          All
        </button>
        {activeProviders.map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() => setProviderFilter(provider)}
            className={`rounded-md border px-2 py-1 text-[10px] transition-all ${
              providerFilter === provider
                ? "border-blue-500/50 bg-blue-600/20 text-blue-300"
                : "border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
            }`}
          >
            {providerLabel(provider)}
          </button>
        ))}
      </div>

      <div className="px-3 pb-2 text-[10px] text-slate-500">
        Retention: {retentionDays} days
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {loading && historyRows.length === 0 && availableRows.length === 0 && (
          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-6 text-center text-xs text-slate-400">
            Loading memory records...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
            {error}
          </div>
        )}

        {tab === "history" && historyRows.length === 0 && !loading && !error && (
          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-6 text-center text-xs text-slate-400">
            No learning history yet.
          </div>
        )}

        {tab === "history" && historyRows.map((row) => {
          const agent = representatives.get(row.provider) ?? null;
          const label = normalizeSkillLabel(row);
          const eventAt = row.run_completed_at ?? row.updated_at ?? row.created_at;
          return (
            <div key={row.id} className="rounded-lg border border-slate-700/70 bg-slate-800/50 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-slate-100">{label}</div>
                  <div className="mt-0.5 truncate text-[10px] text-slate-500">{row.repo}</div>
                </div>
                <span className={`rounded-full border px-1.5 py-0.5 text-[10px] ${statusClass(row.status)}`}>
                  {statusLabel(row.status)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="h-5 w-5 overflow-hidden rounded-md bg-slate-800/80">
                    <AgentAvatar agent={agent ?? undefined} agents={agents} size={20} rounded="xl" />
                  </div>
                  <span className="truncate">
                    {providerLabel(row.provider)}{agent ? ` · ${agent.name}` : ""}
                  </span>
                </div>
                <span className="shrink-0 text-slate-500">{relativeTime(eventAt)}</span>
              </div>
              {row.error && (
                <div className="mt-1 break-words text-[10px] text-rose-300">{row.error}</div>
              )}
            </div>
          );
        })}

        {tab === "available" && availableRows.length === 0 && !loading && !error && (
          <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-6 text-center text-xs text-slate-400">
            No available skills.
          </div>
        )}

        {tab === "available" && availableRows.map((row) => {
          const agent = representatives.get(row.provider) ?? null;
          const label = normalizeSkillLabel(row);
          return (
            <div key={`${row.provider}-${row.repo}-${row.skill_id}`} className="rounded-lg border border-slate-700/70 bg-slate-800/50 p-2.5">
              <div className="truncate text-xs font-semibold text-slate-100">{label}</div>
              <div className="mt-0.5 truncate text-[10px] text-slate-500">{row.repo}</div>
              <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="h-5 w-5 overflow-hidden rounded-md bg-slate-800/80">
                    <AgentAvatar agent={agent ?? undefined} agents={agents} size={20} rounded="xl" />
                  </div>
                  <span className="truncate">
                    {providerLabel(row.provider)}{agent ? ` · ${agent.name}` : ""}
                  </span>
                </div>
                <span className="shrink-0 text-slate-500">{relativeTime(row.learned_at)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
