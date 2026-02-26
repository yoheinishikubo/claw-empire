import type { RuntimeContext } from "../../../../types/runtime-context.ts";
import type { AgentRow } from "../../shared/types.ts";
import type { DecisionInboxRouteItem } from "./decision-inbox/types.ts";
import { handleProjectReviewDecisionReply } from "./decision-inbox/project-review-reply.ts";
import { handleReviewRoundDecisionReply } from "./decision-inbox/review-round-reply.ts";
import { handleTimeoutResumeDecisionReply } from "./decision-inbox/timeout-reply.ts";
import { createProjectAndTimeoutDecisionItems } from "./decision-inbox/project-timeout-items.ts";
import { createReviewRoundDecisionItems } from "./decision-inbox/review-round-items.ts";
import { createDecisionStateHelpers } from "./decision-inbox/state-helpers.ts";
import { createProjectReviewPlanningHelpers } from "./decision-inbox/project-review-planning.ts";
import { createReviewRoundPlanningHelpers } from "./decision-inbox/review-round-planning.ts";

export function registerDecisionInboxRoutes(ctx: RuntimeContext): void {
  const __ctx: RuntimeContext = ctx;
  const {
    app,
    db,
    nowMs,
    activeProcesses,
    appendTaskLog,
    broadcast,
    finishReview,
    getAgentDisplayName,
    getDeptName,
    getPreferredLanguage,
    l,
    pickL,
    findTeamLeader,
    normalizeTextField,
    processSubtaskDelegations,
    resolveLang,
    runAgentOneShot,
    scheduleNextReviewRound,
    seedReviewRevisionSubtasks,
    startTaskExecutionForAgent,
    chooseSafeReply,
  } = __ctx;

  const PROJECT_REVIEW_TASK_SELECTED_LOG_PREFIX = "Decision inbox: project review task option selected";
  const REVIEW_DECISION_RESOLVED_LOG_PREFIX = "Decision inbox: review decision resolved";

  const {
    buildProjectReviewSnapshotHash,
    getProjectReviewDecisionState,
    upsertProjectReviewDecisionState,
    buildReviewRoundSnapshotHash,
    getReviewRoundDecisionState,
    upsertReviewRoundDecisionState,
    recordProjectReviewDecisionEvent,
  } = createDecisionStateHelpers({ db, nowMs });

  const { formatPlannerSummaryForDisplay, resolvePlanningLeadMeta, queueProjectReviewPlanningConsolidation } =
    createProjectReviewPlanningHelpers({
      db,
      nowMs,
      l,
      pickL,
      findTeamLeader,
      runAgentOneShot,
      chooseSafeReply,
      getAgentDisplayName,
      getProjectReviewDecisionState,
      recordProjectReviewDecisionEvent,
    });

  const { queueReviewRoundPlanningConsolidation } = createReviewRoundPlanningHelpers({
    db,
    nowMs,
    l,
    pickL,
    findTeamLeader,
    runAgentOneShot,
    chooseSafeReply,
    getAgentDisplayName,
    getReviewRoundDecisionState,
    formatPlannerSummaryForDisplay,
    recordProjectReviewDecisionEvent,
    getProjectReviewDecisionState,
  });

  const { getProjectReviewTaskChoices, buildProjectReviewDecisionItems, buildTimeoutResumeDecisionItems } =
    createProjectAndTimeoutDecisionItems({
      db,
      nowMs,
      getPreferredLanguage,
      pickL,
      l,
      buildProjectReviewSnapshotHash,
      getProjectReviewDecisionState,
      upsertProjectReviewDecisionState,
      resolvePlanningLeadMeta,
      formatPlannerSummaryForDisplay,
      queueProjectReviewPlanningConsolidation,
      PROJECT_REVIEW_TASK_SELECTED_LOG_PREFIX,
    });

  const { getReviewDecisionFallbackLabel, getReviewDecisionNotes, buildReviewRoundDecisionItems } =
    createReviewRoundDecisionItems({
      db,
      nowMs,
      getPreferredLanguage,
      pickL,
      l,
      buildReviewRoundSnapshotHash,
      getReviewRoundDecisionState,
      upsertReviewRoundDecisionState,
      resolvePlanningLeadMeta,
      formatPlannerSummaryForDisplay,
      queueReviewRoundPlanningConsolidation,
    });

  function openSupplementRound(
    taskId: string,
    assignedAgentId: string | null,
    fallbackDepartmentId: string | null,
    logPrefix = "Decision inbox",
  ): { started: boolean; reason: string } {
    const branchTs = nowMs();
    db.prepare("UPDATE tasks SET status = 'pending', updated_at = ? WHERE id = ?").run(branchTs, taskId);
    const pendingTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
    broadcast("task_update", pendingTask);
    appendTaskLog(taskId, "system", `${logPrefix}: supplement round opened (review -> pending)`);

    if (!assignedAgentId) {
      appendTaskLog(taskId, "system", `${logPrefix}: supplement round pending (no assigned agent)`);
      return { started: false, reason: "no_assignee" };
    }

    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(assignedAgentId) as AgentRow | undefined;
    if (!agent) {
      appendTaskLog(taskId, "system", `${logPrefix}: supplement round pending (assigned agent not found)`);
      return { started: false, reason: "agent_not_found" };
    }
    if (agent.status === "offline") {
      appendTaskLog(taskId, "system", `${logPrefix}: supplement round pending (assigned agent offline)`);
      return { started: false, reason: "agent_offline" };
    }
    if (activeProcesses.has(taskId)) {
      return { started: false, reason: "already_running" };
    }
    if (
      agent.status === "working" &&
      agent.current_task_id &&
      agent.current_task_id !== taskId &&
      activeProcesses.has(agent.current_task_id)
    ) {
      appendTaskLog(
        taskId,
        "system",
        `${logPrefix}: supplement round pending (agent busy on ${agent.current_task_id})`,
      );
      return { started: false, reason: "agent_busy" };
    }

    const deptId = agent.department_id ?? fallbackDepartmentId ?? null;
    const deptName = deptId ? getDeptName(deptId) : "Unassigned";
    appendTaskLog(taskId, "system", `${logPrefix}: supplement round execution started`);
    startTaskExecutionForAgent(taskId, agent, deptId, deptName);
    return { started: true, reason: "started" };
  }

  function getDecisionInboxItems(): DecisionInboxRouteItem[] {
    const items = [
      ...buildProjectReviewDecisionItems(),
      ...buildReviewRoundDecisionItems(),
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
      if (currentItem.options.length <= 0) {
        return res.status(409).json({
          error: "decision_options_not_ready",
          kind: currentItem.kind,
        });
      }
      return res.status(400).json({ error: "option_not_found", option_number: optionNumber });
    }

    if (
      handleProjectReviewDecisionReply({
        req,
        res,
        currentItem,
        selectedOption,
        optionNumber,
        deps: {
          db,
          appendTaskLog,
          nowMs,
          normalizeTextField,
          getPreferredLanguage,
          pickL,
          l,
          broadcast,
          finishReview,
          getProjectReviewDecisionState,
          recordProjectReviewDecisionEvent,
          getProjectReviewTaskChoices,
          openSupplementRound,
          PROJECT_REVIEW_TASK_SELECTED_LOG_PREFIX,
        },
      })
    )
      return;

    if (
      handleReviewRoundDecisionReply({
        req,
        res,
        currentItem,
        selectedOption,
        optionNumber,
        deps: {
          db,
          l,
          pickL,
          nowMs,
          resolveLang,
          normalizeTextField,
          appendTaskLog,
          processSubtaskDelegations,
          seedReviewRevisionSubtasks,
          scheduleNextReviewRound,
          getProjectReviewDecisionState,
          getReviewDecisionNotes,
          getReviewDecisionFallbackLabel,
          recordProjectReviewDecisionEvent,
          openSupplementRound,
          REVIEW_DECISION_RESOLVED_LOG_PREFIX,
        },
      })
    )
      return;

    if (
      handleTimeoutResumeDecisionReply({
        res,
        currentItem,
        selectedOption,
        deps: {
          db,
          activeProcesses,
          getDeptName,
          appendTaskLog,
          startTaskExecutionForAgent,
        },
      })
    )
      return;

    return res.status(400).json({ error: "unknown_decision_id" });
  });
}
