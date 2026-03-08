import { describe, expect, it } from "vitest";
import { buildTerminalProgressHints } from "./progress-hints.ts";

describe("buildTerminalProgressHints", () => {
  it("skips the gws glibc musl fallback warning when summarizing command output", () => {
    const raw = [
      JSON.stringify({
        type: "item.started",
        item: {
          id: "item_13",
          type: "command_execution",
          command: "/bin/bash -lc 'gws --version'",
        },
      }),
      JSON.stringify({
        type: "item.completed",
        item: {
          id: "item_13",
          type: "command_execution",
          command: "/bin/bash -lc 'gws --version'",
          aggregated_output:
            "Your glibc isn't compatible; trying static musl binary instead\ngws 0.7.0\nThis is not an officially supported Google product.\n",
          exit_code: 0,
          status: "completed",
        },
      }),
    ].join("\n");

    const result = buildTerminalProgressHints(raw);
    const okHint = result.hints.find((hint) => hint.phase === "ok");

    expect(okHint?.summary).toBe("gws 0.7.0");
    expect(result.ok_items).toContain("gws 0.7.0");
    expect(result.ok_items).not.toContain("Your glibc isn't compatible; trying static musl binary instead");
  });
});
