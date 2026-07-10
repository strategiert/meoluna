/* Meoluna Game Runtime Shell v1. Läuft in sandboxed iframe (opake Origin).
   Kommunikation ausschließlich über MessagePort (Handshake siehe Plan/Spec 5.2). */
(function () {
  "use strict";
  var port = null;
  var booted = false;
  var lastBase = null;

  function send(msg) { if (port) port.postMessage(msg); }

  function reportError(message, stack) {
    send({ type: "GAME_ERROR", message: String(message || "Unbekannter Fehler"), stack: stack ? String(stack) : undefined });
  }

  window.addEventListener("error", function (e) {
    reportError(e.message, e.error && e.error.stack);
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason || {};
    reportError(r.message || String(e.reason), r.stack);
  });

  function transformAffordances(list, base) {
    var canvas = document.querySelector("#meoluna-game-root canvas");
    if (!canvas || !base) return [];
    var rect = canvas.getBoundingClientRect();
    var sx = rect.width / base.width;
    var sy = rect.height / base.height;
    return list.map(function (a) {
      return {
        id: a.id,
        x: rect.left + a.x * sx,
        y: rect.top + a.y * sy,
        width: a.width * sx,
        height: a.height * sy,
        state: a.state,
      };
    });
  }

  function buildContext(payload, assetUrls) {
    return {
      parentId: "meoluna-game-root",
      width: payload.width,
      height: payload.height,
      device: payload.device,
      seed: payload.seed,
      assets: assetUrls,
      api: {
        reportScore: function (amount, context) {
          send({ type: "PROGRESS", event: "score", amount: Number(amount) || 0, context: context || {} });
        },
        completeGoal: function (goalId, evidence) {
          send({ type: "PROGRESS", event: "goal", amount: 0, goalId: String(goalId), context: evidence || {} });
        },
        completeGame: function (summary) {
          var s = summary || {};
          send({ type: "PROGRESS", event: "complete", amount: Number(s.finalScore) || 0, context: s });
        },
        speak: function (text) {
          send({ type: "SPEAK", text: String(text || "").slice(0, 500) });
        },
        emit: function (event, payloadData) {
          send({ type: "TELEMETRY", event: String(event), payload: payloadData || {} });
        },
        setAffordances: function (list, base) {
          lastBase = base || lastBase;
          send({ type: "AFFORDANCES", affordances: transformAffordances(list || [], lastBase) });
        },
      },
    };
  }

  async function loadGame(payload) {
    if (booted) { reportError("LOAD_GAME wurde doppelt gesendet."); return; }
    booted = true;
    try {
      var assetUrls = {};
      (payload.assets || []).forEach(function (a) {
        assetUrls[a.id] = URL.createObjectURL(a.blob);
      });
      var srcUrl = URL.createObjectURL(new Blob([payload.source], { type: "text/javascript" }));
      var mod = await import(srcUrl);
      if (typeof mod.bootMeolunaGame !== "function") {
        reportError("Spiel exportiert kein bootMeolunaGame.");
        return;
      }
      await mod.bootMeolunaGame(buildContext(payload, assetUrls));
      requestAnimationFrame(function () { send({ type: "GAME_READY" }); });
    } catch (err) {
      reportError(err && err.message, err && err.stack);
    }
  }

  window.addEventListener("message", function (e) {
    if (!e.data || e.data.type !== "MEOLUNA_INIT" || !e.ports || !e.ports[0]) return;
    if (port) return; // nur ein INIT
    port = e.ports[0];
    port.onmessage = function (pe) {
      if (pe.data && pe.data.type === "LOAD_GAME") loadGame(pe.data);
    };
    clearInterval(readyTimer);
  });

  var attempts = 0;
  var readyTimer = setInterval(function () {
    attempts += 1;
    if (port || attempts > 25) { clearInterval(readyTimer); return; }
    try { window.parent.postMessage({ type: "MEOLUNA_RUNTIME_READY", version: "v1" }, "*"); } catch (_) {}
  }, 200);
  try { window.parent.postMessage({ type: "MEOLUNA_RUNTIME_READY", version: "v1" }, "*"); } catch (_) {}
})();
