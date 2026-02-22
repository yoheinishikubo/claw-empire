import { useEffect, useMemo, useState } from "react";
import type { UiLanguage } from "../i18n";
import { pickLang } from "../i18n";
import MessageContent from "./MessageContent";
import type { DecisionInboxItem } from "./chat/decision-inbox";

interface DecisionInboxModalProps {
  open: boolean;
  loading: boolean;
  items: DecisionInboxItem[];
  busyKey: string | null;
  uiLanguage: UiLanguage;
  onClose: () => void;
  onRefresh: () => void;
  onReplyOption: (
    item: DecisionInboxItem,
    optionNumber: number,
    payload?: { note?: string },
  ) => void;
  onOpenChat: (agentId: string) => void;
}

function formatTime(ts: number, locale: UiLanguage): string {
  return new Intl.DateTimeFormat(locale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export default function DecisionInboxModal({
  open,
  loading,
  items,
  busyKey,
  uiLanguage,
  onClose,
  onRefresh,
  onReplyOption,
  onOpenChat,
}: DecisionInboxModalProps) {
  if (!open) return null;

  const t = (text: { ko: string; en: string; ja?: string; zh?: string }) => pickLang(uiLanguage, text);
  const isKorean = uiLanguage.startsWith("ko");
  const [followupTarget, setFollowupTarget] = useState<{
    itemId: string;
    optionNumber: number;
  } | null>(null);
  const [followupDraft, setFollowupDraft] = useState("");

  useEffect(() => {
    if (!open) {
      setFollowupTarget(null);
      setFollowupDraft("");
      return;
    }
    if (!followupTarget) return;
    const stillExists = items.some((entry) => entry.id === followupTarget.itemId);
    if (!stillExists) {
      setFollowupTarget(null);
      setFollowupDraft("");
    }
  }, [open, followupTarget, items]);

  const followupItem = useMemo(
    () => (followupTarget ? items.find((entry) => entry.id === followupTarget.itemId) ?? null : null),
    [followupTarget, items],
  );
  const followupBusyKey = followupTarget ? `${followupTarget.itemId}:${followupTarget.optionNumber}` : null;
  const isFollowupSubmitting = followupBusyKey ? busyKey === followupBusyKey : false;
  const canSubmitFollowup = !!(followupItem && followupDraft.trim() && !isFollowupSubmitting);

  function handleOptionClick(item: DecisionInboxItem, optionNumber: number, action?: string) {
    if (action === "add_followup_request") {
      setFollowupTarget({ itemId: item.id, optionNumber });
      setFollowupDraft("");
      return;
    }
    onReplyOption(item, optionNumber);
  }

  function handleSubmitFollowup() {
    if (!followupItem || !followupTarget) return;
    const note = followupDraft.trim();
    if (!note) return;
    onReplyOption(followupItem, followupTarget.optionNumber, { note });
    setFollowupTarget(null);
    setFollowupDraft("");
  }

  function handleCancelFollowup() {
    setFollowupTarget(null);
    setFollowupDraft("");
  }

  const getKindLabel = (kind: DecisionInboxItem["kind"]) => {
    if (kind === "project_review_ready") {
      return t({ ko: "프로젝트 의사결정", en: "Project Decision", ja: "プロジェクト判断", zh: "项目决策" });
    }
    if (kind === "task_timeout_resume") {
      return t({ ko: "중단 작업 재개", en: "Timeout Resume", ja: "中断タスク再開", zh: "超时任务续跑" });
    }
    return t({ ko: "에이전트 요청", en: "Agent Request", ja: "エージェント要請", zh: "代理请求" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-3xl rounded-2xl border border-indigo-500/30 bg-slate-900 shadow-2xl shadow-indigo-500/10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧭</span>
            <h2 className="text-lg font-bold text-white">
              {t({ ko: "미결 의사결정", en: "Pending Decisions", ja: "未決の意思決定", zh: "待处理决策" })}
            </h2>
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-300">
              {items.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              {t({ ko: "새로고침", en: "Refresh", ja: "更新", zh: "刷新" })}
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              {t({ ko: "미결 목록 불러오는 중...", en: "Loading pending decisions...", ja: "未決一覧を読み込み中...", zh: "正在加载待处理决策..." })}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              {t({ ko: "현재 미결 의사결정이 없습니다.", en: "No pending decisions right now.", ja: "現在、未決の意思決定はありません。", zh: "当前没有待处理决策。" })}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {isKorean ? item.agentNameKo : item.agentName}
                      </p>
                      <p className="text-[11px] text-indigo-300/90">
                        {getKindLabel(item.kind)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatTime(item.createdAt, uiLanguage)}
                      </p>
                    </div>
                    {item.agentId ? (
                      <button
                        onClick={() => onOpenChat(item.agentId!)}
                        className="rounded-md border border-slate-600 px-2 py-1 text-[11px] text-slate-300 transition hover:border-slate-400 hover:bg-slate-700 hover:text-white"
                      >
                        {t({ ko: "채팅 열기", en: "Open Chat", ja: "チャットを開く", zh: "打开聊天" })}
                      </button>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 px-2.5 py-2 text-xs text-slate-200">
                    <MessageContent content={item.requestContent} />
                  </div>

                  <div className="mt-2 space-y-1.5">
                    {item.options.map((option) => {
                      const key = `${item.id}:${option.number}`;
                      const isBusy = busyKey === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleOptionClick(item, option.number, option.action)}
                          disabled={isBusy}
                          className="decision-inbox-option w-full rounded-md px-2.5 py-1.5 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy
                            ? t({ ko: "전송 중...", en: "Sending...", ja: "送信中...", zh: "发送中..." })
                            : `${option.number}. ${option.label}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {followupItem ? (
          <div className="border-t border-slate-700/60 bg-slate-900/90 px-4 py-3">
            <p className="mb-2 text-xs font-semibold text-slate-200">
              {t({
                ko: "추가요청사항 입력",
                en: "Additional Follow-up Request",
                ja: "追加要請内容の入力",
                zh: "输入追加请求事项",
              })}
            </p>
            <textarea
              value={followupDraft}
              onChange={(event) => setFollowupDraft(event.target.value)}
              placeholder={t({
                ko: "요청사항을 입력해 주세요.",
                en: "Enter your request details.",
                ja: "要請内容を入力してください。",
                zh: "请输入请求详情。",
              })}
              rows={3}
              className="w-full resize-y rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelFollowup}
                disabled={isFollowupSubmitting}
                className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t({ ko: "취소", en: "Cancel", ja: "キャンセル", zh: "取消" })}
              </button>
              <button
                type="button"
                onClick={handleSubmitFollowup}
                disabled={!canSubmitFollowup}
                className="decision-followup-submit rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFollowupSubmitting
                  ? t({ ko: "전송 중...", en: "Sending...", ja: "送信中...", zh: "发送中..." })
                  : t({ ko: "요청 등록", en: "Submit Request", ja: "要請登録", zh: "提交请求" })}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
