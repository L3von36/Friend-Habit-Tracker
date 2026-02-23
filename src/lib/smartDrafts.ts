import type { Friend, Event } from '@/types';
import { generatePsychologicalProfile } from './profiling';
import { callGroq, getGroqApiKey } from './groq';

export type DraftIntent = 'greeting' | 'check-in' | 'plans' | 'gratitude' | 'apology' | 'celebrate' | 'support';

interface DraftTemplate {
    text: string;
    tone: 'casual' | 'heartfelt' | 'formal' | 'brief';
    condition?: (friend: Friend, events: Event[], profile: any) => boolean;
}

const TEMPLATES: Record<DraftIntent, DraftTemplate[]> = {
    greeting: [
        { text: "Hey! 👋", tone: 'brief' },
        { text: "Hi [Name], hope you're having a good week!", tone: 'casual' },
        { text: "Hello [Name], it's been a while.", tone: 'formal' },
        { text: "Thinking of you!", tone: 'heartfelt' },
    ],
    'check-in': [
        { text: "Just wanted to say hi and see how you're doing.", tone: 'casual' },
        { text: "Hey, just checking in. Everything okay?", tone: 'brief' },
        { text: "I've been thinking about you and wanted to reach out. How have things been?", tone: 'heartfelt' },
    ],
    plans: [
        { text: "Free this weekend?", tone: 'brief' },
        { text: "We should hang out soon! When are you free?", tone: 'casual' },
        { text: "I'd love to catch up properly. Let's schedule a time to meet.", tone: 'formal' },
    ],
    gratitude: [
        { text: "Thanks for everything.", tone: 'brief' },
        { text: "I really appreciate you being there for me.", tone: 'heartfelt' },
        { text: "Just wanted to say thanks for being awesome!", tone: 'casual' },
    ],
    apology: [
        { text: "Sorry about earlier.", tone: 'brief' },
        { text: "I wanted to apologize for what happened. I value our friendship.", tone: 'heartfelt' },
        { text: "My bad, I didn't mean to upset you.", tone: 'casual' },
    ],
    celebrate: [
        { text: "Congrats!! 🎉", tone: 'brief' },
        { text: "So happy for you! You deserve it.", tone: 'heartfelt' },
        { text: "That's amazing news! Way to go!", tone: 'casual' },
    ],
    support: [
        { text: "I'm here for you.", tone: 'brief' },
        { text: "I know things are tough right now, but I've got your back.", tone: 'heartfelt' },
        { text: "Let me know if you need anything at all.", tone: 'casual' },
    ],
};

export async function generateSmartDrafts(
    friend: Friend,
    events: Event[],
    intent: DraftIntent
): Promise<string[]> {
    const profile = generatePsychologicalProfile(friend, events, []);

    // 1. Check for Groq API
    if (getGroqApiKey()) {
        try {
            const systemPrompt = `You are an expert relationship communication assistant.
Your task is to draft exactly 3 short, distinct message options based on the requested Intent, the Friend's psychological profile, and recent events.

The 3 options should vary slightly in tone (e.g., Casual, Heartfelt, Brief).
Output ONLY a JSON array of strings. No markdown, no explanations.
Example output: ["Hey, just checking in!", "Thinking of you today.", "Hope you're having a good week!"]`;

            const userPrompt = `Intent: ${intent}
Friend Name: ${friend.name}
Friend Traits: ${profile.traits}
Communication Style: ${profile.communicationStyle}
Recent Events:
${JSON.stringify(events.slice(-3).map(e => ({ title: e.title, sentiment: e.sentiment, category: e.category })), null, 2)}

Provide exactly 3 drafts tailored to this friend in JSON array format [ "Draft 1", "Draft 2", "Draft 3" ]. Replace any placeholders with the actual friend name.`;

            const response = await callGroq([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ], {
                model: 'llama-3.1-8b-instant',
                temperature: 0.7,
            });

            if (response) {
                try {
                    // Try to parse JSON array out of response (in case it wrapped it in text)
                    const matches = response.match(/\[([\s\S]*?)\]/);
                    if (matches) {
                        const parsed = JSON.parse(matches[0]);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            return parsed.map(String).slice(0, 3);
                        }
                    }
                } catch (e) {
                    console.warn('Groq Smart Drafts parsing failed, falling back locally.', e);
                }
            }
        } catch (e) {
            console.warn('Groq Smart Drafts api failed, falling back locally.', e);
        }
    }

    // 2. Fallback to Algorithmic Templates
    const templates = TEMPLATES[intent];
    const scoredTemplates = templates.map(template => {
        let score = 0;

        // 1. Match Communication Style
        if (profile.communicationStyle === 'Direct' && template.tone === 'brief') score += 10;
        if (profile.communicationStyle === 'Diplomatic' && template.tone === 'formal') score += 10;
        if (profile.communicationStyle === 'Passive' && template.tone === 'casual') score += 5;

        // 2. Match Traits
        if (profile.traits.agreeableness > 70 && template.tone === 'heartfelt') score += 5;
        if (profile.traits.conscientiousness > 70 && template.tone === 'formal') score += 5;
        if (profile.traits.extraversion > 70 && template.tone === 'casual') score += 5;

        // 3. Contextual Boosts (simple for now)
        if (intent === 'apology' && profile.riskFactors.includes('Conflict Prone')) {
            if (template.tone === 'heartfelt') score += 10; // Be extra careful
        }

        return { ...template, score };
    });

    // Sort by score and return top 3
    return scoredTemplates
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(t => t.text.replace('[Name]', friend.name.split(' ')[0]));
}

export function suggestIntent(_friend: Friend, events: Event[]): DraftIntent {
    const recentEvents = events.slice(-3);
    const lastEvent = recentEvents[recentEvents.length - 1];

    if (!lastEvent) return 'greeting';

    // 1. Check for negative events -> Apology or Support
    if (lastEvent.sentiment === 'negative') {
        if (lastEvent.category === 'conflict') return 'apology';
        if (lastEvent.category === 'mood' || lastEvent.category === 'behavior') return 'support';
    }

    // 2. Check for positive events -> Celebrate or Gratitude
    if (lastEvent.sentiment === 'positive') {
        if (lastEvent.importance >= 4) return 'celebrate';
        if (lastEvent.category === 'gratitude') return 'gratitude';
    }

    // 3. Check time since last event -> Check-in
    const daysSince = (new Date().getTime() - new Date(lastEvent.date).getTime()) / (1000 * 3600 * 24);
    if (daysSince > 14) return 'check-in';

    return 'greeting';
}
