import { describe, it, expect } from 'vitest';
import { getLevel, updateFriendXP, getLevelProgress, LEVEL_THRESHOLDS } from '../gamification';
import type { Friend } from '@/types';

describe('Gamification Engine', () => {
    describe('getLevel', () => {
        it('should return level 1 for 0 XP', () => {
            expect(getLevel(0)).toBe(1);
        });

        it('should return level 2 for 100 XP', () => {
            expect(getLevel(100)).toBe(2);
        });

        it('should return level 5 for 1000 XP', () => {
            expect(getLevel(1000)).toBe(5);
        });

        it('should return max level for very high XP', () => {
            expect(getLevel(10000)).toBe(LEVEL_THRESHOLDS.length);
        });
    });

    describe('getLevelProgress', () => {
        it('should calculate correct percentage for level 1 progress', () => {
            const progress = getLevelProgress(50);
            expect(progress.percent).toBe(50); // 50/100
            expect(progress.next).toBe(100);
        });

        it('should return 100% for max level', () => {
            const progress = getLevelProgress(5000);
            expect(progress.percent).toBe(100);
        });
    });

    describe('updateFriendXP', () => {
        const mockFriend: Friend = {
            id: '1',
            name: 'Test Friend',
            xp: 0,
            level: 1,
            addedDate: new Date().toISOString(),
            tags: [],
            sentiment: 'neutral',
            category: 'friend'
        };

        it('should increase XP and not level up if under threshold', () => {
            const result = updateFriendXP(mockFriend, 50);
            expect(result.friend.xp).toBe(50);
            expect(result.friend.level).toBe(1);
            expect(result.leveledUp).toBe(false);
        });

        it('should level up if threshold is crossed', () => {
            const result = updateFriendXP(mockFriend, 150);
            expect(result.friend.xp).toBe(150);
            expect(result.friend.level).toBe(2);
            expect(result.leveledUp).toBe(true);
        });
    });
});
