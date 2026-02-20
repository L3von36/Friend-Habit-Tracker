import { toast } from 'sonner';

interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
}

interface NotificationOptions {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    actions?: NotificationAction[];
    requireInteraction?: boolean;
    vibrate?: number[];
}

export async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'granted') return true;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

export async function showQuickReplyNotification(
    title: string,
    options: NotificationOptions,
    onAction?: (action: string) => void
) {
    if (!('Notification' in window)) {
        // Fallback to sonner toast for non-supporting browsers
        toast(title, {
            description: options.body,
            action: options.actions?.[0] ? {
                label: options.actions[0].title,
                onClick: () => onAction?.(options.actions![0].action)
            } : undefined
        });
        return;
    }

    if (Notification.permission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) return;
    }

    // If we have a service worker, use it to show a notification that can persist
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
        registration.showNotification(title, {
            ...options,
            vibrate: [200, 100, 200],
        } as any);

        // Listen for action clicks (handled in sw.js or via message)
        // For this simple version, we'll use a BroadcastChannel or similar if needed
        // But for "Integration" we at least show them.
    } else {
        new Notification(title, options);
    }
}

// Add a simple listener for the service worker message if needed
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
            console.log('Notification action received:', event.data.action);
            // We could use an event emitter here to notify App.tsx
            window.dispatchEvent(new CustomEvent('pwa-notification-action', { detail: event.data }));
        }
    });
}
