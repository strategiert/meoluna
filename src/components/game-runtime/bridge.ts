import type { ParentToShell, ShellToParent } from "./types";

const SHELL_TYPES = new Set(["GAME_READY", "PROGRESS", "SPEAK", "AFFORDANCES", "TELEMETRY", "GAME_ERROR"]);

export type BridgeHandlers = {
  onMessage: (msg: ShellToParent) => void;
  onHandshake?: () => void;
};

export function createGameBridge(iframe: HTMLIFrameElement, handlers: BridgeHandlers) {
  let port: MessagePort | null = null;
  let pending: ParentToShell | null = null;

  const onWindowMessage = (e: MessageEvent) => {
    if (e.source !== iframe.contentWindow) return;
    if (!e.data || e.data.type !== "MEOLUNA_RUNTIME_READY" || port) return;
    const channel = new MessageChannel();
    port = channel.port1;
    port.onmessage = (pe: MessageEvent) => {
      const msg = pe.data as ShellToParent;
      if (!msg || typeof msg.type !== "string" || !SHELL_TYPES.has(msg.type)) return;
      handlers.onMessage(msg);
    };
    iframe.contentWindow?.postMessage({ type: "MEOLUNA_INIT" }, "*", [channel.port2]);
    handlers.onHandshake?.();
    if (pending) { port.postMessage(pending); pending = null; }
  };

  window.addEventListener("message", onWindowMessage);

  return {
    load(payload: ParentToShell) {
      if (port) port.postMessage(payload);
      else pending = payload;
    },
    dispose() {
      window.removeEventListener("message", onWindowMessage);
      port?.close();
      port = null;
    },
  };
}
