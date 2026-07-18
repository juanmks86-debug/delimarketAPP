// Service worker mínimo: necesario para que Chrome/Android ofrezcan
// "Instalar app". Por ahora no cachea nada (la app depende de datos
// siempre frescos de Supabase); solo deja pasar todas las peticiones.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Passthrough: no cache. Se puede sumar cache de assets estáticos
  // más adelante si hace falta que funcione offline.
  event.respondWith(fetch(event.request));
});
