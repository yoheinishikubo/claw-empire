import { DatabaseSync } from "node:sqlite";
import { describe, expect, it, vi } from "vitest";
import { createReviewFinalizeTools } from "./review-finalize-tools.ts";

function createDb(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      department_id TEXT,
      source_task_id TEXT,
      project_id TEXT,
      workflow_pack_key TEXT,
      project_path TEXT,
      created_at INTEGER DEFAULT 0,
      updated_at INTEGER DEFAULT 0
    );

    CREATE TABLE subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT,
      status TEXT NOT NULL,
      delegated_task_id TEXT,
      blocked_reason TEXT,
      completed_at INTEGER
    );
  `);
  return db;
}

describe("review finalize video gate", () => {
  it("video_preprod task는 final.mp4 확인 전 승인/머지를 진행하지 않는다", () => {
    const db = createDb();
    try {
      const taskId = "task-video-1";
      db.prepare(
        `
          INSERT INTO tasks (id, title, status, department_id, source_task_id, project_id, workflow_pack_key, project_path, created_at, updated_at)
          VALUES (?, ?, 'review', 'planning', NULL, 'project-1', 'video_preprod', ?, 1, 1)
        `,
      ).run(taskId, "Video intro", "/tmp/non-existing-video-root");

      const appendTaskLog = vi.fn();
      const notifyCeo = vi.fn();
      const startReviewConsensusMeeting = vi.fn();
      const mergeWorktree = vi.fn(() => ({ success: true, message: "merged" }));

      const tools = createReviewFinalizeTools({
        db,
        nowMs: () => 1700000000000,
        broadcast: vi.fn(),
        appendTaskLog,
        getPreferredLanguage: () => "ko",
        pickL: (pool: any) => (Array.isArray(pool?.ko) ? pool.ko[0] : ""),
        l: (ko: string[], en: string[], ja: string[], zh: string[]) => ({ ko, en, ja, zh }),
        resolveLang: () => "ko",
        getProjectReviewGateSnapshot: () => ({ activeReview: 1, activeTotal: 1, ready: true }),
        projectReviewGateNotifiedAt: new Map<string, number>(),
        notifyCeo,
        taskWorktrees: new Map<string, { worktreePath: string; projectPath: string; branchName: string }>(),
        mergeToDevAndCreatePR: vi.fn(() => ({ success: true, message: "pr created" })),
        mergeWorktree,
        cleanupWorktree: vi.fn(),
        findTeamLeader: vi.fn(() => null),
        getAgentDisplayName: vi.fn(() => "팀장"),
        setTaskCreationAuditCompletion: vi.fn(),
        endTaskExecutionSession: vi.fn(),
        notifyTaskStatus: vi.fn(),
        refreshCliUsageData: vi.fn(async () => ({})),
        shouldDeferTaskReportUntilPlanningArchive: vi.fn(() => false),
        emitTaskReportEvent: vi.fn(),
        formatTaskSubtaskProgressSummary: vi.fn(() => ""),
        reviewRoundState: new Map<string, number>(),
        reviewInFlight: new Set<string>(),
        archivePlanningConsolidatedReport: vi.fn(async () => undefined),
        crossDeptNextCallbacks: new Map<string, () => void>(),
        recoverCrossDeptQueueAfterMissingCallback: vi.fn(),
        subtaskDelegationCallbacks: new Map<string, () => void>(),
        startReviewConsensusMeeting,
      } as any);

      tools.finishReview(taskId, "Video intro", {
        bypassProjectDecisionGate: true,
        trigger: "test",
      });

      const updated = db.prepare("SELECT status FROM tasks WHERE id = ?").get(taskId) as { status: string };
      expect(updated.status).toBe("review");
      expect(startReviewConsensusMeeting).not.toHaveBeenCalled();
      expect(mergeWorktree).not.toHaveBeenCalled();
      expect(appendTaskLog).toHaveBeenCalledWith(
        taskId,
        "system",
        expect.stringContaining("Review hold: video artifact gate blocked approval"),
      );
      expect(notifyCeo).toHaveBeenCalled();
    } finally {
      db.close();
    }
  });
});
