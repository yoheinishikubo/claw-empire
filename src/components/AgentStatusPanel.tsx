import { useEffect, useState, useCallback } from 'react';
import type { Agent } from '../types';
import type { ActiveAgentInfo } from '../api';
import type { UiLanguage } from '../i18n';
import { pickLang } from '../i18n';
import { getActiveAgents, stopTask } from '../api';
import AgentAvatar from './AgentAvatar';

interface AgentStatusPanelProps {
  agents: Agent[];
  uiLanguage: UiLanguage;
  onClose: () => void;
}

function fmtElapsed(seconds: number | null): string {
  if (seconds === null || seconds < 0) return '-';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function fmtTime(ts: number | null | undefined): string {
  if (!ts) return '-';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function AgentStatusPanel({ agents, uiLanguage, onClose }: AgentStatusPanelProps) {
  const t = (text: { ko: string; en: string; ja?: string; zh?: string }) => pickLang(uiLanguage, text);
  const [activeAgents, setActiveAgents] = useState<ActiveAgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [killing, setKilling] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => {
    getActiveAgents()
      .then(setActiveAgents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleKill = async (taskId: string) => {
    if (!taskId || killing.has(taskId)) return;
    setKilling((prev) => new Set(prev).add(taskId));
    try {
      await stopTask(taskId);
      // 잠시 후 새로고침
      setTimeout(refresh, 1000);
    } catch (e) {
      console.error('Failed to stop task:', e);
    } finally {
      setKilling((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-lg rounded-2xl border border-blue-500/30 bg-slate-900 shadow-2xl shadow-blue-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#x1F6E0;</span>
            <h2 className="text-lg font-bold text-white">
              {t({ ko: '활성 에이전트', en: 'Active Agents', ja: 'アクティブエージェント', zh: '活跃代理' })}
            </h2>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              {activeAgents.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); refresh(); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title={t({ ko: '새로고침', en: 'Refresh', ja: 'リフレッシュ', zh: '刷新' })}
            >
              &#x21BB;
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              &#x2715;
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-slate-500">
                {t({ ko: '불러오는 중...', en: 'Loading...', ja: '読み込み中...', zh: '加载中...' })}
              </div>
            </div>
          ) : activeAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="mb-2 text-3xl opacity-40">&#x1F634;</span>
              <p className="text-sm text-slate-500">
                {t({ ko: '현재 작업 중인 에이전트가 없습니다', en: 'No agents currently working', ja: '現在作業中のエージェントなし', zh: '当前没有工作中的代理' })}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {activeAgents.map((ag) => {
                const fullAgent = agents.find((a) => a.id === ag.id);
                const agentName = uiLanguage === 'ko' ? (ag.name_ko || ag.name) : ag.name;
                const deptName = uiLanguage === 'ko' ? (ag.dept_name_ko || ag.dept_name) : ag.dept_name;
                const isKilling = ag.task_id ? killing.has(ag.task_id) : false;
                const idleText = ag.idle_seconds !== null ? fmtElapsed(ag.idle_seconds) : '-';
                const isIdle = ag.idle_seconds !== null && ag.idle_seconds > 300; // 5분 이상 idle

                return (
                  <div key={ag.id} className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <AgentAvatar agent={fullAgent} agents={agents} size={40} rounded="xl" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{agentName}</span>
                          <span className="rounded bg-slate-700/80 px-1.5 py-0.5 text-[10px] text-slate-400">{deptName}</span>
                          <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] text-slate-500">{ag.cli_provider}</span>
                        </div>
                        {ag.task_title && (
                          <p className="mt-0.5 truncate text-xs text-slate-400">{ag.task_title}</p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          {ag.has_active_process ? (
                            <span className="flex items-center gap-1">
                              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                              {t({ ko: '프로세스 활성', en: 'Process active', ja: 'プロセス実行中', zh: '进程活跃' })}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                              {t({ ko: '프로세스 없음', en: 'No process', ja: 'プロセスなし', zh: '无进程' })}
                            </span>
                          )}
                          <span>
                            {t({ ko: '마지막 응답', en: 'Last activity', ja: '最終応答', zh: '最后响应' })}: {fmtTime(ag.last_activity_at)}
                          </span>
                          <span className={isIdle ? 'text-amber-400' : ''}>
                            Idle: {idleText}
                          </span>
                        </div>
                      </div>
                      {ag.task_id && (
                        <button
                          onClick={() => handleKill(ag.task_id!)}
                          disabled={isKilling}
                          className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                            isKilling
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : 'bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30'
                          }`}
                        >
                          {isKilling
                            ? t({ ko: '중지 중...', en: 'Stopping...', ja: '停止中...', zh: '停止中...' })
                            : t({ ko: '강제 중지', en: 'Kill', ja: '強制停止', zh: '强制停止' })}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {t({ ko: '5초마다 자동 갱신', en: 'Auto-refresh every 5s', ja: '5秒ごとに自動更新', zh: '每5秒自动刷新' })}
            </span>
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-700 px-4 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-600"
            >
              {t({ ko: '닫기', en: 'Close', ja: '閉じる', zh: '关闭' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
