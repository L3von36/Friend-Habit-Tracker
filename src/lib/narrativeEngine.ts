// src/lib/narrativeEngine.ts
import type { Friend, Event } from '@/types';

export function generateNarrativeSummary(friend: Friend, events: Event[]): string {
    if (events.length === 0) {
        return `A new thread in your loom. Your story with ${friend.name} is just beginning, waiting for the first patterns to be woven.`;
    }

    const totalEvents = events.length;
    const positiveEvents = events.filter(e => e.sentiment === 'positive').length;
    const sentimentRatio = positiveEvents / totalEvents;

    const categories = events.map(e => e.category);
    const topCategory = categories.reduce((a, b, _, arr) =>
        (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b),
        categories[0]
    );

    const timeDiff = new Date().getTime() - new Date(friend.createdAt).getTime();
    const daysSinceStart = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    let tone = "";
    if (sentimentRatio > 0.8) tone = "exceptionally bright and harmonious";
    else if (sentimentRatio > 0.5) tone = "steady and supportive";
    else tone = "complex and evolving";

    let pattern = "";
    switch (topCategory) {
        case 'interaction': pattern = "frequent shared moments"; break;
        case 'reaction': pattern = "deeply resonant conversations"; break;
        case 'habit': pattern = "reliable shared rhythms"; break;
        case 'gratitude': pattern = "an underlying current of appreciation"; break;
        default: pattern = "steady growth";
    }

    const narratives = [
        `Over the past ${daysSinceStart} days, your connection with ${friend.name} has woven a pattern of ${pattern}.`,
        `The loom shows a relationship that is ${tone}, often centered around ${topCategory === 'interaction' ? 'physical presence' : topCategory === 'reaction' ? 'emotional depth' : 'shared life experiences'}.`,
        `With ${totalEvents} shared memories, you've built a tapestry that feels ${sentimentRatio > 0.7 ? 'vibrant and full of light' : 'durable and honest'}.`,
        sentimentRatio > 0.6 ? `There is a beautiful symmetry in how you support one another.` : `Every thread, even the difficult ones, adds strength to the overall design.`
    ];

    return narratives.join(' ');
}
