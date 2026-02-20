import { generateId } from './id';
import type { Friend, Event, Quest } from '@/types';

export const LEVEL_THRESHOLDS = [
    0,      // Level 1
    100,    // Level 2
    300,    // Level 3
    600,    // Level 4
    1000,   // Level 5
    1500,   // Level 6
    2100,   // Level 7
    2800,   // Level 8
    3600,   // Level 9
    4500,   // Level 10 (Max for now)
];

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export const XP_VALUES = {
    INTERACTION: 15,
    MEMORY: 50,
    GOAL_MET: 100,
    POSITIVE_SENTIMENT: 5,
    DETAILED_NOTE: 10,
    STREAK_BONUS: 20,
};

export interface Badge {
    level: number;
    title: string;
    icon: string;
    color: string;
}

export const BADGES: Badge[] = [
    { level: 1, title: 'Acquaintance', icon: '🤝', color: 'text-slate-400' },
    { level: 3, title: 'Associate', icon: '👤', color: 'text-blue-400' },
    { level: 5, title: 'Trusted Friend', icon: '⭐', color: 'text-violet-400' },
    { level: 7, title: 'Close Confidant', icon: '💎', color: 'text-purple-400' },
    { level: 9, title: 'Soul Sibling', icon: '🔥', color: 'text-amber-500' },
    { level: 10, title: 'Inner Circle', icon: '👑', color: 'text-rose-500' },
];

export function getLevelBadge(level: number): Badge {
    return [...BADGES].reverse().find(b => level >= b.level) || BADGES[0];
}

export function getLevel(xp: number): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            return i + 1;
        }
    }
    return 1;
}

export function getLevelProgress(xp: number): { current: number; next: number; percent: number } {
    const level = getLevel(xp);
    if (level >= MAX_LEVEL) {
        return { current: xp, next: xp, percent: 100 };
    }

    const currentThreshold = LEVEL_THRESHOLDS[level - 1];
    const nextThreshold = LEVEL_THRESHOLDS[level];
    const progress = xp - currentThreshold;
    const totalNeeded = nextThreshold - currentThreshold;

    return {
        current: xp,
        next: nextThreshold,
        percent: Math.min(100, Math.floor((progress / totalNeeded) * 100)),
    };
}

export function calculateEventXP(event: Event): number {
    let xp = XP_VALUES.INTERACTION;

    if (event.sentiment === 'positive') {
        xp += XP_VALUES.POSITIVE_SENTIMENT;
    }

    if (event.description.length > 50) {
        xp += XP_VALUES.DETAILED_NOTE;
    }

    if (event.category === 'interaction') {
        xp += 5;
    }

    return xp;
}

export function updateFriendXP(friend: Friend, xpGained: number): { friend: Friend; leveledUp: boolean } {
    const newXP = (friend.xp || 0) + xpGained;
    const oldLevel = friend.level || 1;
    const newLevel = getLevel(newXP);

    return {
        friend: {
            ...friend,
            xp: newXP,
            level: newLevel,
        },
        leveledUp: newLevel > oldLevel,
    };
}

export function checkStreak(friend: Friend, eventDate: Date): Friend {
    const lastContact = friend.lastContactDate ? new Date(friend.lastContactDate) : null;
    const today = new Date(eventDate);

    let newStreak = friend.streak || 0;

    if (lastContact) {
        const diffTime = Math.abs(today.getTime() - lastContact.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) { // Weekly streak logic for simplicity
            // If it's a new week (simplified: just > 1 day since last contact but within 7 days)
            // A better logic would be checking calendar weeks.
            // For now, let's say if contact is consistent (<= 7 days gap), we iterate or maintain.
            // Wait, streak usually means consecutive units. 
            // Let's implement WEEKLY streak. 
            // If last contact was in the PREVIOUS week (Monday-Sunday), increment.
            // If last contact was THIS week, maintain.
            // If last contact was > 1 week ago, reset.

            const lastWeek = getWeekNumber(lastContact);
            const thisWeek = getWeekNumber(today);

            if (thisWeek === lastWeek + 1 || (thisWeek === 1 && lastWeek >= 52)) {
                newStreak += 1;
            } else if (thisWeek > lastWeek + 1) {
                newStreak = 1; // Reset to 1 (current interaction starts new streak)
            }
            // If same week, do nothing
        } else {
            newStreak = 1; // Reset
        }
    } else {
        newStreak = 1; // First interaction
    }

    return {
        ...friend,
        streak: newStreak,
        lastContactDate: today.toISOString(),
    };
}

function getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export const QUEST_TEMPLATES: Pick<Quest, 'title' | 'description' | 'type' | 'targetCount' | 'rewardXP'>[] = [
    { title: 'Social Butterfly', description: 'Log 3 interactions this week', type: 'contact', targetCount: 3, rewardXP: 50 },
    { title: 'Memory Lane', description: 'Add a new memory', type: 'memory', targetCount: 1, rewardXP: 30 },
    { title: 'Good Vibes', description: 'Log a positive event', type: 'event', targetCount: 1, rewardXP: 20 },
    { title: 'Goal Crusher', description: 'Complete a relationship goal', type: 'goal', targetCount: 1, rewardXP: 100 },
];

export function generateQuests(): Quest[] {
    // Select 3 random quests
    const shuffled = [...QUEST_TEMPLATES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    return selected.map(t => ({
        ...t,
        id: generateId(),
        currentCount: 0,
        completed: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week expiry
    }));
}
