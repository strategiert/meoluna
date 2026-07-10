import { useEffect, useRef, useState } from "react";
import { createGameBridge } from "./bridge";
import type { GameManifest, ShellToParent } from "./types";

type Props = { manifest: GameManifest; onEvent?: (msg: ShellToParent) => void };

export default function PhaserPreview({ manifest, onEvent }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let cancelled = false;
    const watchdog = window.setTimeout(() => {
      setStatus((s) => (s === "loading" ? "error" : s));
      setErrorText((t) => t ?? "Spiel hat nicht innerhalb von 5 Sekunden geladen (GAME_READY fehlt).");
    }, 5000);

    const bridge = createGameBridge(iframe, {
      onMessage: (msg) => {
        if (msg.type === "GAME_READY") { setStatus("ready"); window.clearTimeout(watchdog); }
        if (msg.type === "GAME_ERROR") { setStatus("error"); setErrorText(msg.message); }
        onEvent?.(msg);
      },
    });

    (async () => {
      const source = await (await fetch(manifest.sourceUrl)).text();
      const assets = await Promise.all(
        manifest.assets.map(async (a) => ({ id: a.id, blob: await (await fetch(a.url)).blob() })),
      );
      if (cancelled) return;
      bridge.load({
        type: "LOAD_GAME",
        source,
        assets,
        seed: manifest.seed,
        device: "ontouchstart" in window ? "touch" : "desktop",
        width: manifest.width,
        height: manifest.height,
      });
    })().catch((err) => { setStatus("error"); setErrorText(String(err?.message ?? err)); });

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      bridge.dispose();
    };
  }, [manifest, onEvent]);

  return (
    <div className="relative w-full" style={{ aspectRatio: `${manifest.width} / ${manifest.height}`, maxHeight: "80vh" }}>
      <iframe
        ref={iframeRef}
        title={manifest.title}
        src="/game-runtime/v1/index.html"
        sandbox="allow-scripts"
        className="h-full w-full rounded-lg border border-white/10 bg-[#0a0a14]"
      />
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-950/80 p-6 text-red-100">
          <div>
            <p className="font-semibold">Spiel konnte nicht geladen werden.</p>
            <p className="mt-2 text-sm opacity-80">{errorText}</p>
          </div>
        </div>
      )}
    </div>
  );
}
