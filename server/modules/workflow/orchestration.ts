// @ts-nocheck

import { initializeWorkflowMeetingTools } from "./orchestration/meetings.ts";

export function initializeWorkflowPartC(ctx: any): any {
  const __ctx = ctx as any;
  const BUILTIN_GOOGLE_CLIENT_ID = __ctx.BUILTIN_GOOGLE_CLIENT_ID;
  const BUILTIN_GOOGLE_CLIENT_SECRET = __ctx.BUILTIN_GOOGLE_CLIENT_SECRET;
  const CLI_OUTPUT_DEDUP_WINDOW_MS = __ctx.CLI_OUTPUT_DEDUP_WINDOW_MS;
  const REVIEW_MAX_MEMO_ITEMS_PER_DEPT = __ctx.REVIEW_MAX_MEMO_ITEMS_PER_DEPT;
  const REVIEW_MAX_MEMO_ITEMS_PER_ROUND = __ctx.REVIEW_MAX_MEMO_ITEMS_PER_ROUND;
  const REVIEW_MAX_REMEDIATION_REQUESTS = __ctx.REVIEW_MAX_REMEDIATION_REQUESTS;
  const REVIEW_MAX_REVISION_SIGNALS_PER_DEPT_PER_ROUND = __ctx.REVIEW_MAX_REVISION_SIGNALS_PER_DEPT_PER_ROUND;
  const REVIEW_MAX_REVISION_SIGNALS_PER_ROUND = __ctx.REVIEW_MAX_REVISION_SIGNALS_PER_ROUND;
  const REVIEW_MAX_ROUNDS = __ctx.REVIEW_MAX_ROUNDS;
  const createHash = __ctx.createHash;
  const createWsHub = __ctx.createWsHub;
  const db = __ctx.db;
  const decryptSecret = __ctx.decryptSecret;
  const encryptSecret = __ctx.encryptSecret;
  const ensureOAuthActiveAccount = __ctx.ensureOAuthActiveAccount;
  const execFile = __ctx.execFile;
  const execFileSync = __ctx.execFileSync;
  const fs = __ctx.fs;
  const getActiveOAuthAccountIds = __ctx.getActiveOAuthAccountIds;
  const logsDir = __ctx.logsDir;
  const notifyTaskStatus = __ctx.notifyTaskStatus;
  const nowMs = __ctx.nowMs;
  const os = __ctx.os;
  const path = __ctx.path;
  const randomUUID = __ctx.randomUUID;
  const readNonNegativeIntEnv = __ctx.readNonNegativeIntEnv;
  const spawn = __ctx.spawn;
  const CLI_STATUS_TTL = __ctx.CLI_STATUS_TTL;
  const CLI_TOOLS = __ctx.CLI_TOOLS;
  const MODELS_CACHE_TTL = __ctx.MODELS_CACHE_TTL;
  const activeProcesses = __ctx.activeProcesses;
  const analyzeSubtaskDepartment = __ctx.analyzeSubtaskDepartment;
  const appendTaskLog = __ctx.appendTaskLog;
  const broadcast = __ctx.broadcast;
  const buildCliFailureMessage = __ctx.buildCliFailureMessage;
  const buildDirectReplyPrompt = __ctx.buildDirectReplyPrompt;
  const buildTaskExecutionPrompt = __ctx.buildTaskExecutionPrompt;
  const cachedCliStatus = __ctx.cachedCliStatus;
  const cachedModels = __ctx.cachedModels;
  const chooseSafeReply = __ctx.chooseSafeReply;
  const cleanupWorktree = __ctx.cleanupWorktree;
  const createWorktree = __ctx.createWorktree;
  const detectAllCli = __ctx.detectAllCli;
  const ensureClaudeMd = __ctx.ensureClaudeMd;
  const execWithTimeout = __ctx.execWithTimeout;
  const fetchClaudeUsage = __ctx.fetchClaudeUsage;
  const fetchCodexUsage = __ctx.fetchCodexUsage;
  const fetchGeminiUsage = __ctx.fetchGeminiUsage;
  const generateProjectContext = __ctx.generateProjectContext;
  const getAgentDisplayName = __ctx.getAgentDisplayName;
  const getDecryptedOAuthToken = __ctx.getDecryptedOAuthToken;
  const getNextOAuthLabel = __ctx.getNextOAuthLabel;
  const getOAuthAccounts = __ctx.getOAuthAccounts;
  const getPreferredOAuthAccounts = __ctx.getPreferredOAuthAccounts;
  const getProviderModelConfig = __ctx.getProviderModelConfig;
  const getRecentChanges = __ctx.getRecentChanges;
  const getRecentConversationContext = __ctx.getRecentConversationContext;
  const getTaskContinuationContext = __ctx.getTaskContinuationContext;
  const hasExplicitWarningFixRequest = __ctx.hasExplicitWarningFixRequest;
  const hasStructuredJsonLines = __ctx.hasStructuredJsonLines;
  const httpAgentCounter = __ctx.httpAgentCounter;
  const interruptPidTree = __ctx.interruptPidTree;
  const isPidAlive = __ctx.isPidAlive;
  const killPidTree = __ctx.killPidTree;
  const launchHttpAgent = __ctx.launchHttpAgent;
  const mergeWorktree = __ctx.mergeWorktree;
  const normalizeOAuthProvider = __ctx.normalizeOAuthProvider;
  const randomDelay = __ctx.randomDelay;
  const refreshGoogleToken = __ctx.refreshGoogleToken;
  const rollbackTaskWorktree = __ctx.rollbackTaskWorktree;
  const runAgentOneShot = __ctx.runAgentOneShot;
  const seedApprovedPlanSubtasks = __ctx.seedApprovedPlanSubtasks;
  const spawnCliAgent = __ctx.spawnCliAgent;
  const stopRequestModeByTask = __ctx.stopRequestModeByTask;
  const stopRequestedTasks = __ctx.stopRequestedTasks;
  const taskWorktrees = __ctx.taskWorktrees;
  const wsClients = __ctx.wsClients;
  const readTimeoutMsEnv = __ctx.readTimeoutMsEnv;
  const TASK_RUN_IDLE_TIMEOUT_MS = __ctx.TASK_RUN_IDLE_TIMEOUT_MS;
  const TASK_RUN_HARD_TIMEOUT_MS = __ctx.TASK_RUN_HARD_TIMEOUT_MS;
  const isGitRepo = __ctx.isGitRepo;
  const getWorktreeDiffSummary = __ctx.getWorktreeDiffSummary;
  const MVP_CODE_REVIEW_POLICY_BASE_LINES = __ctx.MVP_CODE_REVIEW_POLICY_BASE_LINES;
  const EXECUTION_CONTINUITY_POLICY_LINES = __ctx.EXECUTION_CONTINUITY_POLICY_LINES;
  const WARNING_FIX_OVERRIDE_LINE = __ctx.WARNING_FIX_OVERRIDE_LINE;
  const buildMvpCodeReviewPolicyBlock = __ctx.buildMvpCodeReviewPolicyBlock;
  const CONTEXT_IGNORE_DIRS = __ctx.CONTEXT_IGNORE_DIRS;
  const CONTEXT_IGNORE_FILES = __ctx.CONTEXT_IGNORE_FILES;
  const buildFileTree = __ctx.buildFileTree;
  const detectTechStack = __ctx.detectTechStack;
  const getKeyFiles = __ctx.getKeyFiles;
  const buildProjectContextContent = __ctx.buildProjectContextContent;
  const buildAgentArgs = __ctx.buildAgentArgs;
  const ANSI_ESCAPE_REGEX = __ctx.ANSI_ESCAPE_REGEX;
  const CLI_SPINNER_LINE_REGEX = __ctx.CLI_SPINNER_LINE_REGEX;
  const cliOutputDedupCache = __ctx.cliOutputDedupCache;
  const shouldSkipDuplicateCliOutput = __ctx.shouldSkipDuplicateCliOutput;
  const clearCliOutputDedup = __ctx.clearCliOutputDedup;
  const normalizeStreamChunk = __ctx.normalizeStreamChunk;
  const extractLatestProjectMemoBlock = __ctx.extractLatestProjectMemoBlock;
  const sleepMs = __ctx.sleepMs;
  const localeInstruction = __ctx.localeInstruction;
  const normalizeConversationReply = __ctx.normalizeConversationReply;
  const isInternalWorkNarration = __ctx.isInternalWorkNarration;
  const fallbackTurnReply = __ctx.fallbackTurnReply;
  const summarizeForMeetingBubble = __ctx.summarizeForMeetingBubble;
  const isMvpDeferralSignal = __ctx.isMvpDeferralSignal;
  const isHardBlockSignal = __ctx.isHardBlockSignal;
  const hasApprovalAgreementSignal = __ctx.hasApprovalAgreementSignal;
  const isDeferrableReviewHold = __ctx.isDeferrableReviewHold;
  const classifyMeetingReviewDecision = __ctx.classifyMeetingReviewDecision;
  const wantsReviewRevision = __ctx.wantsReviewRevision;
  const findLatestTranscriptContentByAgent = __ctx.findLatestTranscriptContentByAgent;
  const formatMeetingTranscript = __ctx.formatMeetingTranscript;
  const buildMeetingPrompt = __ctx.buildMeetingPrompt;
  const findExplicitDepartmentByMention = __ctx.findExplicitDepartmentByMention;
  const plannerSubtaskRoutingInFlight = __ctx.plannerSubtaskRoutingInFlight;
  const normalizeDeptAliasToken = __ctx.normalizeDeptAliasToken;
  const normalizePlannerTargetDeptId = __ctx.normalizePlannerTargetDeptId;
  const parsePlannerSubtaskAssignments = __ctx.parsePlannerSubtaskAssignments;
  const rerouteSubtasksByPlanningLeader = __ctx.rerouteSubtasksByPlanningLeader;
  const createSubtaskFromCli = __ctx.createSubtaskFromCli;
  const completeSubtaskFromCli = __ctx.completeSubtaskFromCli;
  const seedReviewRevisionSubtasks = __ctx.seedReviewRevisionSubtasks;
  const codexThreadToSubtask = __ctx.codexThreadToSubtask;
  const parseAndCreateSubtasks = __ctx.parseAndCreateSubtasks;
  const ANTIGRAVITY_ENDPOINTS = __ctx.ANTIGRAVITY_ENDPOINTS;
  const ANTIGRAVITY_DEFAULT_PROJECT = __ctx.ANTIGRAVITY_DEFAULT_PROJECT;
  const copilotTokenCache = __ctx.copilotTokenCache;
  const antigravityProjectCache = __ctx.antigravityProjectCache;
  const oauthProviderPrefix = __ctx.oauthProviderPrefix;
  const getOAuthAccountDisplayName = __ctx.getOAuthAccountDisplayName;
  const getOAuthAutoSwapEnabled = __ctx.getOAuthAutoSwapEnabled;
  const oauthDispatchCursor = __ctx.oauthDispatchCursor;
  const rotateOAuthAccounts = __ctx.rotateOAuthAccounts;
  const prioritizeOAuthAccount = __ctx.prioritizeOAuthAccount;
  const markOAuthAccountFailure = __ctx.markOAuthAccountFailure;
  const markOAuthAccountSuccess = __ctx.markOAuthAccountSuccess;
  const exchangeCopilotToken = __ctx.exchangeCopilotToken;
  const loadCodeAssistProject = __ctx.loadCodeAssistProject;
  const parseHttpAgentSubtasks = __ctx.parseHttpAgentSubtasks;
  const parseSSEStream = __ctx.parseSSEStream;
  const parseGeminiSSEStream = __ctx.parseGeminiSSEStream;
  const resolveCopilotModel = __ctx.resolveCopilotModel;
  const resolveAntigravityModel = __ctx.resolveAntigravityModel;
  const executeCopilotAgent = __ctx.executeCopilotAgent;
  const executeAntigravityAgent = __ctx.executeAntigravityAgent;
  const jsonHasKey = __ctx.jsonHasKey;
  const fileExistsNonEmpty = __ctx.fileExistsNonEmpty;
  const readClaudeToken = __ctx.readClaudeToken;
  const readCodexTokens = __ctx.readCodexTokens;
  const GEMINI_OAUTH_CLIENT_ID = __ctx.GEMINI_OAUTH_CLIENT_ID;
  const GEMINI_OAUTH_CLIENT_SECRET = __ctx.GEMINI_OAUTH_CLIENT_SECRET;
  const readGeminiCredsFromKeychain = __ctx.readGeminiCredsFromKeychain;
  const readGeminiCredsFromFile = __ctx.readGeminiCredsFromFile;
  const readGeminiCreds = __ctx.readGeminiCreds;
  const freshGeminiToken = __ctx.freshGeminiToken;
  const geminiProjectCache = __ctx.geminiProjectCache;
  const GEMINI_PROJECT_TTL = __ctx.GEMINI_PROJECT_TTL;
  const getGeminiProjectId = __ctx.getGeminiProjectId;
  const detectCliTool = __ctx.detectCliTool;
  const DEPT_KEYWORDS = __ctx.DEPT_KEYWORDS;
  const detectLang = (...args: any[]) => __ctx.detectLang(...args);
  const detectTargetDepartments = (...args: any[]) => __ctx.detectTargetDepartments(...args);
  const findTeamLeader = (...args: any[]) => __ctx.findTeamLeader(...args);
  const formatTaskSubtaskProgressSummary = (...args: any[]) => __ctx.formatTaskSubtaskProgressSummary(...args);
  const getDeptName = (...args: any[]) => __ctx.getDeptName(...args);
  const getDeptRoleConstraint = (...args: any[]) => __ctx.getDeptRoleConstraint(...args);
  const getPreferredLanguage = (...args: any[]) => __ctx.getPreferredLanguage(...args);
  const getRoleLabel = (...args: any[]) => __ctx.getRoleLabel(...args);
  const l = (...args: any[]) => __ctx.l(...args);
  const pickL = (...args: any[]) => __ctx.pickL(...args);
  const prettyStreamJson = (...args: any[]) => __ctx.prettyStreamJson(...args);
  const processSubtaskDelegations = (...args: any[]) => __ctx.processSubtaskDelegations(...args);
  const recoverCrossDeptQueueAfterMissingCallback = (...args: any[]) => __ctx.recoverCrossDeptQueueAfterMissingCallback(...args);
  const refreshCliUsageData = (...args: any[]) => __ctx.refreshCliUsageData(...args);
  const resolveLang = (...args: any[]) => __ctx.resolveLang(...args);
  const resolveProjectPath = (...args: any[]) => __ctx.resolveProjectPath(...args);
  const sendAgentMessage = (...args: any[]) => __ctx.sendAgentMessage(...args);

// ---------------------------------------------------------------------------
// Helpers: progress timers, CEO notifications
// ---------------------------------------------------------------------------

// Track progress report timers so we can cancel them when tasks finish
const progressTimers = new Map<string, ReturnType<typeof setInterval>>();

// Cross-department sequential queue: when a cross-dept task finishes,
// trigger the next department in line (instead of spawning all simultaneously).
// Key: cross-dept task ID → callback to start next department
const crossDeptNextCallbacks = new Map<string, () => void>();

// Subtask delegation sequential queue: delegated task ID → callback to start next delegation
const subtaskDelegationCallbacks = new Map<string, () => void>();
const subtaskDelegationDispatchInFlight = new Set<string>();

// Map delegated task ID → original subtask ID for completion tracking
const delegatedTaskToSubtask = new Map<string, string>();
const subtaskDelegationCompletionNoticeSent = new Set<string>();

// Review consensus workflow state: task_id → current review round
const reviewRoundState = new Map<string, number>();
const reviewInFlight = new Set<string>();
const meetingPresenceUntil = new Map<string, number>();
const meetingSeatIndexByAgent = new Map<string, number>();
const meetingPhaseByAgent = new Map<string, "kickoff" | "review">();
const meetingTaskIdByAgent = new Map<string, string>();
type MeetingReviewDecision = "reviewing" | "approved" | "hold";
const meetingReviewDecisionByAgent = new Map<string, MeetingReviewDecision>();

interface TaskExecutionSessionState {
  sessionId: string;
  taskId: string;
  agentId: string;
  provider: string;
  openedAt: number;
  lastTouchedAt: number;
}

const taskExecutionSessions = new Map<string, TaskExecutionSessionState>();

function ensureTaskExecutionSession(taskId: string, agentId: string, provider: string): TaskExecutionSessionState {
  const now = nowMs();
  const existing = taskExecutionSessions.get(taskId);
  if (existing && existing.agentId === agentId && existing.provider === provider) {
    existing.lastTouchedAt = now;
    taskExecutionSessions.set(taskId, existing);
    return existing;
  }

  const nextSession: TaskExecutionSessionState = {
    sessionId: randomUUID(),
    taskId,
    agentId,
    provider,
    openedAt: now,
    lastTouchedAt: now,
  };
  taskExecutionSessions.set(taskId, nextSession);
  appendTaskLog(
    taskId,
    "system",
    existing
      ? `Execution session rotated: ${existing.sessionId} -> ${nextSession.sessionId} (agent=${agentId}, provider=${provider})`
      : `Execution session opened: ${nextSession.sessionId} (agent=${agentId}, provider=${provider})`,
  );
  return nextSession;
}

function endTaskExecutionSession(taskId: string, reason: string): void {
  const existing = taskExecutionSessions.get(taskId);
  if (!existing) return;
  taskExecutionSessions.delete(taskId);
  appendTaskLog(
    taskId,
    "system",
    `Execution session closed: ${existing.sessionId} (reason=${reason}, duration_ms=${Math.max(0, nowMs() - existing.openedAt)})`,
  );
}

function getTaskStatusById(taskId: string): string | null {
  const row = db.prepare("SELECT status FROM tasks WHERE id = ?").get(taskId) as { status: string } | undefined;
  return row?.status ?? null;
}

function isTaskWorkflowInterrupted(taskId: string): boolean {
  const status = getTaskStatusById(taskId);
  if (!status) return true; // deleted
  if (stopRequestedTasks.has(taskId)) return true;
  return status === "cancelled" || status === "pending" || status === "done" || status === "inbox";
}

function clearTaskWorkflowState(taskId: string): void {
  clearCliOutputDedup(taskId);
  crossDeptNextCallbacks.delete(taskId);
  subtaskDelegationCallbacks.delete(taskId);
  subtaskDelegationDispatchInFlight.delete(taskId);
  delegatedTaskToSubtask.delete(taskId);
  subtaskDelegationCompletionNoticeSent.delete(taskId);
  reviewInFlight.delete(taskId);
  reviewInFlight.delete(`planned:${taskId}`);
  reviewRoundState.delete(taskId);
  reviewRoundState.delete(`planned:${taskId}`);
  const status = getTaskStatusById(taskId);
  if (status === "done" || status === "cancelled") {
    endTaskExecutionSession(taskId, `workflow_cleared_${status}`);
  }
}

type ReviewRoundMode = "parallel_remediation" | "merge_synthesis" | "final_decision";

function getReviewRoundMode(round: number): ReviewRoundMode {
  if (round <= 1) return "parallel_remediation";
  if (round === 2) return "merge_synthesis";
  return "final_decision";
}

function scheduleNextReviewRound(taskId: string, taskTitle: string, currentRound: number, lang: Lang): void {
  const nextRound = currentRound + 1;
  appendTaskLog(
    taskId,
    "system",
    `Review round ${currentRound}: scheduling round ${nextRound} finalization meeting`,
  );
  notifyCeo(pickL(l(
    [`[CEO OFFICE] '${taskTitle}' 리뷰 라운드 ${currentRound} 취합이 완료되어 라운드 ${nextRound} 최종 승인 회의로 즉시 전환합니다.`],
    [`[CEO OFFICE] '${taskTitle}' review round ${currentRound} consolidation is complete. Moving directly to final approval round ${nextRound}.`],
    [`[CEO OFFICE] '${taskTitle}' のレビューラウンド${currentRound}集約が完了したため、最終承認ラウンド${nextRound}へ即時移行します。`],
    [`[CEO OFFICE] '${taskTitle}' 第 ${currentRound} 轮评审已完成汇总，立即转入第 ${nextRound} 轮最终审批会议。`],
  ), lang), taskId);
  setTimeout(() => {
    const current = db.prepare("SELECT status FROM tasks WHERE id = ?").get(taskId) as { status: string } | undefined;
    if (!current || current.status !== "review") return;
    finishReview(taskId, taskTitle);
  }, randomDelay(1200, 1900));
}

function startProgressTimer(taskId: string, taskTitle: string, departmentId: string | null): void {
  // Send progress report every 5min for long-running tasks
  const timer = setInterval(() => {
    const currentTask = db.prepare("SELECT status FROM tasks WHERE id = ?").get(taskId) as { status: string } | undefined;
    if (!currentTask || currentTask.status !== "in_progress") {
      clearInterval(timer);
      progressTimers.delete(taskId);
      return;
    }
    const leader = findTeamLeader(departmentId);
    if (leader) {
      sendAgentMessage(
        leader,
        `대표님, '${taskTitle}' 작업 진행 중입니다. 현재 순조롭게 진행되고 있어요.`,
        "report",
        "all",
        null,
        taskId,
      );
    }
  }, 300_000);
  progressTimers.set(taskId, timer);
}

function stopProgressTimer(taskId: string): void {
  const timer = progressTimers.get(taskId);
  if (timer) {
    clearInterval(timer);
    progressTimers.delete(taskId);
  }
}

// ---------------------------------------------------------------------------
// Send CEO notification for all significant workflow events (B4)
// ---------------------------------------------------------------------------
function notifyCeo(content: string, taskId: string | null = null, messageType: string = "status_update"): void {
  const msgId = randomUUID();
  const t = nowMs();
  db.prepare(
    `INSERT INTO messages (id, sender_type, sender_id, receiver_type, receiver_id, content, message_type, task_id, created_at)
     VALUES (?, 'system', NULL, 'all', NULL, ?, ?, ?, ?)`
  ).run(msgId, content, messageType, taskId, t);
  broadcast("new_message", {
    id: msgId,
    sender_type: "system",
    content,
    message_type: messageType,
    task_id: taskId,
    created_at: t,
  });
}

const workflowMeetingTools = initializeWorkflowMeetingTools(Object.assign(
  Object.create(__ctx),
  {
    progressTimers,
    reviewRoundState,
    reviewInFlight,
    meetingPresenceUntil,
    meetingSeatIndexByAgent,
    meetingPhaseByAgent,
    meetingTaskIdByAgent,
    meetingReviewDecisionByAgent,
    getTaskStatusById,
    getReviewRoundMode,
    scheduleNextReviewRound,
    startProgressTimer,
    stopProgressTimer,
    notifyCeo,
  },
));
const {
  getLeadersByDepartmentIds,
  getAllActiveTeamLeaders,
  getTaskRelatedDepartmentIds,
  getTaskReviewLeaders,
  beginMeetingMinutes,
  appendMeetingMinuteEntry,
  finishMeetingMinutes,
  normalizeRevisionMemoNote,
  reserveReviewRevisionMemoItems,
  loadRecentReviewRevisionMemoItems,
  collectRevisionMemoItems,
  collectPlannedActionItems,
  appendTaskProjectMemo,
  appendTaskReviewFinalMemo,
  markAgentInMeeting,
  isAgentInMeeting,
  callLeadersToCeoOffice,
  dismissLeadersFromCeoOffice,
  emitMeetingSpeech,
  startReviewConsensusMeeting,
} = workflowMeetingTools;

function startTaskExecutionForAgent(
  taskId: string,
  execAgent: AgentRow,
  deptId: string | null,
  deptName: string,
): void {
  const execName = execAgent.name_ko || execAgent.name;
  const t = nowMs();
  db.prepare(
    "UPDATE tasks SET status = 'in_progress', assigned_agent_id = ?, started_at = ?, updated_at = ? WHERE id = ?"
  ).run(execAgent.id, t, t, taskId);
  db.prepare("UPDATE agents SET status = 'working', current_task_id = ? WHERE id = ?").run(taskId, execAgent.id);
  appendTaskLog(taskId, "system", `${execName} started (approved)`);

  broadcast("task_update", db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId));
  broadcast("agent_status", db.prepare("SELECT * FROM agents WHERE id = ?").get(execAgent.id));

  const provider = execAgent.cli_provider || "claude";
  if (!["claude", "codex", "gemini", "opencode", "copilot", "antigravity"].includes(provider)) return;
  const executionSession = ensureTaskExecutionSession(taskId, execAgent.id, provider);

  const taskData = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as {
    title: string;
    description: string | null;
    project_path: string | null;
  } | undefined;
  if (!taskData) return;
  notifyTaskStatus(taskId, taskData.title, "in_progress");

  const projPath = resolveProjectPath(taskData);
  const logFilePath = path.join(logsDir, `${taskId}.log`);
  const roleLabel = { team_leader: "Team Leader", senior: "Senior", junior: "Junior", intern: "Intern" }[execAgent.role] || execAgent.role;
  const deptConstraint = deptId ? getDeptRoleConstraint(deptId, deptName) : "";
  const conversationCtx = getRecentConversationContext(execAgent.id);
  const continuationCtx = getTaskContinuationContext(taskId);
  const recentChanges = getRecentChanges(projPath, taskId);
  const continuationInstruction = continuationCtx
    ? "Continuation run: keep ownership, skip greetings/kickoff narration, and execute unresolved review items immediately."
    : "Execute directly without long preamble and keep messages concise.";
  const spawnPrompt = buildTaskExecutionPrompt([
    `[Task Session] id=${executionSession.sessionId} owner=${executionSession.agentId} provider=${executionSession.provider}`,
    "This session is scoped to this task only. Keep context continuity inside this task session and do not mix with other projects.",
    recentChanges ? `[Recent Changes]\n${recentChanges}` : "",
    `[Task] ${taskData.title}`,
    taskData.description ? `\n${taskData.description}` : "",
    continuationCtx,
    conversationCtx,
    `\n---`,
    `Agent: ${execAgent.name} (${roleLabel}, ${deptName})`,
    execAgent.personality ? `Personality: ${execAgent.personality}` : "",
    deptConstraint,
    continuationInstruction,
    `Please complete the task above thoroughly. Use the continuation brief and conversation context above if relevant.`,
  ], {
    allowWarningFix: hasExplicitWarningFixRequest(taskData.title, taskData.description),
  });

  appendTaskLog(taskId, "system", `RUN start (agent=${execAgent.name}, provider=${provider})`);
  if (provider === "copilot" || provider === "antigravity") {
    const controller = new AbortController();
    const fakePid = -(++httpAgentCounter);
    launchHttpAgent(
      taskId,
      provider,
      spawnPrompt,
      projPath,
      logFilePath,
      controller,
      fakePid,
      execAgent.oauth_account_id ?? null,
    );
  } else {
    const modelConfig = getProviderModelConfig();
    const modelForProvider = modelConfig[provider]?.model || undefined;
    const reasoningLevel = modelConfig[provider]?.reasoningLevel || undefined;
    const child = spawnCliAgent(taskId, provider, spawnPrompt, projPath, logFilePath, modelForProvider, reasoningLevel);
    child.on("close", (code) => {
      handleTaskRunComplete(taskId, code ?? 1);
    });
  }

  const lang = resolveLang(taskData.description ?? taskData.title);
  notifyCeo(pickL(l(
    [`${execName}가 '${taskData.title}' 작업을 시작했습니다.`],
    [`${execName} started work on '${taskData.title}'.`],
    [`${execName}が '${taskData.title}' の作業を開始しました。`],
    [`${execName} 已开始处理 '${taskData.title}'。`],
  ), lang), taskId);
  startProgressTimer(taskId, taskData.title, deptId);
}

function startPlannedApprovalMeeting(
  taskId: string,
  taskTitle: string,
  departmentId: string | null,
  onApproved: (planningNotes?: string[]) => void,
): void {
  const lockKey = `planned:${taskId}`;
  if (reviewInFlight.has(lockKey)) {
    return;
  }
  reviewInFlight.add(lockKey);

  void (async () => {
    let meetingId: string | null = null;
    const leaders = getTaskReviewLeaders(taskId, departmentId);
    if (leaders.length === 0) {
      reviewInFlight.delete(lockKey);
      onApproved([]);
      return;
    }
    try {
      const round = (reviewRoundState.get(lockKey) ?? 0) + 1;
      reviewRoundState.set(lockKey, round);

      const planningLeader = leaders.find((l) => l.department_id === "planning") ?? leaders[0];
      const otherLeaders = leaders.filter((l) => l.id !== planningLeader.id);
      let hasSupplementSignals = false;
      const seatIndexByAgent = new Map(leaders.slice(0, 6).map((leader, idx) => [leader.id, idx]));

      const taskCtx = db.prepare(
        "SELECT description, project_path FROM tasks WHERE id = ?"
      ).get(taskId) as { description: string | null; project_path: string | null } | undefined;
      const taskDescription = taskCtx?.description ?? null;
      const projectPath = resolveProjectPath({
        title: taskTitle,
        description: taskDescription,
        project_path: taskCtx?.project_path ?? null,
      });
      const lang = resolveLang(taskDescription ?? taskTitle);
      const transcript: MeetingTranscriptEntry[] = [];
      const oneShotOptions = { projectPath, timeoutMs: 35_000 };
      const wantsRevision = (content: string): boolean => (
        /보완|수정|보류|리스크|추가.?필요|hold|revise|revision|required|pending|risk|block|保留|修正|补充|暂缓/i
      ).test(content);
      meetingId = beginMeetingMinutes(taskId, "planned", round, taskTitle);
      let minuteSeq = 1;
      const abortIfInactive = (): boolean => {
        if (!isTaskWorkflowInterrupted(taskId)) return false;
        const status = getTaskStatusById(taskId);
        if (meetingId) finishMeetingMinutes(meetingId, "failed");
        dismissLeadersFromCeoOffice(taskId, leaders);
        clearTaskWorkflowState(taskId);
        if (status) {
          appendTaskLog(taskId, "system", `Planned meeting aborted due to task state change (${status})`);
        }
        return true;
      };

      const pushTranscript = (leader: AgentRow, content: string) => {
        transcript.push({
          speaker_agent_id: leader.id,
          speaker: getAgentDisplayName(leader, lang),
          department: getDeptName(leader.department_id ?? ""),
          role: getRoleLabel(leader.role, lang as Lang),
          content,
        });
      };
      const speak = (leader: AgentRow, messageType: string, receiverType: string, receiverId: string | null, content: string) => {
        if (isTaskWorkflowInterrupted(taskId)) return;
        sendAgentMessage(leader, content, messageType, receiverType, receiverId, taskId);
        const seatIndex = seatIndexByAgent.get(leader.id) ?? 0;
        emitMeetingSpeech(leader.id, seatIndex, "kickoff", taskId, content);
        pushTranscript(leader, content);
        if (meetingId) {
          appendMeetingMinuteEntry(meetingId, minuteSeq++, leader, lang, messageType, content);
        }
      };

      if (abortIfInactive()) return;
      callLeadersToCeoOffice(taskId, leaders, "kickoff");
      notifyCeo(pickL(l(
        [`[CEO OFFICE] '${taskTitle}' Planned 계획 라운드 ${round} 시작. 부서별 보완점 수집 후 실행계획(SubTask)으로 정리합니다.`],
        [`[CEO OFFICE] '${taskTitle}' planned round ${round} started. Collecting supplement points and turning them into executable subtasks.`],
        [`[CEO OFFICE] '${taskTitle}' のPlanned計画ラウンド${round}を開始。補完項目を収集し、実行SubTaskへ落とし込みます。`],
        [`[CEO OFFICE] 已开始'${taskTitle}'第${round}轮 Planned 规划，正在收集补充点并转为可执行 SubTask。`],
      ), lang), taskId);

      const openingPrompt = buildMeetingPrompt(planningLeader, {
        meetingType: "planned",
        round,
        taskTitle,
        taskDescription,
        transcript,
        turnObjective: "Open the planned kickoff meeting and ask each leader for concrete supplement points and planning actions.",
        stanceHint: "At Planned stage, do not block kickoff; convert concerns into executable planning items.",
        lang,
      });
      const openingRun = await runAgentOneShot(planningLeader, openingPrompt, oneShotOptions);
      if (abortIfInactive()) return;
      const openingText = chooseSafeReply(openingRun, lang, "opening", planningLeader);
      speak(planningLeader, "chat", "all", null, openingText);
      await sleepMs(randomDelay(700, 1260));
      if (abortIfInactive()) return;

      for (const leader of otherLeaders) {
        if (abortIfInactive()) return;
        const feedbackPrompt = buildMeetingPrompt(leader, {
          meetingType: "planned",
          round,
          taskTitle,
          taskDescription,
          transcript,
          turnObjective: "Share concise readiness feedback plus concrete supplement items to be planned as subtasks.",
          stanceHint: "Do not hold approval here; provide actionable plan additions with evidence/check item.",
          lang,
        });
        const feedbackRun = await runAgentOneShot(leader, feedbackPrompt, oneShotOptions);
        if (abortIfInactive()) return;
        const feedbackText = chooseSafeReply(feedbackRun, lang, "feedback", leader);
        speak(leader, "chat", "agent", planningLeader.id, feedbackText);
        if (wantsRevision(feedbackText)) {
          hasSupplementSignals = true;
        }
        await sleepMs(randomDelay(620, 1080));
        if (abortIfInactive()) return;
      }

      const summaryPrompt = buildMeetingPrompt(planningLeader, {
        meetingType: "planned",
        round,
        taskTitle,
        taskDescription,
        transcript,
        turnObjective: "Summarize supplement points and announce that they will be converted to subtasks before execution.",
        stanceHint: "Keep kickoff moving and show concrete planned next steps instead of blocking.",
        lang,
      });
      const summaryRun = await runAgentOneShot(planningLeader, summaryPrompt, oneShotOptions);
      if (abortIfInactive()) return;
      const summaryText = chooseSafeReply(summaryRun, lang, "summary", planningLeader);
      speak(planningLeader, "report", "all", null, summaryText);
      await sleepMs(randomDelay(640, 1120));
      if (abortIfInactive()) return;

      for (const leader of leaders) {
        if (abortIfInactive()) return;
        const actionPrompt = buildMeetingPrompt(leader, {
          meetingType: "planned",
          round,
          taskTitle,
          taskDescription,
          transcript,
          turnObjective: "Propose one immediate planning action item for your team in subtask style.",
          stanceHint: "State what to do next, what evidence to collect, and who owns it. Do not block kickoff at this stage.",
          lang,
        });
        const actionRun = await runAgentOneShot(leader, actionPrompt, oneShotOptions);
        if (abortIfInactive()) return;
        const actionText = chooseSafeReply(actionRun, lang, "approval", leader);
        speak(leader, "status_update", "all", null, actionText);
        if (wantsRevision(actionText)) {
          hasSupplementSignals = true;
        }
        await sleepMs(randomDelay(420, 840));
        if (abortIfInactive()) return;
      }

      await sleepMs(randomDelay(520, 900));
      if (abortIfInactive()) return;
      const planItems = collectPlannedActionItems(transcript, 10);
      appendTaskProjectMemo(taskId, "planned", round, planItems, lang);
      appendTaskLog(
        taskId,
        "system",
        `Planned meeting round ${round}: action items collected (${planItems.length}, supplement-signals=${hasSupplementSignals ? "yes" : "no"})`,
      );
      notifyCeo(pickL(l(
        [`[CEO OFFICE] '${taskTitle}' Planned 회의 종료. 보완점 ${planItems.length}건을 계획 항목으로 기록하고 In Progress로 진행합니다.`],
        [`[CEO OFFICE] Planned meeting for '${taskTitle}' is complete. Recorded ${planItems.length} improvement items and moving to In Progress.`],
        [`[CEO OFFICE] '${taskTitle}' のPlanned会議が完了。補完項目${planItems.length}件を計画化し、In Progressへ進みます。`],
        [`[CEO OFFICE] '${taskTitle}' 的 Planned 会议已结束，已记录 ${planItems.length} 个改进项并转入 In Progress。`],
      ), lang), taskId);
      if (meetingId) finishMeetingMinutes(meetingId, "completed");
      dismissLeadersFromCeoOffice(taskId, leaders);
      reviewRoundState.delete(lockKey);
      reviewInFlight.delete(lockKey);
      onApproved(planItems);
    } catch (err: any) {
      if (isTaskWorkflowInterrupted(taskId)) {
        if (meetingId) finishMeetingMinutes(meetingId, "failed");
        dismissLeadersFromCeoOffice(taskId, leaders);
        clearTaskWorkflowState(taskId);
        return;
      }
      const msg = err?.message ? String(err.message) : String(err);
      appendTaskLog(taskId, "error", `Planned meeting error: ${msg}`);
      const errLang = resolveLang(taskTitle);
      notifyCeo(pickL(l(
        [`[CEO OFFICE] '${taskTitle}' Planned 회의 처리 중 오류가 발생했습니다: ${msg}`],
        [`[CEO OFFICE] Error while processing planned meeting for '${taskTitle}': ${msg}`],
        [`[CEO OFFICE] '${taskTitle}' のPlanned会議処理中にエラーが発生しました: ${msg}`],
        [`[CEO OFFICE] 处理'${taskTitle}'的 Planned 会议时发生错误：${msg}`],
      ), errLang), taskId);
      if (meetingId) finishMeetingMinutes(meetingId, "failed");
      dismissLeadersFromCeoOffice(taskId, leaders);
      reviewInFlight.delete(lockKey);
    }
  })();
}

// ---------------------------------------------------------------------------
// Run completion handler — enhanced with review flow + CEO reporting
// ---------------------------------------------------------------------------
function handleTaskRunComplete(taskId: string, exitCode: number): void {
  activeProcesses.delete(taskId);
  stopProgressTimer(taskId);

  // Get latest task snapshot early for stop/delete race handling.
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as {
    assigned_agent_id: string | null;
    department_id: string | null;
    title: string;
    description: string | null;
    status: string;
    source_task_id: string | null;
  } | undefined;
  const stopRequested = stopRequestedTasks.has(taskId);
  const stopMode = stopRequestModeByTask.get(taskId);
  stopRequestedTasks.delete(taskId);
  stopRequestModeByTask.delete(taskId);

  // If task was stopped/deleted or no longer in-progress, ignore late close events.
  if (!task || stopRequested || task.status !== "in_progress") {
    if (task) {
      appendTaskLog(
        taskId,
        "system",
        `RUN completion ignored (status=${task.status}, exit=${exitCode}, stop_requested=${stopRequested ? "yes" : "no"}, stop_mode=${stopMode ?? "none"})`,
      );
    }
    const keepWorkflowForResume = stopRequested && stopMode === "pause";
    if (!keepWorkflowForResume) {
      clearTaskWorkflowState(taskId);
    }
    return;
  }

  // Clean up Codex thread→subtask mappings for this task's subtasks
  for (const [tid, itemId] of codexThreadToSubtask) {
    const row = db.prepare("SELECT id FROM subtasks WHERE cli_tool_use_id = ? AND task_id = ?").get(itemId, taskId);
    if (row) codexThreadToSubtask.delete(tid);
  }

  const t = nowMs();
  const logKind = exitCode === 0 ? "completed" : "failed";

  appendTaskLog(taskId, "system", `RUN ${logKind} (exit code: ${exitCode})`);

  // Read log file for result
  const logPath = path.join(logsDir, `${taskId}.log`);
  let result: string | null = null;
  try {
    if (fs.existsSync(logPath)) {
      const raw = fs.readFileSync(logPath, "utf8");
      result = raw.slice(-2000);
    }
  } catch { /* ignore */ }

  if (result) {
    db.prepare("UPDATE tasks SET result = ? WHERE id = ?").run(result, taskId);
  }

  // Auto-complete own-department subtasks on CLI success; foreign ones get delegated
  if (exitCode === 0) {
    const pendingSubtasks = db.prepare(
      "SELECT id, target_department_id FROM subtasks WHERE task_id = ? AND status != 'done'"
    ).all(taskId) as Array<{ id: string; target_department_id: string | null }>;
    if (pendingSubtasks.length > 0) {
      const now = nowMs();
      for (const sub of pendingSubtasks) {
        // Only auto-complete subtasks without a foreign department target
        if (!sub.target_department_id) {
          db.prepare(
            "UPDATE subtasks SET status = 'done', completed_at = ? WHERE id = ?"
          ).run(now, sub.id);
          const updated = db.prepare("SELECT * FROM subtasks WHERE id = ?").get(sub.id);
          broadcast("subtask_update", updated);
        }
      }
    }
    // Trigger delegation for foreign-department subtasks
    processSubtaskDelegations(taskId);
  }

  // Update agent status back to idle
  if (task?.assigned_agent_id) {
    db.prepare(
      "UPDATE agents SET status = 'idle', current_task_id = NULL WHERE id = ?"
    ).run(task.assigned_agent_id);

    if (exitCode === 0) {
      db.prepare(
        "UPDATE agents SET stats_tasks_done = stats_tasks_done + 1, stats_xp = stats_xp + 10 WHERE id = ?"
      ).run(task.assigned_agent_id);
    }

    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(task.assigned_agent_id) as Record<string, unknown> | undefined;
    broadcast("agent_status", agent);
  }

  if (exitCode === 0) {
    // ── SUCCESS: Move to 'review' for team leader check ──
    db.prepare(
      "UPDATE tasks SET status = 'review', updated_at = ? WHERE id = ?"
    ).run(t, taskId);

    appendTaskLog(taskId, "system", "Status → review (team leader review pending)");

    const updatedTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
    broadcast("task_update", updatedTask);
    if (task) notifyTaskStatus(taskId, task.title, "review");

    // Collaboration child tasks should wait in review until parent consolidation meeting.
    // Queue continuation is still triggered so sequential delegation does not stall.
    if (task?.source_task_id) {
      const sourceLang = resolveLang(task.description ?? task.title);
      appendTaskLog(taskId, "system", "Status → review (delegated collaboration task waiting for parent consolidation)");
      notifyCeo(pickL(l(
        [`'${task.title}' 협업 하위 태스크가 Review 대기 상태로 전환되었습니다. 상위 업무의 전체 취합 회의에서 일괄 검토/머지합니다.`],
        [`'${task.title}' collaboration child task is now waiting in Review. It will be consolidated in the parent task's single review/merge meeting.`],
        [`'${task.title}' の協業子タスクはReview待機に入りました。上位タスクの一括レビュー/マージ会議で統合処理します。`],
        [`'${task.title}' 协作子任务已进入 Review 等待。将在上级任务的一次性评审/合并会议中统一处理。`],
      ), sourceLang), taskId);

      const nextDelay = 800 + Math.random() * 600;
      const nextCallback = crossDeptNextCallbacks.get(taskId);
      if (nextCallback) {
        crossDeptNextCallbacks.delete(taskId);
        setTimeout(nextCallback, nextDelay);
      } else {
        recoverCrossDeptQueueAfterMissingCallback(taskId);
      }
      const subtaskNext = subtaskDelegationCallbacks.get(taskId);
      if (subtaskNext) {
        subtaskDelegationCallbacks.delete(taskId);
        setTimeout(subtaskNext, nextDelay);
      }
      return;
    }

    // Notify: task entering review
    if (task) {
      const lang = resolveLang(task.description ?? task.title);
      const leader = findTeamLeader(task.department_id);
      const leaderName = leader
        ? getAgentDisplayName(leader, lang)
        : pickL(l(["팀장"], ["Team Lead"], ["チームリーダー"], ["组长"]), lang);
      notifyCeo(pickL(l(
        [`${leaderName}이(가) '${task.title}' 결과를 검토 중입니다.`],
        [`${leaderName} is reviewing the result for '${task.title}'.`],
        [`${leaderName}が '${task.title}' の成果をレビュー中です。`],
        [`${leaderName} 正在审核 '${task.title}' 的结果。`],
      ), lang), taskId);
    }

    // Schedule team leader review message (2-3s delay)
    setTimeout(() => {
      if (!task) return;
      const leader = findTeamLeader(task.department_id);
      if (!leader) {
        // No team leader — auto-approve
        finishReview(taskId, task.title);
        return;
      }

      // Read the task result and pretty-parse it for the report
      let reportBody = "";
      try {
        const logFile = path.join(logsDir, `${taskId}.log`);
        if (fs.existsSync(logFile)) {
          const raw = fs.readFileSync(logFile, "utf8");
          const pretty = prettyStreamJson(raw);
          // Take the last ~500 chars of the pretty output as summary
          reportBody = pretty.length > 500 ? "..." + pretty.slice(-500) : pretty;
        }
      } catch { /* ignore */ }

      // If worktree exists, include diff summary in the report
      const wtInfo = taskWorktrees.get(taskId);
      let diffSummary = "";
      if (wtInfo) {
        diffSummary = getWorktreeDiffSummary(wtInfo.projectPath, taskId);
        if (diffSummary && diffSummary !== "변경사항 없음") {
          appendTaskLog(taskId, "system", `Worktree diff summary:\n${diffSummary}`);
        }
      }

      // Team leader sends completion report with actual result content + diff
      let reportContent = reportBody
        ? `대표님, '${task.title}' 업무 완료 보고드립니다.\n\n📋 결과:\n${reportBody}`
        : `대표님, '${task.title}' 업무 완료 보고드립니다. 작업이 성공적으로 마무리되었습니다.`;

      const reportLang = resolveLang(task.description ?? task.title);
      const subtaskProgressLabel = pickL(l(
        ["📌 보완/협업 진행 요약"],
        ["📌 Remediation/Collaboration Progress"],
        ["📌 補完/協業 進捗サマリー"],
        ["📌 整改/协作进度摘要"],
      ), reportLang);
      const subtaskProgress = formatTaskSubtaskProgressSummary(taskId, reportLang);
      if (subtaskProgress) {
        reportContent += `\n\n${subtaskProgressLabel}\n${subtaskProgress}`;
      }

      if (diffSummary && diffSummary !== "변경사항 없음" && diffSummary !== "diff 조회 실패") {
        reportContent += `\n\n📝 변경사항 (branch: ${wtInfo?.branchName}):\n${diffSummary}`;
      }

      sendAgentMessage(
        leader,
        reportContent,
        "report",
        "all",
        null,
        taskId,
      );

      // After another 2-3s: team leader approves → move to done
      setTimeout(() => {
        finishReview(taskId, task.title);
      }, 2500);
    }, 2500);

  } else {
    // ── FAILURE: Reset to inbox, team leader reports failure ──
    db.prepare(
      "UPDATE tasks SET status = 'inbox', updated_at = ? WHERE id = ?"
    ).run(t, taskId);

    const updatedTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
    broadcast("task_update", updatedTask);

    // Clean up worktree on failure — failed work shouldn't persist
    const failWtInfo = taskWorktrees.get(taskId);
    if (failWtInfo) {
      cleanupWorktree(failWtInfo.projectPath, taskId);
      appendTaskLog(taskId, "system", "Worktree cleaned up (task failed)");
    }

    if (task) {
      const leader = findTeamLeader(task.department_id);
      if (leader) {
        setTimeout(() => {
          // Read error output for failure report
          let errorBody = "";
          try {
            const logFile = path.join(logsDir, `${taskId}.log`);
            if (fs.existsSync(logFile)) {
              const raw = fs.readFileSync(logFile, "utf8");
              const pretty = prettyStreamJson(raw);
              errorBody = pretty.length > 300 ? "..." + pretty.slice(-300) : pretty;
            }
          } catch { /* ignore */ }

          const failContent = errorBody
            ? `대표님, '${task.title}' 작업에 문제가 발생했습니다 (종료코드: ${exitCode}).\n\n❌ 오류 내용:\n${errorBody}\n\n재배정하거나 업무 내용을 수정한 후 다시 시도해주세요.`
            : `대표님, '${task.title}' 작업에 문제가 발생했습니다 (종료코드: ${exitCode}). 에이전트를 재배정하거나 업무 내용을 수정한 후 다시 시도해주세요.`;

          sendAgentMessage(
            leader,
            failContent,
            "report",
            "all",
            null,
            taskId,
          );
        }, 1500);
      }
      notifyCeo(`'${task.title}' 작업 실패 (exit code: ${exitCode}).`, taskId);
    }

    // Even on failure, trigger next cross-dept cooperation so the queue doesn't stall
    const nextCallback = crossDeptNextCallbacks.get(taskId);
    if (nextCallback) {
      crossDeptNextCallbacks.delete(taskId);
      setTimeout(nextCallback, 3000);
    }

    // Even on failure, trigger next subtask delegation so the queue doesn't stall
    const subtaskNext = subtaskDelegationCallbacks.get(taskId);
    if (subtaskNext) {
      subtaskDelegationCallbacks.delete(taskId);
      setTimeout(subtaskNext, 3000);
    }
  }
}

// Move a reviewed task to 'done'
function finishReview(taskId: string, taskTitle: string): void {
  const lang = resolveLang(taskTitle);
  const currentTask = db.prepare("SELECT status, department_id, source_task_id FROM tasks WHERE id = ?").get(taskId) as {
    status: string;
    department_id: string | null;
    source_task_id: string | null;
  } | undefined;
  if (!currentTask || currentTask.status !== "review") return; // Already moved or cancelled

  const remainingSubtasks = db.prepare(
    "SELECT COUNT(*) as cnt FROM subtasks WHERE task_id = ? AND status != 'done'"
  ).get(taskId) as { cnt: number };
  if (remainingSubtasks.cnt > 0) {
    notifyCeo(pickL(l(
      [`'${taskTitle}' 는 아직 ${remainingSubtasks.cnt}개 서브태스크가 남아 있어 Review 단계에서 대기합니다.`],
      [`'${taskTitle}' is waiting in Review because ${remainingSubtasks.cnt} subtasks are still unfinished.`],
      [`'${taskTitle}' は未完了サブタスクが${remainingSubtasks.cnt}件あるため、Reviewで待機しています。`],
      [`'${taskTitle}' 仍有 ${remainingSubtasks.cnt} 个 SubTask 未完成，当前在 Review 阶段等待。`],
    ), lang), taskId);
    appendTaskLog(taskId, "system", `Review hold: waiting for ${remainingSubtasks.cnt} unfinished subtasks`);
    return;
  }

  // Parent task must wait until all collaboration children reached review(done) checkpoint.
  if (!currentTask.source_task_id) {
    const childProgress = db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) AS review_cnt,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done_cnt
      FROM tasks
      WHERE source_task_id = ?
    `).get(taskId) as { total: number; review_cnt: number | null; done_cnt: number | null } | undefined;
    const childTotal = childProgress?.total ?? 0;
    const childReview = childProgress?.review_cnt ?? 0;
    const childDone = childProgress?.done_cnt ?? 0;
    const childReady = childReview + childDone;
    if (childTotal > 0 && childReady < childTotal) {
      const waiting = childTotal - childReady;
      notifyCeo(pickL(l(
        [`'${taskTitle}' 는 협업 하위 태스크 ${waiting}건이 아직 Review 진입 전이라 전체 팀장회의를 대기합니다.`],
        [`'${taskTitle}' is waiting for ${waiting} collaboration child task(s) to reach review before the single team-lead meeting starts.`],
        [`'${taskTitle}' は協業子タスク${waiting}件がまだReview未到達のため、全体チームリーダー会議を待機しています。`],
        [`'${taskTitle}' 仍有 ${waiting} 个协作子任务尚未进入 Review，当前等待后再开启一次团队负责人会议。`],
      ), lang), taskId);
      appendTaskLog(taskId, "system", `Review hold: waiting for collaboration children to reach review (${childReady}/${childTotal})`);
      return;
    }
  }

  const finalizeApprovedReview = () => {
    const t = nowMs();
    const latestTask = db.prepare("SELECT status, department_id FROM tasks WHERE id = ?").get(taskId) as { status: string; department_id: string | null } | undefined;
    if (!latestTask || latestTask.status !== "review") return;

    // If task has a worktree, merge the branch back before marking done
    const wtInfo = taskWorktrees.get(taskId);
    let mergeNote = "";
    if (wtInfo) {
      const mergeResult = mergeWorktree(wtInfo.projectPath, taskId);

      if (mergeResult.success) {
        appendTaskLog(taskId, "system", `Git merge 완료: ${mergeResult.message}`);
        cleanupWorktree(wtInfo.projectPath, taskId);
        appendTaskLog(taskId, "system", "Worktree cleaned up after successful merge");
        mergeNote = " (병합 완료)";
      } else {
        appendTaskLog(taskId, "system", `Git merge 실패: ${mergeResult.message}`);

        const conflictLeader = findTeamLeader(latestTask.department_id);
        const conflictLeaderName = conflictLeader?.name_ko || conflictLeader?.name || "팀장";
        const conflictFiles = mergeResult.conflicts?.length
          ? `\n충돌 파일: ${mergeResult.conflicts.join(", ")}`
          : "";
        notifyCeo(
          `${conflictLeaderName}: '${taskTitle}' 병합 중 충돌이 발생했습니다. 수동 해결이 필요합니다.${conflictFiles}\n` +
          `브랜치: ${wtInfo.branchName}`,
          taskId,
        );

        mergeNote = " (병합 충돌 - 수동 해결 필요)";
      }
    }

    db.prepare(
      "UPDATE tasks SET status = 'done', completed_at = ?, updated_at = ? WHERE id = ?"
    ).run(t, t, taskId);

    appendTaskLog(taskId, "system", "Status → done (all leaders approved)");
    endTaskExecutionSession(taskId, "task_done");

    const updatedTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
    broadcast("task_update", updatedTask);
    notifyTaskStatus(taskId, taskTitle, "done");

    refreshCliUsageData().then((usage) => broadcast("cli_usage_update", usage)).catch(() => {});

    const leader = findTeamLeader(latestTask.department_id);
    const leaderName = leader
      ? getAgentDisplayName(leader, lang)
      : pickL(l(["팀장"], ["Team Lead"], ["チームリーダー"], ["组长"]), lang);
    const subtaskProgressSummary = formatTaskSubtaskProgressSummary(taskId, lang);
    const progressSuffix = subtaskProgressSummary
      ? `\n${pickL(l(["보완/협업 완료 현황"], ["Remediation/Collaboration completion"], ["補完/協業 完了状況"], ["整改/协作完成情况"]), lang)}\n${subtaskProgressSummary}`
      : "";
    notifyCeo(pickL(l(
      [`${leaderName}: '${taskTitle}' 최종 승인 완료 보고드립니다.${mergeNote}${progressSuffix}`],
      [`${leaderName}: Final approval completed for '${taskTitle}'.${mergeNote}${progressSuffix}`],
      [`${leaderName}: '${taskTitle}' の最終承認が完了しました。${mergeNote}${progressSuffix}`],
      [`${leaderName}：'${taskTitle}' 最终审批已完成。${mergeNote}${progressSuffix}`],
    ), lang), taskId);

    reviewRoundState.delete(taskId);
    reviewInFlight.delete(taskId);

    // Parent final approval is the merge point for collaboration children in review.
    if (!currentTask.source_task_id) {
      const childRows = db.prepare(
        "SELECT id, title FROM tasks WHERE source_task_id = ? AND status = 'review' ORDER BY created_at ASC"
      ).all(taskId) as Array<{ id: string; title: string }>;
      if (childRows.length > 0) {
        appendTaskLog(taskId, "system", `Finalization: closing ${childRows.length} collaboration child task(s) after parent review`);
        for (const child of childRows) {
          finishReview(child.id, child.title);
        }
      }
    }

    const nextCallback = crossDeptNextCallbacks.get(taskId);
    if (nextCallback) {
      crossDeptNextCallbacks.delete(taskId);
      nextCallback();
    } else {
      // pause/resume or restart can drop in-memory callback chain; reconstruct from DB when possible
      recoverCrossDeptQueueAfterMissingCallback(taskId);
    }

    const subtaskNext = subtaskDelegationCallbacks.get(taskId);
    if (subtaskNext) {
      subtaskDelegationCallbacks.delete(taskId);
      subtaskNext();
    }
  };

  if (currentTask.source_task_id) {
    appendTaskLog(taskId, "system", "Review consensus skipped for delegated collaboration task");
    finalizeApprovedReview();
    return;
  }

  startReviewConsensusMeeting(taskId, taskTitle, currentTask.department_id, finalizeApprovedReview);
}

  return {
    crossDeptNextCallbacks,
    subtaskDelegationCallbacks,
    subtaskDelegationDispatchInFlight,
    delegatedTaskToSubtask,
    subtaskDelegationCompletionNoticeSent,
    meetingPresenceUntil,
    meetingSeatIndexByAgent,
    meetingPhaseByAgent,
    meetingTaskIdByAgent,
    meetingReviewDecisionByAgent,
    taskExecutionSessions,
    ensureTaskExecutionSession,
    endTaskExecutionSession,
    isTaskWorkflowInterrupted,
    clearTaskWorkflowState,
    startProgressTimer,
    stopProgressTimer,
    notifyCeo,
    isAgentInMeeting,
    startTaskExecutionForAgent,
    startPlannedApprovalMeeting,
    handleTaskRunComplete,
    finishReview,
  };
}
