import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { CATEGORIES } from '@/types';

export function useStats() {
    const { friends, events } = useStore();

    const aggregateStats = useMemo(() => {
        const categoryCounts = events.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalFriends: friends.length,
            totalEvents: events.length,
            positiveEvents: events.filter(e => e.sentiment === 'positive').length,
            negativeEvents: events.filter(e => e.sentiment === 'negative').length,
            neutralEvents: events.filter(e => e.sentiment === 'neutral').length,
            activeStreaks: friends.reduce((sum, f) => sum + (f.streak || 0), 0),
            categoryCounts
        };
    }, [friends, events]);

    const tagStats = useMemo(() => {
        const topTags = events
            .flatMap(e => e.tags)
            .reduce((acc, tag) => {
                acc[tag] = (acc[tag] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        return Object.entries(topTags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [events]);

    const recentEvents = useMemo(() => {
        return [...events]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [events]);

    return {
        friends,
        events,
        aggregateStats,
        tagStats,
        recentEvents
    };
}
