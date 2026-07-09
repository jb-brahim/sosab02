self.addEventListener('push', function (event) {
    if (event.data) {
        let data;
        try {
            data = event.data.json();
        } catch (e) {
            // Fallback for text payloads
            data = { title: 'SOSAB', body: event.data.text(), link: '/' };
        }

        // Determine icon based on category type
        let iconUrl = '/logo.png';
        let defaultActionTitle = '👁️ Ouvrir';
        let vibrationPattern = [100];

        if (data.type) {
            switch (data.type.toLowerCase()) {
                case 'security':
                case 'system':
                    iconUrl = '/icons/security.png';
                    defaultActionTitle = '🔒 Détails';
                    vibrationPattern = [200, 100, 200];
                    break;
                case 'attendance':
                case 'worker_absence':
                    iconUrl = '/icons/attendance.png';
                    defaultActionTitle = '📅 Présences';
                    vibrationPattern = [100, 50, 100];
                    break;
                case 'low_stock':
                case 'stock':
                    iconUrl = '/icons/stock.png';
                    defaultActionTitle = '📦 Stock';
                    vibrationPattern = [300, 100, 300];
                    break;
                case 'salary':
                case 'salary_approved':
                    iconUrl = '/icons/salary.png';
                    defaultActionTitle = '💰 Salaire';
                    vibrationPattern = [150, 50, 150];
                    break;
                case 'report':
                case 'report_ready':
                    iconUrl = '/icons/report.png';
                    defaultActionTitle = '📊 Rapport';
                    vibrationPattern = [100];
                    break;
                case 'task':
                case 'task_assigned':
                    iconUrl = '/icons/task.png';
                    defaultActionTitle = '📋 Tâches';
                    vibrationPattern = [100];
                    break;
            }
        }

        // Overwrite if icon is explicitly provided in payload
        if (data.icon) {
            iconUrl = data.icon;
        }

        const options = {
            body: data.body,
            icon: iconUrl,
            badge: '/badge.png',
            vibrate: data.vibrate || vibrationPattern,
            sound: data.sound || undefined,
            color: data.color || undefined,
            tag: data.tag || 'sosab-notification',
            renotify: data.renotify !== undefined ? data.renotify : true,
            data: {
                url: data.link || '/'
            },
            actions: data.actions || [
                {
                    action: 'open_url',
                    title: defaultActionTitle
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
            // Check if there is already a window open with this URL and focus it
            for (let i = 0; i < windowClients.length; i++) {
                let client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
