import type { Friend, Event } from '@/types';
import { toast } from 'sonner';

interface NudgeResult {
    friend: Friend;
    message: string;
    type: 'overdue' | 'birthday' | 'positive-streak';
    daysAgo?: number;
}

function getDaysAgo(dateStr: string): number {
    const date = new Date(dateStr);
    const today = new Date();
    return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysUntilBirthday(birthday: string): number {
    const today = new Date();
    const bday = new Date(birthday);
    const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeNudges(friends: Friend[], events: Event[]): NudgeResult[] {
    const nudges: NudgeResult[] = [];
    const OVERDUE_THRESHOLD = 21; // 3 weeks
    const BIRTHDAY_WARNING = 7;   // 1 week before

    for (const friend of friends) {
        const friendEvents = events.filter(e => e.friendId === friend.id);
        const sortedEvents = [...friendEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastEvent = sortedEvents[0];

        // Check overdue contact
        if (lastEvent) {
            const daysAgo = getDaysAgo(lastEvent.date);
            if (daysAgo >= OVERDUE_THRESHOLD) {
                nudges.push({
                    friend,
                    message: `You haven't logged anything with ${friend.name} in ${daysAgo} days.`,
                    type: 'overdue',
                    daysAgo,
                });
            }
        } else if (friend.createdAt) {
            const daysAgo = getDaysAgo(friend.createdAt);
            if (daysAgo >= OVERDUE_THRESHOLD) {
                nudges.push({
                    friend,
                    message: `You added ${friend.name} ${daysAgo} days ago but haven't logged anything yet.`,
                    type: 'overdue',
                    daysAgo,
                });
            }
        }

        // Check upcoming birthday
        if (friend.birthday) {
            const daysUntil = getDaysUntilBirthday(friend.birthday);
            if (daysUntil === 0) {
                nudges.push({ friend, message: `🎂 Today is ${friend.name}'s birthday!`, type: 'birthday' });
            } else if (daysUntil <= BIRTHDAY_WARNING) {
                nudges.push({ friend, message: `🎂 ${friend.name}'s birthday is in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}!`, type: 'birthday' });
            }
        }
    }

    // Sort: birthdays first, then by days overdue (most overdue first)
    return nudges
        .sort((a, b) => {
            if (a.type === 'birthday' && b.type !== 'birthday') return -1;
            if (b.type === 'birthday' && a.type !== 'birthday') return 1;
            return (b.daysAgo ?? 0) - (a.daysAgo ?? 0);
        })
        .slice(0, 5); // cap at 5 to avoid spam
}

const SHOWN_KEY = 'nudges-shown-date';

export function showNudgesOnce(friends: Friend[], events: Event[], onSelectFriend: (f: Friend) => void) {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem(SHOWN_KEY);
    if (lastShown === today) return; // Only once per day

    const nudges = computeNudges(friends, events);
    if (!nudges.length) return;

    localStorage.setItem(SHOWN_KEY, today);

    // Show top 3 nudges with slight delays
    nudges.slice(0, 3).forEach((nudge, i) => {
        setTimeout(() => {
            toast(nudge.message, {
                duration: 8000,
                icon: nudge.type === 'birthday' ? '🎂' : nudge.type === 'overdue' ? '💬' : '⭐',
                action: {
                    label: `View ${nudge.friend.name.split(' ')[0]}`,
                    onClick: () => onSelectFriend(nudge.friend),
                },
            });
        }, i * 1200);
    });
}
