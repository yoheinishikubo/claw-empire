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
): string {
  const packKey = normalizePackKey(packKeyRaw);
  if (packKey !== "video_preprod") return "";

  const lang = normalizeLang(langRaw);
  const ruleLines: Record<SupportedLang, string[]> = {
    ko: [
      "[Video Output Requirement]",
      "- 이 작업은 문서만 생성하면 완료가 아닙니다. 실제 영상 파일을 생성해야 합니다.",
      "- 최종 산출물은 반드시 `video_output/final.mp4` 경로에 저장하세요.",
      "- 우선 Remotion 런타임을 준비하세요: `pnpm exec remotion browser ensure`",
      "- 위 명령이 실패하면 fallback으로 실행하세요: `pnpm --package=@remotion/cli dlx remotion browser ensure`",
      "- Remotion 엔트리(`index.ts`, `Root.tsx`, `Composition.tsx`)를 프로젝트 내에 만들고, 아래 형태로 렌더를 실행하세요:",
      "  `pnpm exec remotion render <entry-file> <composition-id> video_output/final.mp4`",
      "- 렌더 후 `video_output/final.mp4` 파일 존재 여부와 파일 크기(`ls -lh video_output/final.mp4`)를 확인해 보고에 포함하세요.",
    ],
    en: [
      "[Video Output Requirement]",
      "- This task is NOT complete with planning docs only. You must produce a real video file.",
      "- Save the final artifact at `video_output/final.mp4`.",
      "- Prepare the Remotion runtime first: `pnpm exec remotion browser ensure`",
      "- If that fails, run fallback: `pnpm --package=@remotion/cli dlx remotion browser ensure`",
      "- Create a Remotion entry (`index.ts`, `Root.tsx`, `Composition.tsx`) in the project and render with:",
      "  `pnpm exec remotion render <entry-file> <composition-id> video_output/final.mp4`",
      "- After rendering, verify file existence and size (`ls -lh video_output/final.mp4`) and include it in your report.",
    ],
    ja: [
      "[Video Output Requirement]",
      "- このタスクは企画ドキュメントだけでは完了ではありません。実際の動画ファイルを生成してください。",
      "- 最終成果物は必ず `video_output/final.mp4` に保存してください。",
      "- まず Remotion ランタイムを準備: `pnpm exec remotion browser ensure`",
      "- 失敗した場合はフォールバック: `pnpm --package=@remotion/cli dlx remotion browser ensure`",
      "- プロジェクト内に Remotion エントリ（`index.ts`, `Root.tsx`, `Composition.tsx`）を作成し、次でレンダリングしてください:",
      "  `pnpm exec remotion render <entry-file> <composition-id> video_output/final.mp4`",
      "- レンダリング後、`video_output/final.mp4` の存在とサイズ（`ls -lh video_output/final.mp4`）を確認し、報告に含めてください。",
    ],
    zh: [
      "[Video Output Requirement]",
      "- 本任务仅产出策划文档不算完成，必须生成真实视频文件。",
      "- 最终产物必须保存到 `video_output/final.mp4`。",
      "- 先准备 Remotion 运行环境：`pnpm exec remotion browser ensure`",
      "- 若失败，执行回退命令：`pnpm --package=@remotion/cli dlx remotion browser ensure`",
      "- 在项目内创建 Remotion 入口（`index.ts`, `Root.tsx`, `Composition.tsx`），并执行渲染：",
      "  `pnpm exec remotion render <entry-file> <composition-id> video_output/final.mp4`",
      "- 渲染完成后，检查 `video_output/final.mp4` 是否存在及文件大小（`ls -lh video_output/final.mp4`），并写入报告。",
    ],
  };

  return ruleLines[lang].join("\n");
}

