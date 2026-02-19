import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { WebSocket } from "ws";

import { OPENCLAW_CONFIG_PATH, PKG_VERSION } from "../config/runtime.ts";

// ---------------------------------------------------------------------------
// OpenClaw Gateway wake (ported from claw-kanban)
// ---------------------------------------------------------------------------
const GATEWAY_PROTOCOL_VERSION = 3;
const GATEWAY_WS_PATH = "/ws";
const WAKE_DEBOUNCE_DEFAULT_MS = 12_000;
const wakeDebounce = new Map<string, number>();
let cachedGateway: { url: string; token?: string; loadedAt: number } | null = null;

function loadGatewayConfig(): { url: string; token?: string } | null {
  if (!OPENCLAW_CONFIG_PATH) return null;

  const now = Date.now();
  if (cachedGateway && now - cachedGateway.loadedAt < 30_000) {
    return { url: cachedGateway.url, token: cachedGateway.token };
  }
  try {
    const raw = fs.readFileSync(OPENCLAW_CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as {
      gateway?: {
        port?: number;
        auth?: { token?: string };
      };
    };
    const port = Number(parsed?.gateway?.port);
    if (!Number.isFinite(port) || port <= 0) {
      console.warn(`[Claw-Empire] invalid gateway.port in ${OPENCLAW_CONFIG_PATH}`);
      return null;
    }
    const token =
      typeof parsed?.gateway?.auth?.token === "string" ? parsed.gateway.auth.token : undefined;
    const url = `ws://127.0.0.1:${port}${GATEWAY_WS_PATH}`;
    cachedGateway = { url, token, loadedAt: now };
    return { url, token };
  } catch (err) {
    console.warn(`[Claw-Empire] failed to read gateway config: ${String(err)}`);
    return null;
  }
}

function shouldSendWake(key: string, debounceMs: number): boolean {
  const now = Date.now();
  const last = wakeDebounce.get(key);
  if (last && now - last < debounceMs) {
    return false;
  }
  wakeDebounce.set(key, now);
  if (wakeDebounce.size > 2000) {
    for (const [k, ts] of wakeDebounce) {
      if (now - ts > debounceMs * 4) {
        wakeDebounce.delete(k);
      }
    }
  }
  return true;
}

async function sendGatewayWake(text: string): Promise<void> {
  const config = loadGatewayConfig();
  if (!config) {
    throw new Error("gateway config unavailable");
  }

  const connectId = randomUUID();
  const wakeId = randomUUID();
  const instanceId = randomUUID();

  return await new Promise<void>((resolve, reject) => {
    let settled = false;
    let timer: NodeJS.Timeout | null = null;
    const ws = new WebSocket(config.url);

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      try {
        ws.close();
      } catch {
        // ignore
      }
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    };

    const send = (payload: unknown) => {
      try {
        ws.send(JSON.stringify(payload));
      } catch (err) {
        finish(err instanceof Error ? err : new Error(String(err)));
      }
    };

    const connectParams = {
      minProtocol: GATEWAY_PROTOCOL_VERSION,
      maxProtocol: GATEWAY_PROTOCOL_VERSION,
      client: {
        id: "cli",
        displayName: "Claw-Empire",
        version: PKG_VERSION,
        platform: process.platform,
        mode: "backend",
        instanceId,
      },
      ...(config.token ? { auth: { token: config.token } } : {}),
      role: "operator",
      scopes: ["operator.admin"],
      caps: [],
    };

    ws.on("open", () => {
      send({ type: "req", id: connectId, method: "connect", params: connectParams });
    });

    ws.on("message", (data: Buffer | string) => {
      const raw = typeof data === "string" ? data : data.toString("utf8");
      if (!raw) return;
      let msg: any;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
      if (!msg || msg.type !== "res") return;
      if (msg.id === connectId) {
        if (!msg.ok) {
          finish(new Error(msg.error?.message ?? "gateway connect failed"));
          return;
        }
        send({ type: "req", id: wakeId, method: "wake", params: { mode: "now", text } });
        return;
      }
      if (msg.id === wakeId) {
        if (!msg.ok) {
          finish(new Error(msg.error?.message ?? "gateway wake failed"));
          return;
        }
        finish();
      }
    });

    ws.on("error", () => {
      finish(new Error("gateway socket error"));
    });

    ws.on("close", () => {
      finish(new Error("gateway socket closed"));
    });

    timer = setTimeout(() => {
      finish(new Error("gateway wake timeout"));
    }, 8000);
    (timer as NodeJS.Timeout).unref?.();
  });
}

function queueWake(params: { key: string; text: string; debounceMs?: number }) {
  if (!OPENCLAW_CONFIG_PATH) return;
  const debounceMs = params.debounceMs ?? WAKE_DEBOUNCE_DEFAULT_MS;
  if (!shouldSendWake(params.key, debounceMs)) return;
  void sendGatewayWake(params.text).catch((err) => {
    console.warn(`[Claw-Empire] wake failed (${params.key}): ${String(err)}`);
  });
}

export function notifyTaskStatus(taskId: string, title: string, status: string): void {
  if (!OPENCLAW_CONFIG_PATH) return;
  const emoji = status === "in_progress" ? "\u{1F680}" : status === "review" ? "\u{1F50D}" : status === "done" ? "\u2705" : "\u{1F4CB}";
  const label = status === "in_progress" ? "진행 시작" : status === "review" ? "검토 중" : status === "done" ? "완료" : status;
  queueWake({
    key: `task:${taskId}:${status}`,
    text: `${emoji} [${label}] ${title}`,
    debounceMs: 5_000,
  });
}

// ---------------------------------------------------------------------------
// Gateway HTTP REST invoke (for /tools/invoke endpoint)
// ---------------------------------------------------------------------------
export async function gatewayHttpInvoke(req: {
  tool: string;
  action?: string;
  args?: Record<string, any>;
}): Promise<any> {
  const config = loadGatewayConfig();
  if (!config) throw new Error("gateway config unavailable");
  const portMatch = config.url.match(/:(\d+)/);
  if (!portMatch) throw new Error("cannot extract port from gateway URL");
  const baseUrl = `http://127.0.0.1:${portMatch[1]}`;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (config.token) headers.authorization = `Bearer ${config.token}`;
  const r = await fetch(`${baseUrl}/tools/invoke`, {
    method: "POST",
    headers,
    body: JSON.stringify(req),
  });
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`gateway invoke failed: ${r.status}${body ? `: ${body}` : ""}`);
  }
  const data = await r.json() as { ok: boolean; result?: any; error?: { message?: string } };
  if (!data.ok) throw new Error(data.error?.message || "tool invoke error");
  return data.result;
}
