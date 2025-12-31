const CACHE_NAME = 'outfitclub-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/img/logo192.png',
    '/img/logo512.png',
    // Agregá acá tus archivos CSS principales si querés que carguen al instante
];

// Instalación: Guarda los archivos básicos en la memoria del celu
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activación: Limpia versiones viejas de la app
self.addEventListener('activate', (event) => {
    console.log('Service Worker activo');
});

// Fetch: Sirve los archivos
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});