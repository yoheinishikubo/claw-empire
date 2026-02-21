import { describe, expect, it } from "vitest";
import { parseSafeRestartCommand } from "./update-auto-command.ts";

describe("parseSafeRestartCommand", () => {
  it("parses safe commands", () => {
    expect(parseSafeRestartCommand("pm2 restart claw-empire")).toEqual({
      cmd: "pm2",
      args: ["restart", "claw-empire"],
    });
    expect(parseSafeRestartCommand("\"/usr/local/bin/openclaw\" gateway restart")).toEqual({
      cmd: "/usr/local/bin/openclaw",
      args: ["gateway", "restart"],
    });
    expect(parseSafeRestartCommand("cmd \"some\\\"arg\" plain")).toEqual({
      cmd: "cmd",
      args: ["some\"arg", "plain"],
    });
  });

  it("rejects shell meta characters", () => {
    expect(parseSafeRestartCommand("pm2 restart claw; rm -rf /")).toBeNull();
    expect(parseSafeRestartCommand("echo $HOME")).toBeNull();
    expect(parseSafeRestartCommand("a | b")).toBeNull();
  });

  it("rejects empty input", () => {
    expect(parseSafeRestartCommand("")).toBeNull();
    expect(parseSafeRestartCommand("   ")).toBeNull();
  });
});
