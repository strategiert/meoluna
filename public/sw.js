// Meoluna Service Worker - Web Push fuer "Lernwelt fertig"-Benachrichtigungen.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }
  const title = data.title || "Meoluna";
  const options = {
    body: data.body || "Deine Lernwelt ist fertig!",
    icon: "/meoluna_logo.png",
    badge: "/meoluna_logo.png",
    tag: data.worldId ? "world-" + data.worldId : "meoluna",
    data: { worldId: data.worldId || null },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const worldId = event.notification.data && event.notification.data.worldId;
  const url = worldId ? "/w/" + worldId : "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
