import type { RuntimeContext } from "../../../../types/runtime-context.ts";
import { registerTaskExecutionControlRoutes } from "./execution-control.ts";
import { registerTaskRunRoute } from "./execution-run.ts";

export function registerTaskExecutionRoutes(ctx: RuntimeContext): void {
  registerTaskRunRoute(ctx);
  registerTaskExecutionControlRoutes(ctx);
}
