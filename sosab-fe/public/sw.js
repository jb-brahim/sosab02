self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/logo.png',
            badge: '/badge.png',
            vibrate: data.vibrate || [100, 50, 100],
            sound: data.sound || undefined,
            color: data.color || undefined,
            tag: data.tag || 'sosab-notification',
            renotify: data.renotify !== undefined ? data.renotify : true,
            data: {
                url: data.link || '/'
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
