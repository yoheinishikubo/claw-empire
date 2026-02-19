import { WebSocket } from "ws";

export function createWsHub(nowMs: () => number): {
  wsClients: Set<WebSocket>;
  broadcast: (type: string, payload: unknown) => void;
} {
  const wsClients = new Set<WebSocket>();

  function broadcast(type: string, payload: unknown): void {
    const message = JSON.stringify({ type, payload, ts: nowMs() });
    for (const ws of wsClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  return { wsClients, broadcast };
}
