import type { Friend, Event } from '@/types';
import { generatePsychologicalProfile } from './profiling';

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

export function generateSmartDrafts(
    friend: Friend,
    events: Event[],
    intent: DraftIntent
): string[] {
    const profile = generatePsychologicalProfile(friend, events, []); // Memories not strictly needed for this
    const templates = TEMPLATES[intent];

    // Filter and score templates based on profile
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
