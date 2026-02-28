import { describe, expect, it } from "vitest";
import { buildWorkflowPackExecutionGuidance } from "./execution-guidance.ts";

describe("buildWorkflowPackExecutionGuidance", () => {
  it("video_preprod는 remotion 기반 실제 mp4 생성 규칙을 포함한다", () => {
    const guidance = buildWorkflowPackExecutionGuidance("video_preprod", "ko");
    expect(guidance).toContain("video_output/final.mp4");
    expect(guidance).toContain("remotion render");
    expect(guidance).toContain("pnpm exec remotion browser ensure");
  });

  it("video_preprod 외 워크플로우 팩은 추가 규칙을 주지 않는다", () => {
    expect(buildWorkflowPackExecutionGuidance("development", "ko")).toBe("");
    expect(buildWorkflowPackExecutionGuidance("report", "en")).toBe("");
  });

  it("언어 정보가 없으면 영어 규칙으로 폴백한다", () => {
    const guidance = buildWorkflowPackExecutionGuidance("video_preprod", null);
    expect(guidance).toContain("This task is NOT complete with planning docs only.");
  });
});

