import { semanticSearch } from './semanticSearch';
import { generateId } from './id';
import type { Friend, Event } from '@/types';
import { callGroq, getGroqApiKey } from './groq';

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
 * Generates an insight using the powerful Groq Llama 3 API.
 */
async function generateGroqDeepInsight(
    anonFriends: { id: string, level: number, xp: number, streak: number, relationship: string, createdAt: string }[],
    anonEvents: { id: string, friendId: string, category: string, sentiment: 'positive' | 'negative' | 'neutral', date: string, tags: string[], importance: number }[]
): Promise<DeepInsight | null> {
    const systemPrompt = `You are an expert relationship coach and psychological behavioral analyzer. 
Analyze the provided anonymized friendship and event data. Your goal is to provide a single, highly actionable, deeply insightful "DeepInsight" about the user's social life.

Identify an area that needs attention (e.g., a friend being neglected, too many negative events in a certain category, lack of recent interactions) OR highlight a strong positive trend (e.g., incredible momentum, strong support system).

The JSON output MUST be strictly structured as follows:
{
  "focus": "Short snappy title (max 5 words) e.g., 'Reconnect with Friend #1234', 'Momentum Building'",
  "insight": "A 2-3 sentence deep psychological or behavioral insight explaining what you see in the data and why it matters. Reference the data generically.",
  "tags": ["3-4 relevant single-word tags", "e.g.", "outreach", "consistency"],
  "category": "actionable" // must be one of: "actionable", "positive", "warning"
}`;

    const userPrompt = `Friends Data:
${JSON.stringify(anonFriends, null, 2)}

Events Data:
${JSON.stringify(anonEvents, null, 2)}

Analyze this and provide exactly the JSON matching the DeepInsight schema.`;

    const response = await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ], {
        model: 'llama-3.1-8b-instant',
        temperature: 0.6,
        response_format: { type: 'json_object' }
    });

    if (!response) return null;

    try {
        const parsed = JSON.parse(response) as DeepInsight;
        return parsed;
    } catch (err) {
        console.error('Failed to parse Groq DeepInsight JSON:', err);
        return null;
    }
}

/**
 * Runs analysis either dynamically through Groq cloud (if API key provided)
 * or via local MiniLM-L6-v2 in the browser via the semantic search worker.
 */
export async function requestDeepAnalysis(
    friends: Friend[],
    events: Event[]
): Promise<DeepInsight | null> {
    try {
        const { friends: anonFriends, events: anonEvents } = anonymizeData(friends, events);

        // 1. Try Groq Cloud first if API key exists
        if (getGroqApiKey()) {
            const groqInsight = await generateGroqDeepInsight(anonFriends, anonEvents);
            if (!groqInsight) {
                console.warn('Groq analysis failed, returning null to bypass local AI.');
            }
            return groqInsight;
        }

        // 2. Fallback to Local Semantic Worker
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

/**
 * Parses a raw voice dictation transcript into a structured Event object using Groq.
 */
export async function parseEventDictation(transcript: string): Promise<Partial<Event> | null> {
    if (!getGroqApiKey()) {
        console.warn('Groq API key required for voice parsing.');
        return null;
    }

    const systemPrompt = `You are an AI assistant that extracts event details from a user's voice dictation.
You must return a raw JSON object matching this schema:
{
  "title": "A concise title (max 5 words)",
  "description": "A polished version of the transcript, fixing grammar. CRITICAL: Maintain the FIRST-PERSON perspective. If the user says 'I called', write 'I called', NOT 'the speaker called' or 'the user called'. Keep 'I', 'me', and 'my' intact.",
  "category": "Pick exactly one from this list: 'behavior', 'reaction', 'habit', 'interaction', 'mood', 'conflict', 'gratitude'. Pick the closest match.",
  "sentiment": "one of: 'positive', 'neutral', 'negative'",
  "tags": ["1-3 single word lower-case tags"]
}
Only output the JSON object, nothing else.`;

    const userPrompt = `Transcript: "${transcript}"`;

    try {
        const response = await callGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], {
            model: 'llama-3.1-8b-instant',
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });

        if (!response) return null;
        return JSON.parse(response) as Partial<Event>;
    } catch (e) {
        console.error('Failed to parse dictation:', e);
        return null;
    }
}
