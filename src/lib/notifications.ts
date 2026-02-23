import type { Friend } from '@/types';
import { differenceInDays } from 'date-fns';

export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

export function sendLocalNotification(title: string, options?: NotificationOptions) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        // Determine icon based on system theme preferences if none provided
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const defaultIcon = isDark ? '/icon-192-maskable.png' : '/icon-192.png';

        const notification = new Notification(title, {
            icon: defaultIcon,
            badge: defaultIcon,
            ...options
        });

        // Optional click handler to focus the window
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

/**
 * Checks all friends for streaks that are expiring (e.g. they haven't been contacted in 6 days and the streak drops at 7)
 * Fired periodically to warn the user.
 */
export function checkAndNotifyExpiringStreaks(friends: Friend[]) {
    if (Notification.permission !== 'granted') return;

    const now = new Date();

    friends.forEach(friend => {
        // Only check friends with an active streak (>0)
        if (!friend.streak || friend.streak <= 0) return;

        // Default last update to created date if not available
        const lastUpdateDate = friend.lastStreakUpdate ? new Date(friend.lastStreakUpdate) : new Date(friend.createdAt);

        // Calculate days since last streak update
        const daysSinceContact = differenceInDays(now, lastUpdateDate);

        // Scenario: Streaks usually expire after 7 days. If it's been 6 days, send a warning!
        if (daysSinceContact === 6) {
            // Create a unique deterministic ID for the tag so we don't spam the same notification
            const tag = `streak-warning-${friend.id}-${lastUpdateDate.getTime()}`;

            sendLocalNotification(`Keep the streak alive! 🔥`, {
                body: `Your streak of ${friend.streak} with ${friend.name} expires tomorrow. Log an event to keep it going!`,
                tag: tag,
                requireInteraction: true // Keep it on screen until dismissed or clicked
            });
        }
    });
}
