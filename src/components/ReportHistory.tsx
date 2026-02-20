import { useEffect, useMemo, useState } from 'react';
import type { Agent } from '../types';
import type { TaskReportSummary, TaskReportDetail } from '../api';
import type { UiLanguage } from '../i18n';
import { pickLang } from '../i18n';
import { getTaskReports, getTaskReportDetail } from '../api';
import AgentAvatar from './AgentAvatar';
import TaskReportPopup from './TaskReportPopup';

interface ReportHistoryProps {
  agents: Agent[];
  uiLanguage: UiLanguage;
  onClose: () => void;
}

function fmtDate(ts: number | null | undefined): string {
  if (!ts) return '-';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function projectNameFromSummary(report: TaskReportSummary): string {
  if (report.project_name && report.project_name.trim()) return report.project_name.trim();
  if (!report.project_path) return 'General';
  const trimmed = report.project_path.replace(/[\\/]+$/, '');
  const seg = trimmed.split(/[\\/]/).pop();
  return seg || 'General';
}

export default function ReportHistory({ agents, uiLanguage, onClose }: ReportHistoryProps) {
  const t = (text: { ko: string; en: string; ja?: string; zh?: string }) => pickLang(uiLanguage, text);
  const [reports, setReports] = useState<TaskReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<TaskReportDetail | null>(null);

  const groupedReports = useMemo(() => {
    const groups = new Map<string, TaskReportSummary[]>();
    for (const report of reports) {
      const key = projectNameFromSummary(report);
      const bucket = groups.get(key) ?? [];
      bucket.push(report);
      groups.set(key, bucket);
    }
    return [...groups.entries()];
  }, [reports]);

  useEffect(() => {
    getTaskReports()
      .then((r) => setReports(r))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleOpenDetail = async (taskId: string) => {
    try {
      const d = await getTaskReportDetail(taskId);
      setDetail(d);
    } catch (e) {
      console.error('Failed to load report detail:', e);
    }
  };

  // 상세 보기가 열려 있으면 TaskReportPopup 표시
  if (detail) {
    return (
      <TaskReportPopup
        report={detail}
        agents={agents}
        uiLanguage={uiLanguage}
        onClose={() => setDetail(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-2xl rounded-2xl border border-emerald-500/30 bg-slate-900 shadow-2xl shadow-emerald-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#x1F4CA;</span>
            <h2 className="text-lg font-bold text-white">
              {t({ ko: '작업 보고서 이력', en: 'Report History', ja: 'レポート履歴', zh: '报告历史' })}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-slate-500">
                {t({ ko: '불러오는 중...', en: 'Loading...', ja: '読み込み中...', zh: '加载中...' })}
              </div>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="mb-2 text-3xl opacity-40">&#x1F4ED;</span>
              <p className="text-sm text-slate-500">
                {t({ ko: '완료된 보고서가 없습니다', en: 'No completed reports', ja: '完了レポートなし', zh: '没有已完成的报告' })}
              </p>
            </div>
          ) : (
            <div className="space-y-4 px-4 py-3">
              {groupedReports.map(([projectName, rows]) => (
                <div key={projectName} className="overflow-hidden rounded-xl border border-slate-700/50">
                  <div className="flex items-center justify-between bg-slate-800/70 px-4 py-2">
                    <p className="truncate text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      {projectName}
                    </p>
                    <span className="text-[11px] text-slate-500">{rows.length}</span>
                  </div>
                  <div className="divide-y divide-slate-700/30">
                    {rows.map((r) => {
                      const agent = agents.find((a) => a.id === r.assigned_agent_id);
                      const agentName = uiLanguage === 'ko' ? (r.agent_name_ko || r.agent_name) : r.agent_name;
                      const deptName = uiLanguage === 'ko' ? (r.dept_name_ko || r.dept_name) : r.dept_name;
                      return (
                        <button
                          key={r.id}
                          onClick={() => handleOpenDetail(r.id)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-800/50"
                        >
                          <AgentAvatar agent={agent} agents={agents} size={34} rounded="xl" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">{r.title}</p>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                              <span className="rounded bg-slate-700/80 px-1.5 py-0.5">{deptName}</span>
                              <span>{agentName}</span>
                              <span className="text-slate-600">&middot;</span>
                              <span>{fmtDate(r.completed_at)}</span>
                            </div>
                          </div>
                          <span className="flex-shrink-0 text-xs text-emerald-400">&#x2713;</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {t({ ko: `총 ${reports.length}건`, en: `${reports.length} reports`, ja: `全${reports.length}件`, zh: `共${reports.length}条` })}
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
