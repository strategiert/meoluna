// Web-Push-Anmeldung im Browser. Der oeffentliche VAPID-Key gehoert
// per Design in den Client (kein Secret).

const VAPID_PUBLIC_KEY =
  (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ||
  "BGZ3OxHqXv2_JNm5yRJOeW9CfUOyEuE0yp_N9DFJ_8C7Cqoitf05ufcAAXZGPYEiM2r2pdZYaxed5i0jji1AJa8";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

let registration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    registration = await navigator.serviceWorker.register("/sw.js");
  } catch (e) {
    // Service Worker nicht verfuegbar (z.B. unsicherer Kontext) - still ignorieren.
  }
}

type SaveSub = (args: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}) => Promise<unknown>;

// Fragt (einmalig) nach Erlaubnis und meldet die Push-Subscription an.
// Idempotent: bestehende Subscription wird wiederverwendet. Liefert true,
// wenn Push aktiv ist. Wirft nie - Push ist optionales Extra.
export async function ensurePushSubscription(userId: string, saveSubscription: SaveSub): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      return false;
    }
    if (!registration) {
      registration = await navigator.serviceWorker.register("/sw.js");
    }
    await navigator.serviceWorker.ready;

    if (Notification.permission === "denied") return false;
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return false;
    }

    let sub = await registration.pushManager.getSubscription();
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });
    }

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    await saveSubscription({
      userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    });
    return true;
  } catch (e) {
    return false;
  }
}
