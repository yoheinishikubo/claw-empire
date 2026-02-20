import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SkillsLibrary from "./SkillsLibrary";
import type { Agent } from "../types";
import { startSkillLearning } from "../api";

vi.mock("../api", () => ({
  getSkills: vi.fn().mockResolvedValue([
    {
      rank: 1,
      name: "superpowers:using-superpowers",
      repo: "superpowers/using-superpowers",
      installs: 1000,
      skillId: "superpowers:using-superpowers",
    },
  ]),
  getSkillDetail: vi.fn(),
  getSkillLearningJob: vi.fn(),
  startSkillLearning: vi.fn(),
}));

const startSkillLearningMock = vi.mocked(startSkillLearning);

const TEST_AGENT: Agent = {
  id: "a1",
  name: "Atlas",
  name_ko: "아틀라스",
  department_id: "dep-1",
  role: "team_leader",
  cli_provider: "claude",
  avatar_emoji: "🤖",
  personality: null,
  status: "idle",
  current_task_id: null,
  stats_tasks_done: 0,
  stats_xp: 0,
  created_at: Date.now(),
};

describe("SkillsLibrary learning modal ESC close", () => {
  it("closes the learning modal when Escape is pressed", async () => {
    render(<SkillsLibrary agents={[TEST_AGENT]} />);

    await screen.findByRole("button", { name: "Learn" });

    fireEvent.click(screen.getByRole("button", { name: "Learn" }));

    expect(
      screen.getByRole("heading", { name: "Skill Learning Squad" })
    ).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Skill Learning Squad" })
      ).not.toBeInTheDocument();
    });
  });

  it("keeps the learning modal open on Escape while learning is running", async () => {
    startSkillLearningMock.mockResolvedValueOnce({
      id: "job-1",
      repo: "superpowers/using-superpowers",
      skillId: "superpowers:using-superpowers",
      providers: ["claude"],
      agents: ["a1"],
      status: "running",
      command: "npx skills add superpowers/using-superpowers",
      createdAt: Date.now(),
      startedAt: Date.now(),
      completedAt: null,
      updatedAt: Date.now(),
      exitCode: null,
      logTail: [],
      error: null,
    });

    render(<SkillsLibrary agents={[TEST_AGENT]} />);

    await screen.findByRole("button", { name: "Learn" });

    fireEvent.click(screen.getByRole("button", { name: "Learn" }));
    fireEvent.click(screen.getByRole("button", { name: "Start Learning" }));

    await screen.findByRole("button", { name: "Running" });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(
      screen.getByRole("heading", { name: "Skill Learning Squad" })
    ).toBeInTheDocument();
  });
});
