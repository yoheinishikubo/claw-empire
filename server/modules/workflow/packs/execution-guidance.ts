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
      `  \`pnpm exec remotion render <entry-file> <composition-id> ${artifactPath} --log=verbose\``,
      `- 렌더 후 \`${artifactPath}\` 파일 존재 여부와 파일 크기(\`ls -lh ${artifactPath}\`)를 확인해 보고에 포함하세요.`,
      "",
      "[Video Quality Requirements]",
      "- 해상도: 1920×1080 (Full HD) 이상, fps: 30",
      "- Composition 설정: <Composition width={1920} height={1080} fps={30} />",
      "- 애니메이션: CSS transition/animation 사용 금지 — 반드시 useCurrentFrame() + interpolate()/spring() 사용",
      "- spring 기본 설정: { damping: 200 } (자연스러운 모션, 바운스 없음)",
      "- 장면 전환: @remotion/transitions의 TransitionSeries 사용 (fade, slide, wipe 등)",
      "  - 전환 시간: linearTiming({ durationInFrames: 15 }) 이상",
      "- 텍스트 애니메이션: spring() 기반 staggered 입장 효과 사용",
      "- 색상: 프로젝트 브랜드 컬러 활용, 그라데이션/그림자로 깊이감",
      "- 타이포그래피: @remotion/google-fonts로 웹폰트 로드",
      "- Sequence마다 premountFor={1 * fps} 설정 (프리로딩)",
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
      `  \`pnpm exec remotion render <entry-file> <composition-id> ${artifactPath} --log=verbose\``,
      `- After rendering, verify file existence and size (\`ls -lh ${artifactPath}\`) and include it in your report.`,
      "",
      "[Video Quality Requirements]",
      "- Resolution: 1920×1080 (Full HD) minimum, fps: 30",
      "- Composition config: <Composition width={1920} height={1080} fps={30} />",
      "- Animation: NEVER use CSS transition/animation — always use useCurrentFrame() + interpolate()/spring()",
      "- spring defaults: { damping: 200 } (smooth motion, no bounce)",
      "- Scene transitions: use TransitionSeries from @remotion/transitions (fade, slide, wipe, etc.)",
      "  - Transition timing: linearTiming({ durationInFrames: 15 }) minimum",
      "- Text animation: use spring()-based staggered entrance effects",
      "- Colors: leverage project brand colors, add depth with gradients/shadows",
      "- Typography: load web fonts via @remotion/google-fonts",
      "- Add premountFor={1 * fps} on each Sequence for preloading",
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
      `  \`pnpm exec remotion render <entry-file> <composition-id> ${artifactPath} --log=verbose\``,
      `- レンダリング後、\`${artifactPath}\` の存在とサイズ（\`ls -lh ${artifactPath}\`）を確認し、報告に含めてください。`,
      "",
      "[Video Quality Requirements]",
      "- 解像度: 1920×1080 (Full HD) 以上、fps: 30",
      "- Composition 設定: <Composition width={1920} height={1080} fps={30} />",
      "- アニメーション: CSS transition/animation 使用禁止 — 必ず useCurrentFrame() + interpolate()/spring() を使用",
      "- spring デフォルト: { damping: 200 }（スムーズモーション、バウンスなし）",
      "- シーン遷移: @remotion/transitions の TransitionSeries を使用（fade, slide, wipe 等）",
      "  - 遷移時間: linearTiming({ durationInFrames: 15 }) 以上",
      "- テキストアニメーション: spring() ベースのスタガード入場効果を使用",
      "- カラー: プロジェクトブランドカラーを活用、グラデーション/シャドウで奥行き感",
      "- タイポグラフィ: @remotion/google-fonts でウェブフォントをロード",
      "- 各 Sequence に premountFor={1 * fps} を設定（プリロード）",
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
      `  \`pnpm exec remotion render <entry-file> <composition-id> ${artifactPath} --log=verbose\``,
      `- 渲染完成后，检查 \`${artifactPath}\` 是否存在及文件大小（\`ls -lh ${artifactPath}\`），并写入报告。`,
      "",
      "[Video Quality Requirements]",
      "- 分辨率: 1920×1080 (Full HD) 以上, fps: 30",
      "- Composition 配置: <Composition width={1920} height={1080} fps={30} />",
      "- 动画: 禁止使用 CSS transition/animation — 必须使用 useCurrentFrame() + interpolate()/spring()",
      "- spring 默认: { damping: 200 }（平滑运动，无弹跳）",
      "- 场景转场: 使用 @remotion/transitions 的 TransitionSeries（fade, slide, wipe 等）",
      "  - 转场时间: linearTiming({ durationInFrames: 15 }) 以上",
      "- 文字动画: 使用 spring() 交错入场效果",
      "- 色彩: 运用项目品牌色，通过渐变/阴影增加层次感",
      "- 字体: 通过 @remotion/google-fonts 加载网络字体",
      "- 每个 Sequence 设置 premountFor={1 * fps}（预加载）",
    ],
  };

  return ruleLines[lang].join("\n");
}
