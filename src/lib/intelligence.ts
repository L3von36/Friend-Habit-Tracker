import type { Friend, Event } from '@/types';
import { type DeepInsight, generateGroqDeepInsight, generateGroqChatCompletion } from './groq';

/**
 * Anonymizes and summarizes friend and event data for privacy-preserving analysis.
 * Replaces names with generic labels (e.g., "Friend 1") and trims data to essentials.
 */
function anonymizeAndSummarizeData(friends: Friend[], events: Event[]): { friends: any[], events: any[] } {
    const idToAnonNameMap = new Map<string, string>();
    let friendCounter = 1;

    // Create a map from friend ID to an anonymous name
    friends.forEach(friend => {
        if (!idToAnonNameMap.has(friend.id)) {
            idToAnonNameMap.set(friend.id, `Friend ${friendCounter++}`);
        }
    });

    const anonSummarizedFriends = friends.map(friend => ({
        name: idToAnonNameMap.get(friend.id)!,
        relationship: friend.relationship,
        level: friend.level,
        streak: friend.streak,
        traits: friend.traits,
    }));

    // Take the 100 most recent events for analysis to keep payload small
    const recentEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 100);

    const anonSummarizedEvents = recentEvents.map(event => ({
        friendName: idToAnonNameMap.get(event.friendId),
        category: event.category,
        sentiment: event.sentiment,
        date: event.date.substring(0, 10), // Only send date, not time
        description: event.description.substring(0, 50) + (event.description.length > 50 ? '...' : '') // Truncate long descriptions
    }));

    return { friends: anonSummarizedFriends, events: anonSummarizedEvents };
}


/**
 * Runs analysis exclusively through Groq cloud.
 */
export async function requestDeepAnalysis(
    friends: Friend[],
    events: Event[]
): Promise<DeepInsight | null> {
    try {
        // Use the new summarizing and anonymizing function
        const { friends: anonFriends, events: anonEvents } = anonymizeAndSummarizeData(friends, events);
        
        const groqInsight = await generateGroqDeepInsight(anonFriends, anonEvents);
        
        if (!groqInsight) {
            console.warn('[intelligence] Groq analysis did not return a valid insight. This might be due to a temporary service issue.');
        }

        return groqInsight;

    } catch (error) {
        console.error('Deep analysis failed:', error);
        return null;
    }
}

/**
 * Generates a chat completion exclusively through the Groq API.
 */
export async function requestChatCompletion(
    friends: Friend[],
    events: Event[],
    chatHistory: { role: 'user' | 'assistant', content: string }[]
): Promise<string | null> {
    try {
        // Chat also benefits from this summarization
        const { friends: anonFriends, events: anonEvents } = anonymizeAndSummarizeData(friends, events);
        const content = await generateGroqChatCompletion(anonFriends, anonEvents, chatHistory);
        return content;
    } catch (error) {
        console.error('Chat completion failed:', error);
        return null;
    }
}
export type { DeepInsight };

