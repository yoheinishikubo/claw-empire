import { DEFAULT_WORKFLOW_PACK_KEY, isWorkflowPackKey, type WorkflowPackKey } from "./definitions.ts";

type SupportedLang = "ko" | "en" | "ja" | "zh";

function normalizeLang(raw: string | null | undefined): SupportedLang {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (value.startsWith("ko")) return "ko";
  if (value.startsWith("ja")) return "ja";
  if (value.startsWith("zh")) return "zh";
  return "en";
}

function normalizePackKey(raw: string | null | undefined): WorkflowPackKey {
  if (isWorkflowPackKey(raw)) return raw;
  return DEFAULT_WORKFLOW_PACK_KEY;
}

export function buildWorkflowPackExecutionGuidance(
  packKeyRaw: string | null | undefined,
  langRaw: string | null | undefined,
  options?: {
    videoArtifactRelativePath?: string | null;
  },
): string {
  const packKey = normalizePackKey(packKeyRaw);
  if (packKey !== "video_preprod") return "";

  const lang = normalizeLang(langRaw);
  const artifactPath = String(options?.videoArtifactRelativePath ?? "").trim() || "video_output/final.mp4";
  const ruleLines: Record<SupportedLang, string[]> = {
    ko: [
      "[Video Output Requirement]",
      "- 이 작업은 문서만 생성하면 완료가 아닙니다. 실제 영상 파일을 생성해야 합니다.",
      "- 순서 고정: 문서화/기획/회의 반영 작업을 모두 끝낸 뒤 마지막 단계에서 렌더링하세요.",
      "- 리뷰 보완 라운드에서 다시 실행할 때는 보완 내용을 반영한 뒤 같은 출력 파일로 재렌더링하세요.",
      `- 최종 산출물은 반드시 \`${artifactPath}\` 경로에 저장하세요. (프로젝트명_부서명_final.mp4 규칙)`,
      "- 다른 태스크의 결과를 덮어쓰지 않도록 `final.mp4` 단일 파일만 고집하지 마세요.",
      "- 우선 Remotion 런타임을 준비하세요: `pnpm exec remotion browser ensure`",
      "- 위 명령이 실패하면 fallback으로 실행하세요: `pnpm --package=@remotion/cli dlx remotion browser ensure`",
      "- Remotion 엔트리(`index.ts`, `Root.tsx`, `Composition.tsx`)를 프로젝트 내에 만들고, 아래 형태로 렌더를 실행하세요:",
      `  \`pnpm exec remotion render <entry-file> <composition-id> ${artifactPath}\``,
      `- 렌더 후 \`${artifactPath}\` 파일 존재 여부와 파일 크기(\`ls -lh ${artifactPath}\`)를 확인해 보고에 포함하세요.`,
    ],
    en: [
      "[Video Output Requirement]",
      "- This task is NOT complete with planning docs only. You must produce a real video file.",
      "- Fixed order: finish documentation/planning/meeting updates first, then render in the final step.",
      "- On review-remediation reruns, apply fixes first and re-render to the same output path.",
      `- Save the final artifact at \`${artifactPath}\`. (project_department_final.mp4 pattern)`,
      "- Do not force a single `final.mp4` filename when it can overwrite other tasks.",
      "- Prepare the Remotion runtime first: `pnpm exec remotion browser ensure`",
      "- If that fails, run fallback: `pnpm --package=@remotion/cli dlx remotion browser ensure`",
      "- Create a Remotion entry (`index.ts`, `Root.tsx`, `Composition.tsx`) in the project and render with:",
      `  \`pnpm exec remotion render <entry-file> <composition-id> ${artifactPath}\``,
      `- After rendering, verify file existence and size (\`ls -lh ${artifactPath}\`) and include it in your report.`,
    ],
    ja: [
      "[Video Output Requirement]",
      "- このタスクは企画ドキュメントだけでは完了ではありません。実際の動画ファイルを生成してください。",
      "- 順序固定: 文書化/企画/会議反映をすべて完了した後、最後にレンダリングしてください。",
      "- レビュー補完ラウンドで再実行する場合は、補完反映後に同じ出力先へ再レンダリングしてください。",
      `- 最終成果物は必ず \`${artifactPath}\` に保存してください。（project_department_final.mp4 ルール）`,
      "- 他タスク成果物の上書きを避けるため、単一の `final.mp4` 固定運用は避けてください。",
      "- まず Remotion ランタイムを準備: `pnpm exec remotion browser ensure`",
      "- 失敗した場合はフォールバック: `pnpm --package=@remotion/cli dlx remotion browser ensure`",
      "- プロジェクト内に Remotion エントリ（`index.ts`, `Root.tsx`, `Composition.tsx`）を作成し、次でレンダリングしてください:",
      `  \`pnpm exec remotion render <entry-file> <composition-id> ${artifactPath}\``,
      `- レンダリング後、\`${artifactPath}\` の存在とサイズ（\`ls -lh ${artifactPath}\`）を確認し、報告に含めてください。`,
    ],
    zh: [
      "[Video Output Requirement]",
      "- 本任务仅产出策划文档不算完成，必须生成真实视频文件。",
      "- 固定顺序：先完成文档/策划/会议结论落实，再在最后一步渲染视频。",
      "- 评审整改轮次重新执行时，先完成整改，再渲染到同一路径。",
      `- 最终产物必须保存到 \`${artifactPath}\`。（project_department_final.mp4 规则）`,
      "- 不要固定只写 `final.mp4`，避免覆盖其他任务产物。",
      "- 先准备 Remotion 运行环境：`pnpm exec remotion browser ensure`",
      "- 若失败，执行回退命令：`pnpm --package=@remotion/cli dlx remotion browser ensure`",
      "- 在项目内创建 Remotion 入口（`index.ts`, `Root.tsx`, `Composition.tsx`），并执行渲染：",
      `  \`pnpm exec remotion render <entry-file> <composition-id> ${artifactPath}\``,
      `- 渲染完成后，检查 \`${artifactPath}\` 是否存在及文件大小（\`ls -lh ${artifactPath}\`），并写入报告。`,
    ],
  };

  return ruleLines[lang].join("\n");
}
