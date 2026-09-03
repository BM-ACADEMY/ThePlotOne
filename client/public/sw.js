self.addEventListener("push", (event) => {
  const data = event.data.json();
  console.log("Push Received...", data);

  const options = {
    body: data.body,
    icon: data.icon || "/Logo/logo.webp",
    badge: data.badge || "/Logo/logo.webp",
    data: data.data || {},
    requireInteraction: true,
  };

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If any window is already focused, don't show a browser notification
      const isFocused = clientList.some((client) => client.focused);
      if (isFocused) {
        console.log("App is in foreground, skipping browser notification");
        return;
      }
      return self.registration.showNotification(data.title, options);
    })
  );
});


self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with this URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
