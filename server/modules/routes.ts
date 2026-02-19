// @ts-nocheck

import { registerRoutesPartA } from "./routes/core.ts";
import { registerRoutesPartB } from "./routes/collab.ts";
import { registerRoutesPartC } from "./routes/ops.ts";
import { ROUTE_RUNTIME_HELPER_KEYS } from "./runtime-helper-keys.ts";

export function registerApiRoutes(ctx: any): any {
  const runtime = ctx as any;


  Object.assign(runtime, registerRoutesPartB(runtime));
  Object.assign(runtime, registerRoutesPartA(runtime));
  Object.assign(runtime, registerRoutesPartC(runtime));

  const routeHelpers = Object.fromEntries(
    ROUTE_RUNTIME_HELPER_KEYS.map((key) => [key, runtime[key]])
  );

  return {
    DEPT_KEYWORDS: runtime.DEPT_KEYWORDS,
    ...routeHelpers,
  };
}
