import { describe, expect, it } from "vitest";
import type { Department } from "../types";
import { buildOfficePackPresentation, buildOfficePackStarterAgents } from "./office-workflow-pack";

function makeDepartment(id: string): Department {
  return {
    id,
    name: id.toUpperCase(),
    name_ko: `${id}-ko`,
    name_ja: `${id}-ja`,
    name_zh: `${id}-zh`,
    icon: "🏢",
    color: "#64748b",
    description: null,
    prompt: null,
    sort_order: 1,
    created_at: 1,
  };
}

describe("buildOfficePackStarterAgents", () => {
  it("development 팩에서는 기본 직원을 생성하지 않는다", () => {
    const starters = buildOfficePackStarterAgents({
      packKey: "development",
      departments: [makeDepartment("planning"), makeDepartment("dev")],
    });
    expect(starters).toHaveLength(0);
  });

  it("비개발 팩에서는 기본 직원(팀장 포함)을 생성한다", () => {
    const starters = buildOfficePackStarterAgents({
      packKey: "report",
      departments: [
        makeDepartment("planning"),
        makeDepartment("dev"),
        makeDepartment("design"),
        makeDepartment("qa"),
        makeDepartment("operations"),
      ],
      targetCount: 8,
    });

    expect(starters.length).toBeGreaterThanOrEqual(8);
    const leaderCount = starters.filter((agent) => agent.role === "team_leader").length;
    expect(leaderCount).toBeGreaterThanOrEqual(4);
    expect(starters.every((agent) => !!agent.department_id)).toBe(true);
  });

  it("비개발 팩 personality는 생성 시 locale 기준으로 작성된다", () => {
    const startersEn = buildOfficePackStarterAgents({
      packKey: "report",
      departments: [makeDepartment("planning"), makeDepartment("dev"), makeDepartment("design"), makeDepartment("qa")],
      targetCount: 4,
      locale: "en",
    });
    expect(startersEn.some((agent) => (agent.personality ?? "").includes("Prioritizes evidence quality"))).toBe(true);

    const startersJa = buildOfficePackStarterAgents({
      packKey: "report",
      departments: [makeDepartment("planning"), makeDepartment("dev"), makeDepartment("design"), makeDepartment("qa")],
      targetCount: 4,
      locale: "ja",
    });
    expect(startersJa.some((agent) => (agent.personality ?? "").includes("最優先"))).toBe(true);
  });
});

describe("buildOfficePackPresentation", () => {
  it("비개발 팩 부서 설명/프롬프트를 locale 기준으로 생성한다", () => {
    const presentationEn = buildOfficePackPresentation({
      packKey: "report",
      locale: "en",
      departments: [makeDepartment("planning")],
      agents: [],
      customRoomThemes: {},
    });
    expect(presentationEn.departments[0]?.description).toContain("team");
    expect(presentationEn.departments[0]?.prompt).toContain("[Department Role]");

    const presentationKo = buildOfficePackPresentation({
      packKey: "report",
      locale: "ko",
      departments: [makeDepartment("planning")],
      agents: [],
      customRoomThemes: {},
    });
    expect(presentationKo.departments[0]?.description).toContain("협업");
    expect(presentationKo.departments[0]?.prompt).toContain("[부서 역할]");
  });
});
