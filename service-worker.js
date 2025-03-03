self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('calendario-cache').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/designCalendar.css',
                '/MainCalendar.js',
                '/icons/icon-192x192.png',
                '/icons/icon-512x512.png',
                'https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.js',
                'https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.css',
                'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
                'https://cdn.jsdelivr.net/npm/flatpickr'
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});