// Uvozi Firebase SDK-je za service worker
importScripts("https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js");

// 🔧 Nastavitve tvoje Firebase aplikacije
firebase.initializeApp({
  apiKey: "AIzaSyDYaw4D-zW4j2OnsgYiEKPLenQpTjsztoc",
  authDomain: "hvalamami-5ea07.firebaseapp.com",
  projectId: "hvalamami-5ea07",
  messagingSenderId: "450479142387",
  appId: "1:450479142387:web:b270d921c975d6a7308e86",
});

// Inicializacija messaging servisa
const messaging = firebase.messaging();

// 👉 Prikaži obvestilo, ko pride v ozadju
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  const notificationOptions = {
    body: body || '',
    icon: '/logo-small.jpg',
    data: payload.data || {}, // tukaj bo npr. { url: "/objava/abc123" }
  };

  self.registration.showNotification(title || 'Novo obvestilo!', notificationOptions);
});

// 👉 Ob kliku na obvestilo odpri pravilno stran
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