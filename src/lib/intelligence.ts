import { semanticSearch } from './semanticSearch';
import { generateId } from './id';
import type { Friend, Event } from '@/types';

export interface DeepInsight {
    focus: string;
    insight: string;
    tags: string[];
    category: 'actionable' | 'positive' | 'warning';
}

/**
 * Strips PII from friend/event data before analysis.
 * Names and descriptions are removed; only metadata is used.
 */
export function anonymizeData(friends: Friend[], events: Event[]) {
    const anonymizedFriends = friends.map(f => ({
        id: f.id,
        level: f.level ?? 1,
        xp: f.xp ?? 0,
        streak: f.streak ?? 0,
        relationship: f.relationship,
        createdAt: f.createdAt,
    }));

    const anonymizedEvents = events.map(e => ({
        id: e.id,
        friendId: e.friendId,
        category: e.category,
        sentiment: e.sentiment,
        date: e.date,
        tags: e.tags,
        importance: e.importance,
        // Deliberately strip description/title to preserve privacy
    }));

    return { friends: anonymizedFriends, events: anonymizedEvents };
}

/**
 * Runs real MiniLM-L6-v2 analysis directly in the browser via the semantic
 * search worker. No server required — fully offline & private.
 */
export async function requestDeepAnalysis(
    friends: Friend[],
    events: Event[]
): Promise<DeepInsight | null> {
    try {
        const { friends: anonFriends, events: anonEvents } = anonymizeData(friends, events);

        return await new Promise<DeepInsight | null>((resolve) => {
            const requestId = generateId();
            const worker = (semanticSearch as any).worker as Worker | null;

            if (!worker) {
                console.warn('Semantic worker not available');
                resolve(null);
                return;
            }

            const handler = (event: MessageEvent) => {
                const { type, payload, requestId: rid } = event.data;
                if (rid !== requestId) return;

                if (type === 'analyze_complete') {
                    worker.removeEventListener('message', handler);
                    resolve(payload as DeepInsight);
                } else if (type === 'error') {
                    worker.removeEventListener('message', handler);
                    console.error('Worker analysis error:', payload);
                    resolve(null);
                }
            };

            worker.addEventListener('message', handler);
            worker.postMessage({
                type: 'analyze',
                payload: { friends: anonFriends, events: anonEvents },
                requestId,
            });

            // Timeout safety: resolve null after 30s
            setTimeout(() => {
                worker.removeEventListener('message', handler);
                resolve(null);
            }, 30_000);
        });
    } catch (error) {
        console.error('Deep analysis failed:', error);
        return null;
    }
}
