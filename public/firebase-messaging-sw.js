importScripts("https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDYaw4D-zW4j2OnsgYiEKPLenQpTjsztoc",
  authDomain: "hvalamami-5ea07.firebaseapp.com",
  projectId: "hvalamami-5ea07",
  messagingSenderId: "450479142387",
  appId: "1:450479142387:web:b270d921c975d6a7308e86",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.data?.title || 'Novo obvestilo!';
  const body = payload.data?.body || '';
  const url = payload.data?.url || '/';

  const notificationOptions = {
    body,
    icon: '/logo-hm.png',       // za prikaz ikone obvestila
    badge: '/logo-hm-small.png',// majhna ikona na status vrstice (Android)
    data: { url },              // shrani link za klik
  };

  self.registration.showNotification(title, notificationOptions);
});

// ko uporabnik klikne obvestilo
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});