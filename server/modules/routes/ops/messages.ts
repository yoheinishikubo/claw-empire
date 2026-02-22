// @ts-nocheck

import type { RuntimeContext } from "../../../types/runtime-context.ts";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { INBOX_WEBHOOK_SECRET, PKG_VERSION } from "../../../config/runtime.ts";
import { notifyTaskStatus, gatewayHttpInvoke } from "../../../gateway/client.ts";
import { BUILTIN_GITHUB_CLIENT_ID, BUILTIN_GOOGLE_CLIENT_ID, BUILTIN_GOOGLE_CLIENT_SECRET, OAUTH_BASE_URL, OAUTH_ENCRYPTION_SECRET, OAUTH_STATE_TTL_MS, appendOAuthQuery, b64url, pkceVerifier, sanitizeOAuthRedirect, encryptSecret, decryptSecret } from "../../../oauth/helpers.ts";
import { safeSecretEquals } from "../../../security/auth.ts";

export function registerOpsMessageRoutes(ctx: RuntimeContext): any {
  // Default policy: enforce latest AGENTS rules.
  // Set ENFORCE_DIRECTIVE_PROJECT_BINDING=0 only for temporary local debugging.
  const ENFORCE_DIRECTIVE_PROJECT_BINDING =
    String(process.env.ENFORCE_DIRECTIVE_PROJECT_BINDING ?? "1").trim() !== "0";
  const __ctx: RuntimeContext = ctx;
  const CLI_STATUS_TTL = __ctx.CLI_STATUS_TTL;
  const CLI_TOOLS = __ctx.CLI_TOOLS;
  const MODELS_CACHE_TTL = __ctx.MODELS_CACHE_TTL;
  const IdempotencyConflictError = __ctx.IdempotencyConflictError;
  const StorageBusyError = __ctx.StorageBusyError;
  const activeProcesses = __ctx.activeProcesses;
  const analyzeSubtaskDepartment = __ctx.analyzeSubtaskDepartment;
  const app = __ctx.app;
  const appendTaskLog = __ctx.appendTaskLog;
  const broadcast = __ctx.broadcast;
  const buildCliFailureMessage = __ctx.buildCliFailureMessage;
  const buildDirectReplyPrompt = __ctx.buildDirectReplyPrompt;
  const buildTaskExecutionPrompt = __ctx.buildTaskExecutionPrompt;
  const cachedCliStatus = __ctx.cachedCliStatus;
  const cachedModels = __ctx.cachedModels;
  const chooseSafeReply = __ctx.chooseSafeReply;
  const cleanupWorktree = __ctx.cleanupWorktree;
  const clearTaskWorkflowState = __ctx.clearTaskWorkflowState;
  const createWorktree = __ctx.createWorktree;
  const crossDeptNextCallbacks = __ctx.crossDeptNextCallbacks;
  const db = __ctx.db;
  const dbPath = __ctx.dbPath;
  const delegatedTaskToSubtask = __ctx.delegatedTaskToSubtask;
  const deptCount = __ctx.deptCount;
  const detectAllCli = __ctx.detectAllCli;
  const endTaskExecutionSession = __ctx.endTaskExecutionSession;
  const ensureClaudeMd = __ctx.ensureClaudeMd;
  const ensureOAuthActiveAccount = __ctx.ensureOAuthActiveAccount;
  const ensureTaskExecutionSession = __ctx.ensureTaskExecutionSession;
  const execWithTimeout = __ctx.execWithTimeout;
  const fetchClaudeUsage = __ctx.fetchClaudeUsage;
  const fetchCodexUsage = __ctx.fetchCodexUsage;
  const fetchGeminiUsage = __ctx.fetchGeminiUsage;
  const finishReview = __ctx.finishReview;
  const firstQueryValue = __ctx.firstQueryValue;
  const generateProjectContext = __ctx.generateProjectContext;
  const getActiveOAuthAccountIds = __ctx.getActiveOAuthAccountIds;
  const getAgentDisplayName = __ctx.getAgentDisplayName;
  const getNextOAuthLabel = __ctx.getNextOAuthLabel;
  const getOAuthAccounts = __ctx.getOAuthAccounts;
  const getPreferredOAuthAccounts = __ctx.getPreferredOAuthAccounts;
  const getProviderModelConfig = __ctx.getProviderModelConfig;
  const getRecentChanges = __ctx.getRecentChanges;
  const getRecentConversationContext = __ctx.getRecentConversationContext;
  const getTaskContinuationContext = __ctx.getTaskContinuationContext;
  const handleTaskRunComplete = __ctx.handleTaskRunComplete;
  const hasExplicitWarningFixRequest = __ctx.hasExplicitWarningFixRequest;
  const hasStructuredJsonLines = __ctx.hasStructuredJsonLines;
  const httpAgentCounter = __ctx.httpAgentCounter;
  const insertMessageWithIdempotency = __ctx.insertMessageWithIdempotency;
  const interruptPidTree = __ctx.interruptPidTree;
  const isTaskWorkflowInterrupted = __ctx.isTaskWorkflowInterrupted;
  const killPidTree = __ctx.killPidTree;
  const launchHttpAgent = __ctx.launchHttpAgent;
  const logsDir = __ctx.logsDir;
  const meetingPhaseByAgent = __ctx.meetingPhaseByAgent;
  const meetingPresenceUntil = __ctx.meetingPresenceUntil;
  const meetingReviewDecisionByAgent = __ctx.meetingReviewDecisionByAgent;
  const meetingSeatIndexByAgent = __ctx.meetingSeatIndexByAgent;
  const meetingTaskIdByAgent = __ctx.meetingTaskIdByAgent;
  const mergeWorktree = __ctx.mergeWorktree;
  const normalizeOAuthProvider = __ctx.normalizeOAuthProvider;
  const notifyCeo = __ctx.notifyCeo;
  const nowMs = __ctx.nowMs;
  const randomDelay = __ctx.randomDelay;
  const recordAcceptedIngressAuditOrRollback = __ctx.recordAcceptedIngressAuditOrRollback;
  const recordMessageIngressAuditOr503 = __ctx.recordMessageIngressAuditOr503;
  const refreshGoogleToken = __ctx.refreshGoogleToken;
  const removeActiveOAuthAccount = __ctx.removeActiveOAuthAccount;
  const resolveMessageIdempotencyKey = __ctx.resolveMessageIdempotencyKey;
  const rollbackTaskWorktree = __ctx.rollbackTaskWorktree;
  const runAgentOneShot = __ctx.runAgentOneShot;
  const seedApprovedPlanSubtasks = __ctx.seedApprovedPlanSubtasks;
  const setActiveOAuthAccount = __ctx.setActiveOAuthAccount;
  const setOAuthActiveAccounts = __ctx.setOAuthActiveAccounts;
  const spawnCliAgent = __ctx.spawnCliAgent;
  const startPlannedApprovalMeeting = __ctx.startPlannedApprovalMeeting;
  const startProgressTimer = __ctx.startProgressTimer;
  const startTaskExecutionForAgent = __ctx.startTaskExecutionForAgent;
  const stopProgressTimer = __ctx.stopProgressTimer;
  const stopRequestModeByTask = __ctx.stopRequestModeByTask;
  const stopRequestedTasks = __ctx.stopRequestedTasks;
  const subtaskDelegationCallbacks = __ctx.subtaskDelegationCallbacks;
  const subtaskDelegationCompletionNoticeSent = __ctx.subtaskDelegationCompletionNoticeSent;
  const subtaskDelegationDispatchInFlight = __ctx.subtaskDelegationDispatchInFlight;
  const taskExecutionSessions = __ctx.taskExecutionSessions;
  const taskWorktrees = __ctx.taskWorktrees;
  const withSqliteBusyRetry = __ctx.withSqliteBusyRetry;
  const DEPT_KEYWORDS = __ctx.DEPT_KEYWORDS;
  const detectLang = __ctx.detectLang;
  const detectTargetDepartments = __ctx.detectTargetDepartments;
  const findTeamLeader = __ctx.findTeamLeader;
  const formatTaskSubtaskProgressSummary = __ctx.formatTaskSubtaskProgressSummary;
  const getDeptName = __ctx.getDeptName;
  const getDeptRoleConstraint = __ctx.getDeptRoleConstraint;
  const getPreferredLanguage = __ctx.getPreferredLanguage;
  const getRoleLabel = __ctx.getRoleLabel;
  const l = __ctx.l;
  const pickL = __ctx.pickL;
  const processSubtaskDelegations = __ctx.processSubtaskDelegations;
  const recoverCrossDeptQueueAfterMissingCallback = __ctx.recoverCrossDeptQueueAfterMissingCallback;
  const resolveLang = __ctx.resolveLang;
  const resolveProjectPath = __ctx.resolveProjectPath;
  const sendAgentMessage = __ctx.sendAgentMessage;
  const reconcileCrossDeptSubtasks = __ctx.reconcileCrossDeptSubtasks;
  const buildHealthPayload = __ctx.buildHealthPayload;
  const ROLE_PRIORITY = __ctx.ROLE_PRIORITY;
  const ROLE_LABEL = __ctx.ROLE_LABEL;
  const pickRandom = __ctx.pickRandom;
  const SUPPORTED_LANGS = __ctx.SUPPORTED_LANGS;
  const isLang = __ctx.isLang;
  const readSettingString = __ctx.readSettingString;
  const getFlairs = __ctx.getFlairs;
  const ROLE_LABEL_L10N = __ctx.ROLE_LABEL_L10N;
  const classifyIntent = __ctx.classifyIntent;
  const generateChatReply = __ctx.generateChatReply;
  const generateAnnouncementReply = __ctx.generateAnnouncementReply;
  const scheduleAnnouncementReplies = __ctx.scheduleAnnouncementReplies;
  const normalizeTextField = __ctx.normalizeTextField;
  const analyzeDirectivePolicy = __ctx.analyzeDirectivePolicy;
  const shouldExecuteDirectiveDelegation = __ctx.shouldExecuteDirectiveDelegation;
  const detectMentions = __ctx.detectMentions;
  const handleMentionDelegation = __ctx.handleMentionDelegation;
  const findBestSubordinate = __ctx.findBestSubordinate;
  const REMEDIATION_SUBTASK_PREFIXES = __ctx.REMEDIATION_SUBTASK_PREFIXES;
  const COLLABORATION_SUBTASK_PREFIXES = __ctx.COLLABORATION_SUBTASK_PREFIXES;
  const hasAnyPrefix = __ctx.hasAnyPrefix;
  const getTaskSubtaskProgressSummary = __ctx.getTaskSubtaskProgressSummary;
  const groupSubtasksByTargetDepartment = __ctx.groupSubtasksByTargetDepartment;
  const getSubtaskDeptExecutionPriority = __ctx.getSubtaskDeptExecutionPriority;
  const orderSubtaskQueuesByDepartment = __ctx.orderSubtaskQueuesByDepartment;
  const buildSubtaskDelegationPrompt = __ctx.buildSubtaskDelegationPrompt;
  const hasOpenForeignSubtasks = __ctx.hasOpenForeignSubtasks;
  const maybeNotifyAllSubtasksComplete = __ctx.maybeNotifyAllSubtasksComplete;
  const delegateSubtaskBatch = __ctx.delegateSubtaskBatch;
  const finalizeDelegatedSubtasks = __ctx.finalizeDelegatedSubtasks;
  const handleSubtaskDelegationComplete = __ctx.handleSubtaskDelegationComplete;
  const handleSubtaskDelegationBatchComplete = __ctx.handleSubtaskDelegationBatchComplete;
  const deriveSubtaskStateFromDelegatedTask = __ctx.deriveSubtaskStateFromDelegatedTask;
  const pickUnlinkedTargetSubtask = __ctx.pickUnlinkedTargetSubtask;
  const syncSubtaskWithDelegatedTask = __ctx.syncSubtaskWithDelegatedTask;
  const linkCrossDeptTaskToParentSubtask = __ctx.linkCrossDeptTaskToParentSubtask;
  const startCrossDeptCooperation = __ctx.startCrossDeptCooperation;
  const detectProjectPath = __ctx.detectProjectPath;
  const getLatestKnownProjectPath = __ctx.getLatestKnownProjectPath;
  const getDefaultProjectRoot = __ctx.getDefaultProjectRoot;
  const resolveDirectiveProjectPath = __ctx.resolveDirectiveProjectPath;
  const stripReportRequestPrefix = __ctx.stripReportRequestPrefix;
  const detectReportOutputFormat = __ctx.detectReportOutputFormat;
  const pickPlanningReportAssignee = __ctx.pickPlanningReportAssignee;
  const handleReportRequest = __ctx.handleReportRequest;
  const handleTaskDelegation = __ctx.handleTaskDelegation;
  const shouldTreatDirectChatAsTask = __ctx.shouldTreatDirectChatAsTask;
  const createDirectAgentTaskAndRun = __ctx.createDirectAgentTaskAndRun;
  const scheduleAgentReply = __ctx.scheduleAgentReply;

  const buildAgentUpgradeRequiredPayload = () => {
    const repoRoot = process.cwd();
    const installerPaths = {
      mac_linux: path.join(repoRoot, "scripts", "openclaw-setup.sh"),
      windows_powershell: path.join(repoRoot, "scripts", "openclaw-setup.ps1"),
      agents_template: path.join(repoRoot, "templates", "AGENTS-empire.md"),
    };
    const agentsTargetPath = path.join(os.homedir(), ".openclaw", "workspace", "AGENTS.md");
    const installCommands = {
      mac_linux: "bash scripts/openclaw-setup.sh",
      windows_powershell: "powershell -ExecutionPolicy Bypass -File .\\scripts\\openclaw-setup.ps1",
      agents_only: "pnpm setup -- --agents-path ~/.openclaw/workspace/AGENTS.md",
    };
    const absoluteInstallCommands = {
      mac_linux: `bash "${installerPaths.mac_linux}"`,
      windows_powershell: `powershell -ExecutionPolicy Bypass -File "${installerPaths.windows_powershell}"`,
      agents_only: `pnpm setup -- --agents-path "${agentsTargetPath}"`,
    };
    const recommendedInstallCommand = process.platform === "win32"
      ? absoluteInstallCommands.windows_powershell
      : absoluteInstallCommands.mac_linux;

    return {
      error: "agent_upgrade_required",
      reason: "install_first",
      message: `OpenClaw AGENTS is outdated (HTTP 428). Install path: ${installerPaths.mac_linux} (or ${installerPaths.windows_powershell}). Target AGENTS path: ${agentsTargetPath}. Should I install it now?`,
      message_ko: `OpenClaw AGENTS가 구버전입니다(HTTP 428). 설치 경로: ${installerPaths.mac_linux} (또는 ${installerPaths.windows_powershell}), 대상 AGENTS: ${agentsTargetPath}. 지금 제가 직접 설치해드릴까요?`,
      required_agent_rules_version: 2,
      required_action: "install_latest_agents_rules",
      installer_files: [
        "scripts/openclaw-setup.sh",
        "scripts/openclaw-setup.ps1",
        "templates/AGENTS-empire.md",
      ],
      installer_absolute_paths: installerPaths,
      agents_target_path: agentsTargetPath,
      install_commands: installCommands,
      install_commands_absolute: absoluteInstallCommands,
      recommended_install_command: recommendedInstallCommand,
      user_prompt: {
        ko: `OpenClaw AGENTS 규칙이 구버전입니다. 설치 파일: ${installerPaths.mac_linux} / ${installerPaths.windows_powershell}, 대상 AGENTS: ${agentsTargetPath}. 지금 제가 직접 설치해드릴까요? (예/아니오)`,
        en: `OpenClaw AGENTS rules are outdated. Installer files: ${installerPaths.mac_linux} / ${installerPaths.windows_powershell}, target AGENTS: ${agentsTargetPath}. Should I install it now? (yes/no)`,
      },
      next_step_ko: "사용자가 동의하면 설치 스크립트를 실행한 뒤 같은 directive를 1회 재시도하세요.",
      next_step_en: "If the user agrees, run installer script and retry the same directive once.",
    };
  };

  type DecisionInboxRouteItem = {
    id: string;
    kind: "project_review_ready" | "task_timeout_resume";
    created_at: number;
    summary: string;
    project_id: string | null;
    project_name: string | null;
    project_path: string | null;
    task_id: string | null;
    task_title: string | null;
    options: Array<{ number: number; action: string; label: string }>;
  };

  const PROJECT_REVIEW_TASK_SELECTED_LOG_PREFIX = "Decision inbox: project review task option selected";

  function getProjectReviewTaskChoices(projectId: string): Array<{
    id: string;
    title: string;
    updated_at: number;
    selected: boolean;
  }> {
    const selectionPattern = `${PROJECT_REVIEW_TASK_SELECTED_LOG_PREFIX}%`;
    const rows = db.prepare(`
      SELECT
        t.id,
        t.title,
        t.updated_at,
        (
          SELECT MAX(tl.created_at)
          FROM task_logs tl
          WHERE tl.task_id = t.id
            AND tl.kind = 'system'
            AND tl.message LIKE ?
        ) AS selected_at
      FROM tasks t
      WHERE t.project_id = ?
        AND t.status = 'review'
        AND t.source_task_id IS NULL
      ORDER BY t.updated_at ASC, t.created_at ASC
    `).all(selectionPattern, projectId) as Array<{
      id: string;
      title: string;
      updated_at: number;
      selected_at: number | null;
    }>;
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      updated_at: row.updated_at,
      selected: (row.selected_at ?? 0) >= (row.updated_at ?? 0),
    }));
  }

  function buildProjectReviewDecisionItems(): DecisionInboxRouteItem[] {
    const lang = getPreferredLanguage();
    const t = (ko: string, en: string, ja: string, zh: string) => pickL(l([ko], [en], [ja], [zh]), lang);

    const rows = db.prepare(`
      SELECT
        p.id AS project_id,
        p.name AS project_name,
        p.project_path AS project_path,
        MAX(t.updated_at) AS updated_at,
        SUM(CASE WHEN t.status NOT IN ('done', 'cancelled') THEN 1 ELSE 0 END) AS active_total,
        SUM(CASE WHEN t.status NOT IN ('done', 'cancelled') AND t.status = 'review' THEN 1 ELSE 0 END) AS active_review,
        SUM(CASE WHEN t.status = 'review' AND t.source_task_id IS NULL THEN 1 ELSE 0 END) AS root_review_total
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.project_id IS NOT NULL
      GROUP BY p.id, p.name, p.project_path
    `).all() as Array<{
      project_id: string;
      project_name: string | null;
      project_path: string | null;
      updated_at: number | null;
      active_total: number | null;
      active_review: number | null;
      root_review_total: number | null;
    }>;

    const out: DecisionInboxRouteItem[] = [];
    for (const row of rows) {
      const activeTotal = row.active_total ?? 0;
      const activeReview = row.active_review ?? 0;
      const rootReviewTotal = row.root_review_total ?? 0;
      if (activeTotal <= 0) continue;
      if (activeTotal !== activeReview) continue;
      if (rootReviewTotal <= 0) continue;

      const inProgressMeeting = db.prepare(`
        SELECT COUNT(*) AS cnt
        FROM meeting_minutes mm
        JOIN tasks t ON t.id = mm.task_id
        WHERE t.project_id = ?
          AND t.status = 'review'
          AND t.source_task_id IS NULL
          AND mm.meeting_type = 'review'
          AND mm.status = 'in_progress'
      `).get(row.project_id) as { cnt: number } | undefined;
      if ((inProgressMeeting?.cnt ?? 0) > 0) continue;

      const reviewTaskChoices = getProjectReviewTaskChoices(row.project_id);
      if (reviewTaskChoices.length <= 0) continue;
      const requiresRepresentativeSelection = reviewTaskChoices.length > 1;
      const pendingChoices = requiresRepresentativeSelection
        ? reviewTaskChoices.filter((task) => !task.selected)
        : [];
      const selectedCount = reviewTaskChoices.length - pendingChoices.length;
      const decisionTargetTotal = reviewTaskChoices.length;
      const projectName = (row.project_name || row.project_id).trim();
      const taskProgressLine = t(
        `항목 선택 진행: ${selectedCount}/${reviewTaskChoices.length}`,
        `Selection progress: ${selectedCount}/${reviewTaskChoices.length}`,
        `選択進捗: ${selectedCount}/${reviewTaskChoices.length}`,
        `选择进度: ${selectedCount}/${reviewTaskChoices.length}`,
      );
      const continueExistingLabel = t(
        "기존 작업 이어서 진행",
        "Continue Existing Work",
        "既存作業を継続",
        "继续现有工作",
      );
      const pendingList = pendingChoices.length > 0
        ? (pendingChoices.length === 1
          ? `- ${continueExistingLabel}`
          : pendingChoices.slice(0, 6).map((task) => `- ${task.title}`).join("\n"))
        : t(
          "모든 활성 항목 선택이 완료되었습니다.",
          "All active items are selected.",
          "すべてのアクティブ項目の選択が完了しました。",
          "所有活跃项已完成选择。",
        );
      const summary = pendingChoices.length > 0
        ? t(
          `프로젝트 '${projectName}'의 활성 항목 ${activeTotal}건이 모두 Review 상태입니다.\n대표 선택 대상 ${decisionTargetTotal}건을 먼저 선택해 주세요.\n${taskProgressLine}\n${pendingList}`,
          `Project '${projectName}' has all ${activeTotal} active items in Review.\nSelect the ${decisionTargetTotal} target item(s) first.\n${taskProgressLine}\n${pendingList}`,
          `プロジェクト'${projectName}'のアクティブ項目${activeTotal}件はすべてReview状態です。\n代表者の選択対象${decisionTargetTotal}件を先に選択してください。\n${taskProgressLine}\n${pendingList}`,
          `项目'${projectName}'的 ${activeTotal} 个活跃项已全部进入 Review。\n请先选择代表决策目标 ${decisionTargetTotal} 项。\n${taskProgressLine}\n${pendingList}`,
        )
        : (requiresRepresentativeSelection
          ? t(
            `프로젝트 '${projectName}'의 활성 항목 ${activeTotal}건이 모두 Review 상태입니다.\n대표 선택 대상 ${decisionTargetTotal}건 선택이 완료되었습니다.\n이제 팀장 회의를 진행할 수 있습니다.`,
            `Project '${projectName}' has all ${activeTotal} active items in Review.\nSelection for ${decisionTargetTotal} target item(s) is complete.\nYou can now run the team-lead review meeting.`,
            `プロジェクト'${projectName}'のアクティブ項目${activeTotal}件はすべてReview状態です。\n代表者の選択対象${decisionTargetTotal}件の選択が完了しました。\nチームリーダー会議を進行できます。`,
            `项目'${projectName}'的 ${activeTotal} 个活跃项已全部进入 Review。\n代表决策目标 ${decisionTargetTotal} 项已选择完成。\n现在可以进行组长评审会议。`,
          )
          : t(
            `프로젝트 '${projectName}'의 활성 항목 ${activeTotal}건이 모두 Review 상태입니다.\n선택 단계가 필요하지 않아 바로 팀장 회의를 진행할 수 있습니다.`,
            `Project '${projectName}' has all ${activeTotal} active items in Review.\nNo selection step is required, so you can run the team-lead review meeting now.`,
            `プロジェクト'${projectName}'のアクティブ項目${activeTotal}件はすべてReview状態です。\n選択ステップは不要なため、すぐにチームリーダー会議を進行できます。`,
            `项目'${projectName}'的 ${activeTotal} 个活跃项已全部进入 Review。\n无需选择步骤，现在可直接进行组长评审会议。`,
          ));
      const options = pendingChoices.length > 0
        ? [
          ...pendingChoices.map((task, index) => ({
            number: index + 1,
            action: `approve_task_review:${task.id}`,
            label: pendingChoices.length === 1
              ? continueExistingLabel
              : t(
                `항목 선택: ${task.title}`,
                `Select Item: ${task.title}`,
                `項目選択: ${task.title}`,
                `选择项: ${task.title}`,
              ),
          })),
          {
            number: pendingChoices.length + 1,
            action: "add_followup_request",
            label: t(
              "추가요청 입력",
              "Add Follow-up Request",
              "追加要請を入力",
              "输入追加请求",
            ),
          },
        ]
        : [
          {
            number: 1,
            action: "start_project_review",
            label: t(
              "팀장 회의 진행",
              "Start Team-Lead Meeting",
              "チームリーダー会議を進行",
              "启动组长评审会议",
            ),
          },
          {
            number: 2,
            action: "add_followup_request",
            label: t(
              "추가요청 입력",
              "Add Follow-up Request",
              "追加要請を入力",
              "输入追加请求",
            ),
          },
        ];

      out.push({
        id: `project-review-ready:${row.project_id}`,
        kind: "project_review_ready",
        created_at: row.updated_at ?? nowMs(),
        summary,
        project_id: row.project_id,
        project_name: row.project_name,
        project_path: row.project_path,
        task_id: null,
        task_title: null,
        options,
      });
    }

    return out;
  }

  function buildTimeoutResumeDecisionItems(): DecisionInboxRouteItem[] {
    const lang = getPreferredLanguage();
    const t = (ko: string, en: string, ja: string, zh: string) => pickL(l([ko], [en], [ja], [zh]), lang);

    const rows = db.prepare(`
      SELECT
        t.id AS task_id,
        t.title AS task_title,
        t.project_id AS project_id,
        p.name AS project_name,
        t.project_path AS project_path,
        t.updated_at AS updated_at,
        (
          SELECT MAX(tl.created_at)
          FROM task_logs tl
          WHERE tl.task_id = t.id
            AND tl.message LIKE '%RUN TIMEOUT%'
        ) AS timeout_at
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.status = 'inbox'
        AND EXISTS (
          SELECT 1
          FROM task_logs tl
          WHERE tl.task_id = t.id
            AND tl.message LIKE '%RUN TIMEOUT%'
        )
      ORDER BY COALESCE(timeout_at, t.updated_at) DESC, t.updated_at DESC
      LIMIT 200
    `).all() as Array<{
      task_id: string;
      task_title: string;
      project_id: string | null;
      project_name: string | null;
      project_path: string | null;
      updated_at: number | null;
      timeout_at: number | null;
    }>;

    return rows.map((row) => ({
      id: `task-timeout-resume:${row.task_id}`,
      kind: "task_timeout_resume",
      created_at: row.timeout_at ?? row.updated_at ?? nowMs(),
      summary: t(
        `작업 '${row.task_title}' 이(가) timeout 후 Inbox로 이동했습니다. 이어서 진행할까요?`,
        `Task '${row.task_title}' moved to Inbox after timeout. Continue from where it left off?`,
        `タスク'${row.task_title}'はタイムアウト後にInboxへ移動しました。続行しますか？`,
        `任务'${row.task_title}'超时后已移至 Inbox，是否继续执行？`,
      ),
      project_id: row.project_id,
      project_name: row.project_name,
      project_path: row.project_path,
      task_id: row.task_id,
      task_title: row.task_title,
      options: [
        {
          number: 1,
          action: "resume_timeout_task",
          label: t(
            "이어서 진행 (재개)",
            "Resume Task",
            "続行する（再開）",
            "继续执行（恢复）",
          ),
        },
        {
          number: 2,
          action: "keep_inbox",
          label: t(
            "Inbox 유지",
            "Keep in Inbox",
            "Inboxで保留",
            "保留在 Inbox",
          ),
        },
      ],
    }));
  }

  function getDecisionInboxItems(): DecisionInboxRouteItem[] {
    const items = [
      ...buildProjectReviewDecisionItems(),
      ...buildTimeoutResumeDecisionItems(),
    ];
    items.sort((a, b) => b.created_at - a.created_at);
    return items;
  }

// ---------------------------------------------------------------------------
// Messages / Chat
// ---------------------------------------------------------------------------
app.get("/api/decision-inbox", (_req, res) => {
  const items = getDecisionInboxItems();
  res.json({ items });
});

app.post("/api/decision-inbox/:id/reply", (req, res) => {
  const decisionId = String(req.params.id || "");
  const optionNumber = Number(req.body?.option_number ?? req.body?.optionNumber ?? req.body?.option);
  if (!Number.isFinite(optionNumber)) {
    return res.status(400).json({ error: "option_number_required" });
  }

  const currentItem = getDecisionInboxItems().find((item) => item.id === decisionId);
  if (!currentItem) {
    return res.status(404).json({ error: "decision_not_found" });
  }
  const selectedOption = currentItem.options.find((option) => option.number === optionNumber);
  if (!selectedOption) {
    return res.status(400).json({ error: "option_not_found", option_number: optionNumber });
  }

  if (currentItem.kind === "project_review_ready") {
    const projectId = currentItem.project_id;
    if (!projectId) return res.status(400).json({ error: "project_id_required" });
    const selectedAction = selectedOption.action;

    if (selectedAction === "keep_waiting") {
      return res.json({
        ok: true,
        resolved: false,
        kind: "project_review_ready",
        action: "keep_waiting",
      });
    }

    if (selectedAction.startsWith("approve_task_review:")) {
      const selectedTaskId = selectedAction.slice("approve_task_review:".length).trim();
      if (!selectedTaskId) return res.status(400).json({ error: "task_id_required" });
      const targetTask = db.prepare(`
        SELECT id, title
        FROM tasks
        WHERE id = ?
          AND project_id = ?
          AND status = 'review'
          AND source_task_id IS NULL
      `).get(selectedTaskId, projectId) as { id: string; title: string } | undefined;
      if (!targetTask) return res.status(404).json({ error: "project_review_task_not_found" });

      appendTaskLog(
        targetTask.id,
        "system",
        `${PROJECT_REVIEW_TASK_SELECTED_LOG_PREFIX} (project_id=${projectId}, option=${optionNumber})`,
      );
      const remaining = getProjectReviewTaskChoices(projectId).filter((task) => !task.selected).length;
      return res.json({
        ok: true,
        resolved: false,
        kind: "project_review_ready",
        action: "approve_task_review",
        task_id: targetTask.id,
        pending_task_choices: remaining,
      });
    }

    if (selectedAction === "add_followup_request") {
      const note = normalizeTextField(req.body?.note);
      if (!note) {
        return res.status(400).json({ error: "followup_note_required" });
      }
      const lang = getPreferredLanguage();
      const followupTitlePrefix = pickL(
        l(["[의사결정 추가요청]"], ["[Decision Follow-up]"], ["[意思決定追加要請]"], ["[决策追加请求]"]),
        lang,
      );
      const targetTaskIdInput = normalizeTextField(req.body?.target_task_id);
      const targetTask = targetTaskIdInput
        ? db.prepare(`
            SELECT id, title, status, assigned_agent_id, department_id
            FROM tasks
            WHERE id = ?
              AND project_id = ?
              AND status = 'review'
              AND source_task_id IS NULL
          `).get(targetTaskIdInput, projectId) as {
            id: string;
            title: string;
            status: string;
            assigned_agent_id: string | null;
            department_id: string | null;
          } | undefined
        : undefined;
      const fallbackTargetTask = db.prepare(`
        SELECT id, title, status, assigned_agent_id, department_id
        FROM tasks
        WHERE project_id = ?
          AND status = 'review'
          AND source_task_id IS NULL
        ORDER BY updated_at ASC, created_at ASC
        LIMIT 1
      `).get(projectId) as {
        id: string;
        title: string;
        status: string;
        assigned_agent_id: string | null;
        department_id: string | null;
      } | undefined;
      const resolvedTarget = targetTask ?? fallbackTargetTask;
      if (!resolvedTarget) {
        return res.status(404).json({ error: "project_review_task_not_found" });
      }

      const subtaskId = randomUUID();
      const createdAt = nowMs();
      const noteCompact = note.replace(/\s+/g, " ").trim();
      const noteTitle = noteCompact.length > 72 ? `${noteCompact.slice(0, 69).trimEnd()}...` : noteCompact;
      const title = `${followupTitlePrefix} ${noteTitle}`;
      db.prepare(`
        INSERT INTO subtasks (id, task_id, title, description, status, created_at)
        VALUES (?, ?, ?, ?, 'pending', ?)
      `).run(subtaskId, resolvedTarget.id, title, note, createdAt);

      appendTaskLog(
        resolvedTarget.id,
        "system",
        `Decision inbox follow-up request added: ${note}`,
      );
      const insertedSubtask = db.prepare("SELECT * FROM subtasks WHERE id = ?").get(subtaskId);
      broadcast("subtask_update", insertedSubtask);

      // Branch into supplement round: review -> pending -> in_progress (if executable).
      const branchTs = nowMs();
      db.prepare("UPDATE tasks SET status = 'pending', updated_at = ? WHERE id = ?")
        .run(branchTs, resolvedTarget.id);
      const pendingTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(resolvedTarget.id);
      broadcast("task_update", pendingTask);
      appendTaskLog(
        resolvedTarget.id,
        "system",
        "Decision inbox: supplement round opened (review -> pending)",
      );

      let supplementStarted = false;
      let supplementReason = "queued";
      const assignedAgentId = resolvedTarget.assigned_agent_id;
      if (!assignedAgentId) {
        supplementReason = "no_assignee";
        appendTaskLog(
          resolvedTarget.id,
          "system",
          "Decision inbox: supplement round pending (no assigned agent)",
        );
      } else {
        const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(assignedAgentId) as AgentRow | undefined;
        if (!agent) {
          supplementReason = "agent_not_found";
          appendTaskLog(
            resolvedTarget.id,
            "system",
            "Decision inbox: supplement round pending (assigned agent not found)",
          );
        } else if (agent.status === "offline") {
          supplementReason = "agent_offline";
          appendTaskLog(
            resolvedTarget.id,
            "system",
            "Decision inbox: supplement round pending (assigned agent offline)",
          );
        } else if (activeProcesses.has(resolvedTarget.id)) {
          supplementReason = "already_running";
        } else if (
          agent.status === "working"
          && agent.current_task_id
          && agent.current_task_id !== resolvedTarget.id
          && activeProcesses.has(agent.current_task_id)
        ) {
          supplementReason = "agent_busy";
          appendTaskLog(
            resolvedTarget.id,
            "system",
            `Decision inbox: supplement round pending (agent busy on ${agent.current_task_id})`,
          );
        } else {
          const deptId = agent.department_id ?? resolvedTarget.department_id ?? null;
          const deptName = deptId ? getDeptName(deptId) : "Unassigned";
          appendTaskLog(
            resolvedTarget.id,
            "system",
            "Decision inbox: supplement round execution started",
          );
          startTaskExecutionForAgent(resolvedTarget.id, agent, deptId, deptName);
          supplementStarted = true;
          supplementReason = "started";
        }
      }

      return res.json({
        ok: true,
        resolved: false,
        kind: "project_review_ready",
        action: "add_followup_request",
        task_id: resolvedTarget.id,
        subtask_id: subtaskId,
        supplement_round_started: supplementStarted,
        supplement_round_reason: supplementReason,
      });
    }

    if (selectedAction === "start_project_review") {
      const reviewTaskChoices = getProjectReviewTaskChoices(projectId);
      const requiresRepresentativeSelection = reviewTaskChoices.length > 1;
      const pendingChoices = requiresRepresentativeSelection
        ? reviewTaskChoices.filter((task) => !task.selected)
        : [];
      if (requiresRepresentativeSelection && pendingChoices.length > 0) {
        return res.status(409).json({
          error: "project_task_options_pending",
          pending_task_choices: pendingChoices.map((task) => ({ id: task.id, title: task.title })),
        });
      }

      const readiness = db.prepare(`
        SELECT
          SUM(CASE WHEN status NOT IN ('done', 'cancelled') THEN 1 ELSE 0 END) AS active_total,
          SUM(CASE WHEN status NOT IN ('done', 'cancelled') AND status = 'review' THEN 1 ELSE 0 END) AS active_review
        FROM tasks
        WHERE project_id = ?
      `).get(projectId) as { active_total: number | null; active_review: number | null } | undefined;
      const activeTotal = readiness?.active_total ?? 0;
      const activeReview = readiness?.active_review ?? 0;
      if (!(activeTotal > 0 && activeTotal === activeReview)) {
        return res.status(409).json({
          error: "project_not_ready_for_review_meeting",
          active_total: activeTotal,
          active_review: activeReview,
        });
      }

      const reviewTasks = db.prepare(`
        SELECT id, title
        FROM tasks
        WHERE project_id = ?
          AND status = 'review'
          AND source_task_id IS NULL
        ORDER BY updated_at ASC
      `).all(projectId) as Array<{ id: string; title: string }>;

      for (const task of reviewTasks) {
        appendTaskLog(task.id, "system", "Decision inbox: project-level review meeting approved by CEO");
        finishReview(task.id, task.title, {
          bypassProjectDecisionGate: true,
          trigger: "decision_inbox",
        });
      }

      return res.json({
        ok: true,
        resolved: true,
        kind: "project_review_ready",
        action: "start_project_review",
        started_task_ids: reviewTasks.map((task) => task.id),
      });
    }

    return res.status(400).json({ error: "unsupported_project_action", action: selectedAction });
  }

  if (currentItem.kind === "task_timeout_resume") {
    const taskId = currentItem.task_id;
    if (!taskId) return res.status(400).json({ error: "task_id_required" });
    const selectedAction = selectedOption.action;

    if (selectedAction === "keep_inbox") {
      return res.json({
        ok: true,
        resolved: false,
        kind: "task_timeout_resume",
        action: "keep_inbox",
      });
    }
    if (selectedAction !== "resume_timeout_task") {
      return res.status(400).json({ error: "unsupported_timeout_action", action: selectedAction });
    }

    const task = db.prepare(`
      SELECT id, title, description, status, assigned_agent_id, department_id
      FROM tasks
      WHERE id = ?
    `).get(taskId) as {
      id: string;
      title: string;
      description: string | null;
      status: string;
      assigned_agent_id: string | null;
      department_id: string | null;
    } | undefined;
    if (!task) return res.status(404).json({ error: "task_not_found" });
    if (task.status !== "inbox") {
      return res.status(409).json({ error: "task_not_in_inbox", status: task.status });
    }
    if (!task.assigned_agent_id) {
      return res.status(409).json({ error: "task_has_no_assigned_agent" });
    }

    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(task.assigned_agent_id) as AgentRow | undefined;
    if (!agent) return res.status(404).json({ error: "agent_not_found" });

    if (activeProcesses.has(taskId)) {
      return res.status(409).json({ error: "already_running" });
    }
    if (
      agent.status === "working"
      && agent.current_task_id
      && agent.current_task_id !== taskId
      && activeProcesses.has(agent.current_task_id)
    ) {
      return res.status(409).json({
        error: "agent_busy",
        current_task_id: agent.current_task_id,
      });
    }

    const deptId = agent.department_id ?? task.department_id ?? null;
    const deptName = deptId ? getDeptName(deptId) : "Unassigned";
    appendTaskLog(taskId, "system", "Decision inbox: timeout resume approved by CEO");
    startTaskExecutionForAgent(taskId, agent, deptId, deptName);

    return res.json({
      ok: true,
      resolved: true,
      kind: "task_timeout_resume",
      action: "resume_timeout_task",
      task_id: taskId,
    });
  }

  return res.status(400).json({ error: "unknown_decision_id" });
});

app.get("/api/messages", (req, res) => {
  const receiverType = firstQueryValue(req.query.receiver_type);
  const receiverId = firstQueryValue(req.query.receiver_id);
  const limitRaw = firstQueryValue(req.query.limit);
  const limit = Math.min(Math.max(Number(limitRaw) || 50, 1), 500);

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (receiverType && receiverId) {
    // Conversation with a specific agent: show messages TO and FROM that agent
    conditions.push(
      "((receiver_type = ? AND receiver_id = ?) OR (sender_type = 'agent' AND sender_id = ?) OR receiver_type = 'all')"
    );
    params.push(receiverType, receiverId, receiverId);
  } else if (receiverType) {
    conditions.push("receiver_type = ?");
    params.push(receiverType);
  } else if (receiverId) {
    conditions.push("(receiver_id = ? OR receiver_type = 'all')");
    params.push(receiverId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(limit);

  const messages = db.prepare(`
    SELECT m.*,
      a.name AS sender_name,
      a.avatar_emoji AS sender_avatar
    FROM messages m
    LEFT JOIN agents a ON m.sender_type = 'agent' AND m.sender_id = a.id
    ${where}
    ORDER BY m.created_at DESC
    LIMIT ?
  `).all(...(params as SQLInputValue[]));

  res.json({ messages: messages.reverse() }); // return in chronological order
});

app.post("/api/messages", async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const idempotencyKey = resolveMessageIdempotencyKey(req, body, "api.messages");
  const content = body.content;
  if (!content || typeof content !== "string") {
    if (!recordMessageIngressAuditOr503(res, {
      endpoint: "/api/messages",
      req,
      body,
      idempotencyKey,
      outcome: "validation_error",
      statusCode: 400,
      detail: "content_required",
    })) return;
    return res.status(400).json({ error: "content_required" });
  }

  const senderType = typeof body.sender_type === "string" ? body.sender_type : "ceo";
  const senderId = typeof body.sender_id === "string" ? body.sender_id : null;
  const receiverType = typeof body.receiver_type === "string" ? body.receiver_type : "all";
  const receiverId = typeof body.receiver_id === "string" ? body.receiver_id : null;
  const messageType = typeof body.message_type === "string" ? body.message_type : "chat";
  const taskId = typeof body.task_id === "string" ? body.task_id : null;
  const projectId = normalizeTextField(body.project_id);
  const projectPath = normalizeTextField(body.project_path);
  const projectContext = normalizeTextField(body.project_context);

  let storedMessage: StoredMessage;
  let created: boolean;
  try {
    ({ message: storedMessage, created } = await insertMessageWithIdempotency({
      senderType,
      senderId,
      receiverType,
      receiverId,
      content,
      messageType,
      taskId,
      idempotencyKey,
    }));
  } catch (err) {
    if (err instanceof IdempotencyConflictError) {
      if (!recordMessageIngressAuditOr503(res, {
        endpoint: "/api/messages",
        req,
        body,
        idempotencyKey,
        outcome: "idempotency_conflict",
        statusCode: 409,
        detail: "payload_mismatch",
      })) return;
      return res.status(409).json({ error: "idempotency_conflict", idempotency_key: err.key });
    }
    if (err instanceof StorageBusyError) {
      if (!recordMessageIngressAuditOr503(res, {
        endpoint: "/api/messages",
        req,
        body,
        idempotencyKey,
        outcome: "storage_busy",
        statusCode: 503,
        detail: `operation=${err.operation}, attempts=${err.attempts}`,
      })) return;
      return res.status(503).json({ error: "storage_busy", retryable: true, operation: err.operation });
    }
    throw err;
  }

  const msg = { ...storedMessage };

  if (!created) {
    if (!recordMessageIngressAuditOr503(res, {
      endpoint: "/api/messages",
      req,
      body,
      idempotencyKey,
      outcome: "duplicate",
      statusCode: 200,
      messageId: msg.id,
      detail: "idempotent_replay",
    })) return;
    return res.json({ ok: true, message: msg, duplicate: true });
  }

  if (!(await recordAcceptedIngressAuditOrRollback(
    res,
    {
      endpoint: "/api/messages",
      req,
      body,
      idempotencyKey,
      outcome: "accepted",
      statusCode: 200,
      detail: "created",
    },
    msg.id,
  ))) return;
  broadcast("new_message", msg);

  // Schedule agent auto-reply when CEO messages an agent
  if (senderType === "ceo" && receiverType === "agent" && receiverId) {
    if (messageType === "report") {
      const handled = handleReportRequest(receiverId, content);
      if (!handled) {
        scheduleAgentReply(receiverId, content, messageType, {
          projectId,
          projectPath,
          projectContext,
        });
      }
      return res.json({ ok: true, message: msg });
    }

    scheduleAgentReply(receiverId, content, messageType, {
      projectId,
      projectPath,
      projectContext,
    });

    // Check for @mentions to other departments/agents
    const mentions = detectMentions(content);
    if (mentions.deptIds.length > 0 || mentions.agentIds.length > 0) {
      const senderAgent = db.prepare("SELECT * FROM agents WHERE id = ?").get(receiverId) as AgentRow | undefined;
      if (senderAgent) {
        const lang = resolveLang(content);
        const mentionDelay = 4000 + Math.random() * 2000; // After the main delegation starts
        setTimeout(() => {
          // Handle department mentions
          for (const deptId of mentions.deptIds) {
            if (deptId === senderAgent.department_id) continue; // Skip own department
            handleMentionDelegation(senderAgent, deptId, content, lang);
          }
          // Handle agent mentions — find their department and delegate there
          for (const agentId of mentions.agentIds) {
            const mentioned = db.prepare("SELECT * FROM agents WHERE id = ?").get(agentId) as AgentRow | undefined;
            if (mentioned && mentioned.department_id && mentioned.department_id !== senderAgent.department_id) {
              if (!mentions.deptIds.includes(mentioned.department_id)) {
                handleMentionDelegation(senderAgent, mentioned.department_id, content, lang);
              }
            }
          }
        }, mentionDelay);
      }
    }
  }

  res.json({ ok: true, message: msg });
});

app.post("/api/announcements", async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const idempotencyKey = resolveMessageIdempotencyKey(req, body, "api.announcements");
  const content = body.content;
  if (!content || typeof content !== "string") {
    if (!recordMessageIngressAuditOr503(res, {
      endpoint: "/api/announcements",
      req,
      body,
      idempotencyKey,
      outcome: "validation_error",
      statusCode: 400,
      detail: "content_required",
    })) return;
    return res.status(400).json({ error: "content_required" });
  }

  let storedMessage: StoredMessage;
  let created: boolean;
  try {
    ({ message: storedMessage, created } = await insertMessageWithIdempotency({
      senderType: "ceo",
      senderId: null,
      receiverType: "all",
      receiverId: null,
      content,
      messageType: "announcement",
      idempotencyKey,
    }));
  } catch (err) {
    if (err instanceof IdempotencyConflictError) {
      if (!recordMessageIngressAuditOr503(res, {
        endpoint: "/api/announcements",
        req,
        body,
        idempotencyKey,
        outcome: "idempotency_conflict",
        statusCode: 409,
        detail: "payload_mismatch",
      })) return;
      return res.status(409).json({ error: "idempotency_conflict", idempotency_key: err.key });
    }
    if (err instanceof StorageBusyError) {
      if (!recordMessageIngressAuditOr503(res, {
        endpoint: "/api/announcements",
        req,
        body,
        idempotencyKey,
        outcome: "storage_busy",
        statusCode: 503,
        detail: `operation=${err.operation}, attempts=${err.attempts}`,
      })) return;
      return res.status(503).json({ error: "storage_busy", retryable: true, operation: err.operation });
    }
    throw err;
  }
  const msg = { ...storedMessage };

  if (!created) {
    if (!recordMessageIngressAuditOr503(res, {
      endpoint: "/api/announcements",
      req,
      body,
      idempotencyKey,
      outcome: "duplicate",
      statusCode: 200,
      messageId: msg.id,
      detail: "idempotent_replay",
    })) return;
    return res.json({ ok: true, message: msg, duplicate: true });
  }

  if (!(await recordAcceptedIngressAuditOrRollback(
    res,
    {
      endpoint: "/api/announcements",
      req,
      body,
      idempotencyKey,
      outcome: "accepted",
      statusCode: 200,
      detail: "created",
    },
    msg.id,
  ))) return;
  broadcast("announcement", msg);

  // Team leaders respond to announcements with staggered delays
  scheduleAnnouncementReplies(content);

  // Check for @mentions in announcements — trigger delegation
  const mentions = detectMentions(content);
  if (mentions.deptIds.length > 0 || mentions.agentIds.length > 0) {
    const mentionDelay = 5000 + Math.random() * 2000;
    setTimeout(() => {
      const processedDepts = new Set<string>();

      for (const deptId of mentions.deptIds) {
        if (processedDepts.has(deptId)) continue;
        processedDepts.add(deptId);
        const leader = findTeamLeader(deptId);
        if (leader) {
          handleTaskDelegation(leader, content, "");
        }
      }

      for (const agentId of mentions.agentIds) {
        const mentioned = db.prepare("SELECT * FROM agents WHERE id = ?").get(agentId) as AgentRow | undefined;
        if (mentioned?.department_id && !processedDepts.has(mentioned.department_id)) {
          processedDepts.add(mentioned.department_id);
          const leader = findTeamLeader(mentioned.department_id);
          if (leader) {
            handleTaskDelegation(leader, content, "");
          }
        }
      }
    }, mentionDelay);
  }

  res.json({ ok: true, message: msg });
});

// ── Directives (CEO ! command) ──────────────────────────────────────────────
app.post("/api/directives", async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const idempotencyKey = resolveMessageIdempotencyKey(req, body, "api.directives");
  const content = body.content;
  let explicitProjectId = normalizeTextField(body.project_id);
  let explicitProjectPath = normalizeTextField(body.project_path);
  let explicitProjectContext = normalizeTextField(body.project_context);
  if (!content || typeof content !== "string") {
    if (!recordMessageIngressAuditOr503(res, {
      endpoint: "/api/directives",
      req,
      body,
      idempotencyKey,
      outcome: "validation_error",
      statusCode: 400,
      detail: "content_required",
    })) return;
    return res.status(400).json({ error: "content_required" });
  }

  if (ENFORCE_DIRECTIVE_PROJECT_BINDING && !explicitProjectId) {
    if (!recordMessageIngressAuditOr503(res, {
      endpoint: "/api/directives",
      req,
      body,
      idempotencyKey,
      outcome: "validation_error",
      statusCode: 428,
      detail: "agent_upgrade_required:install_first",
    })) return;
    return res.status(428).json(buildAgentUpgradeRequiredPayload());
  }

  let storedMessage: StoredMessage;
  let created: boolean;
  try {
    ({ message: storedMessage, created } = await insertMessageWithIdempotency({
      senderType: "ceo",
      senderId: null,
      receiverType: "all",
      receiverId: null,
      content,
      messageType: "directive",
      idempotencyKey,
    }));
  } catch (err) {
    if (err instanceof IdempotencyConflictError) {
      if (!recordMessageIngressAuditOr503(res, {
        endpoint: "/api/directives",
        req,
        body,
        idempotencyKey,
        outcome: "idempotency_conflict",
        statusCode: 409,
        detail: "payload_mismatch",
      })) return;
      return res.status(409).json({ error: "idempotency_conflict", idempotency_key: err.key });
    }
    if (err instanceof StorageBusyError) {
      if (!recordMessageIngressAuditOr503(res, {
        endpoint: "/api/directives",
        req,
        body,
        idempotencyKey,
        outcome: "storage_busy",
        statusCode: 503,
        detail: `operation=${err.operation}, attempts=${err.attempts}`,
      })) return;
      return res.status(503).json({ error: "storage_busy", retryable: true, operation: err.operation });
    }
    throw err;
  }
  const msg = { ...storedMessage };

  if (!created) {
    if (!recordMessageIngressAuditOr503(res, {
      endpoint: "/api/directives",
      req,
      body,
      idempotencyKey,
      outcome: "duplicate",
      statusCode: 200,
      messageId: msg.id,
      detail: "idempotent_replay",
    })) return;
    return res.json({ ok: true, message: msg, duplicate: true });
  }

  if (!(await recordAcceptedIngressAuditOrRollback(
    res,
    {
      endpoint: "/api/directives",
      req,
      body,
      idempotencyKey,
      outcome: "accepted",
      statusCode: 200,
      detail: "created",
    },
    msg.id,
  ))) return;
  // 2. Broadcast to all
  broadcast("announcement", msg);

  // 3. Team leaders respond
  scheduleAnnouncementReplies(content);
  const directivePolicy = analyzeDirectivePolicy(content);
  const explicitSkip = body.skipPlannedMeeting === true;
  const shouldDelegate = shouldExecuteDirectiveDelegation(directivePolicy, explicitSkip);
  const delegationOptions: DelegationOptions = {
    skipPlannedMeeting: explicitSkip || directivePolicy.skipPlannedMeeting,
    skipPlanSubtasks: explicitSkip || directivePolicy.skipPlanSubtasks,
    projectId: explicitProjectId,
    projectPath: explicitProjectPath,
    projectContext: explicitProjectContext,
  };

  if (shouldDelegate) {
    // 4. Auto-delegate to planning team leader
    const planningLeader = findTeamLeader("planning");
    if (planningLeader) {
      const delegationDelay = 3000 + Math.random() * 2000;
      setTimeout(() => {
        handleTaskDelegation(planningLeader, content, "", delegationOptions);
      }, delegationDelay);
    }

    // 5. Additional @mentions trigger delegation to other departments
    const mentions = detectMentions(content);
    if (mentions.deptIds.length > 0 || mentions.agentIds.length > 0) {
      const mentionDelay = 5000 + Math.random() * 2000;
      setTimeout(() => {
        const processedDepts = new Set<string>(["planning"]);

        for (const deptId of mentions.deptIds) {
          if (processedDepts.has(deptId)) continue;
          processedDepts.add(deptId);
          const leader = findTeamLeader(deptId);
          if (leader) {
            handleTaskDelegation(leader, content, "", delegationOptions);
          }
        }

        for (const agentId of mentions.agentIds) {
          const mentioned = db.prepare("SELECT * FROM agents WHERE id = ?").get(agentId) as AgentRow | undefined;
          if (mentioned?.department_id && !processedDepts.has(mentioned.department_id)) {
            processedDepts.add(mentioned.department_id);
            const leader = findTeamLeader(mentioned.department_id);
            if (leader) {
              handleTaskDelegation(leader, content, "", delegationOptions);
            }
          }
        }
      }, mentionDelay);
    }
  }

  res.json({ ok: true, message: msg });
});

// ── Inbound webhook (Telegram / external) ───────────────────────────────────
app.post("/api/inbox", async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const idempotencyKey = resolveMessageIdempotencyKey(req, body, "api.inbox");
  if (!INBOX_WEBHOOK_SECRET) {
    if (!recordMessageIngressAuditOr503(res, {
      endpoint: "/api/inbox",
      req,
      body,
      idempotencyKey,
      outcome: "validation_error",
      statusCode: 503,
      detail: "inbox_webhook_secret_not_configured",
    })) return;
    return res.status(503).json({ error: "inbox_webhook_secret_not_configured" });
  }
  const providedSecret = req.header("x-inbox-secret") ?? "";
  if (!safeSecretEquals(providedSecret, INBOX_WEBHOOK_SECRET)) {
    if (!recordMessageIngressAuditOr503(res, {
      endpoint: "/api/inbox",
      req,
      body,
      idempotencyKey,
      outcome: "validation_error",
      statusCode: 401,
      detail: "invalid_webhook_secret",
    })) return;
    return res.status(401).json({ error: "unauthorized" });
  }

  const text = body.text;
  if (!text || typeof text !== "string" || !text.trim()) {
    if (!recordMessageIngressAuditOr503(res, {
      endpoint: "/api/inbox",
      req,
      body,
      idempotencyKey,
      outcome: "validation_error",
      statusCode: 400,
      detail: "text_required",
    })) return;
    return res.status(400).json({ error: "text_required" });
  }

  const raw = text.trimStart();
  const isDirective = raw.startsWith("$");
  const content = isDirective ? raw.slice(1).trimStart() : raw;
  let inboxProjectId = normalizeTextField(body.project_id);
  let inboxProjectPath = normalizeTextField(body.project_path);
  let inboxProjectContext = normalizeTextField(body.project_context);
  if (!content) {
    if (!recordMessageIngressAuditOr503(res, {
      endpoint: "/api/inbox",
      req,
      body,
      idempotencyKey,
      outcome: "validation_error",
      statusCode: 400,
      detail: "empty_content",
    })) return;
    return res.status(400).json({ error: "empty_content" });
  }

  if (ENFORCE_DIRECTIVE_PROJECT_BINDING && isDirective && !inboxProjectId) {
    if (!recordMessageIngressAuditOr503(res, {
      endpoint: "/api/inbox",
      req,
      body,
      idempotencyKey,
      outcome: "validation_error",
      statusCode: 428,
      detail: "agent_upgrade_required:install_first",
    })) return;
    return res.status(428).json(buildAgentUpgradeRequiredPayload());
  }

  const messageType = isDirective ? "directive" : "announcement";
  let storedMessage: StoredMessage;
  let created: boolean;
  try {
    ({ message: storedMessage, created } = await insertMessageWithIdempotency({
      senderType: "ceo",
      senderId: null,
      receiverType: "all",
      receiverId: null,
      content,
      messageType,
      idempotencyKey,
    }));
  } catch (err) {
    if (err instanceof IdempotencyConflictError) {
      if (!recordMessageIngressAuditOr503(res, {
        endpoint: "/api/inbox",
        req,
        body,
        idempotencyKey,
        outcome: "idempotency_conflict",
        statusCode: 409,
        detail: "payload_mismatch",
      })) return;
      return res.status(409).json({ error: "idempotency_conflict", idempotency_key: err.key });
    }
    if (err instanceof StorageBusyError) {
      if (!recordMessageIngressAuditOr503(res, {
        endpoint: "/api/inbox",
        req,
        body,
        idempotencyKey,
        outcome: "storage_busy",
        statusCode: 503,
        detail: `operation=${err.operation}, attempts=${err.attempts}`,
      })) return;
      return res.status(503).json({ error: "storage_busy", retryable: true, operation: err.operation });
    }
    throw err;
  }
  const msg = { ...storedMessage };

  if (!created) {
    if (!recordMessageIngressAuditOr503(res, {
      endpoint: "/api/inbox",
      req,
      body,
      idempotencyKey,
      outcome: "duplicate",
      statusCode: 200,
      messageId: msg.id,
      detail: "idempotent_replay",
    })) return;
    return res.json({ ok: true, id: msg.id, directive: isDirective, duplicate: true });
  }

  if (!(await recordAcceptedIngressAuditOrRollback(
    res,
    {
      endpoint: "/api/inbox",
      req,
      body,
      idempotencyKey,
      outcome: "accepted",
      statusCode: 200,
      detail: isDirective ? "created:directive" : "created:announcement",
    },
    msg.id,
  ))) return;
  // Broadcast
  broadcast("announcement", msg);

  // Team leaders respond
  scheduleAnnouncementReplies(content);
  const directivePolicy = isDirective ? analyzeDirectivePolicy(content) : null;
  const inboxExplicitSkip = body.skipPlannedMeeting === true;
  const shouldDelegateDirective = isDirective && directivePolicy
    ? shouldExecuteDirectiveDelegation(directivePolicy, inboxExplicitSkip)
    : false;
  const directiveDelegationOptions: DelegationOptions = {
    skipPlannedMeeting: inboxExplicitSkip || !!directivePolicy?.skipPlannedMeeting,
    skipPlanSubtasks: inboxExplicitSkip || !!directivePolicy?.skipPlanSubtasks,
    projectId: inboxProjectId,
    projectPath: inboxProjectPath,
    projectContext: inboxProjectContext,
  };

  if (shouldDelegateDirective) {
    // Auto-delegate to planning team leader
    const planningLeader = findTeamLeader("planning");
    if (planningLeader) {
      const delegationDelay = 3000 + Math.random() * 2000;
      setTimeout(() => {
        handleTaskDelegation(planningLeader, content, "", directiveDelegationOptions);
      }, delegationDelay);
    }
  }

  // Handle @mentions
  const mentions = detectMentions(content);
  const shouldHandleMentions = !isDirective || shouldDelegateDirective;
  if (shouldHandleMentions && (mentions.deptIds.length > 0 || mentions.agentIds.length > 0)) {
    const mentionDelay = 5000 + Math.random() * 2000;
    setTimeout(() => {
      const processedDepts = new Set<string>(isDirective ? ["planning"] : []);

      for (const deptId of mentions.deptIds) {
        if (processedDepts.has(deptId)) continue;
        processedDepts.add(deptId);
        const leader = findTeamLeader(deptId);
        if (leader) {
          handleTaskDelegation(
            leader,
            content,
            "",
            isDirective ? directiveDelegationOptions : {},
          );
        }
      }

      for (const agentId of mentions.agentIds) {
        const mentioned = db.prepare("SELECT * FROM agents WHERE id = ?").get(agentId) as AgentRow | undefined;
        if (mentioned?.department_id && !processedDepts.has(mentioned.department_id)) {
          processedDepts.add(mentioned.department_id);
          const leader = findTeamLeader(mentioned.department_id);
          if (leader) {
            handleTaskDelegation(
              leader,
              content,
              "",
              isDirective ? directiveDelegationOptions : {},
            );
          }
        }
      }
    }, mentionDelay);
  }

  res.json({ ok: true, id: msg.id, directive: isDirective });
});

// Delete conversation messages
app.delete("/api/messages", (req, res) => {
  const agentId = firstQueryValue(req.query.agent_id);
  const scope = firstQueryValue(req.query.scope) || "conversation"; // "conversation" or "all"

  if (scope === "all") {
    // Delete all messages (announcements + conversations)
    const result = db.prepare("DELETE FROM messages").run();
    broadcast("messages_cleared", { scope: "all" });
    return res.json({ ok: true, deleted: result.changes });
  }

  if (agentId) {
    // Delete messages for a specific agent conversation + announcements shown in that chat
    const result = db.prepare(
      `DELETE FROM messages WHERE
        (sender_type = 'ceo' AND receiver_type = 'agent' AND receiver_id = ?)
        OR (sender_type = 'agent' AND sender_id = ?)
        OR receiver_type = 'all'
        OR message_type = 'announcement'`
    ).run(agentId, agentId);
    broadcast("messages_cleared", { scope: "agent", agent_id: agentId });
    return res.json({ ok: true, deleted: result.changes });
  }

  // Delete only announcements/broadcasts
  const result = db.prepare(
    "DELETE FROM messages WHERE receiver_type = 'all' OR message_type = 'announcement'"
  ).run();
  broadcast("messages_cleared", { scope: "announcements" });
  res.json({ ok: true, deleted: result.changes });
});


  return {};
}
