importScripts("https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDYaw4D-zW4j2OnsgYiEKPLenQpTjsztoc",
  authDomain: "hvalamami-5ea07.firebaseapp.com",
  projectId: "hvalamami-5ea07",
  messagingSenderId: "450479142387",
  appId: "1:450479142387:web:b270d921c975d6a7308e86"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "HvalaMami", {
    body: body || "Novo obvestilo!",
    icon: "/logo-hm.png",
    data: payload.data || {},
  });
});