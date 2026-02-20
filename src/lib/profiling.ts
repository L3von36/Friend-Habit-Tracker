import type { Friend, Event, Memory } from '@/types';

export interface PsychologicalProfile {
    archetype: string;
    archetypeIcon: string;
    archetypeColor: string;
    archetypeDescription: string;
    traits: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
    };
    communicationStyle: 'Direct' | 'Passive' | 'Aggressive' | 'Diplomatic' | 'Analytical';
    coreValues: string[];
    riskFactors: string[];
    motivators: string[];
    stressTriggers: string[];
    confidence: number;
}

// Helper to calculate score based on tags
const calculateTraitScore = (events: Event[], friend: Friend, positiveTags: string[], negativeTags: string[]): number => {
    let score = 50; // Base score

    // Tag Analysis
    const allTags = [...events.flatMap(e => e.tags), ...friend.traits];
    allTags.forEach(tag => {
        if (positiveTags.includes(tag)) score += 5;
        if (negativeTags.includes(tag)) score -= 5;
    });

    return Math.max(0, Math.min(100, score));
};

export const generatePsychologicalProfile = (friend: Friend, events: Event[], memories: Memory[]): PsychologicalProfile => {
    const friendEvents = events.filter(e => e.friendId === friend.id);
    const friendMemories = memories.filter(m => m.friendId === friend.id);
    const dataVolume = friendEvents.length + friend.traits.length + friendMemories.length;
    const confidence = Math.min(95, Math.floor((dataVolume / 20) * 100));

    const traits = {
        openness: calculateTraitScore(friendEvents, friend,
            ['Creative', 'Curious', 'Adventurous', 'Artistic', 'Flexible', 'Open-minded'],
            ['Conservative', 'Traditional', 'Rigid', 'Routine', 'Closed-minded']
        ),
        conscientiousness: calculateTraitScore(friendEvents, friend,
            ['Reliable', 'Organized', 'Punctual', 'Disciplined', 'Responsible', 'Consistent'],
            ['Flaky', 'Late', 'Messy', 'Impulsive', 'Careless', 'Unreliable']
        ),
        extraversion: calculateTraitScore(friendEvents, friend,
            ['Social', 'Energetic', 'Talkative', 'Assertive', 'Outgoing', 'Funny'],
            ['Quiet', 'Shy', 'Reserved', 'Solitary', 'Passive']
        ),
        agreeableness: calculateTraitScore(friendEvents, friend,
            ['Kind', 'Supportive', 'Empathetic', 'Friendly', 'Cooperative', 'Giving'],
            ['Critical', 'Stubborn', 'Competitive', 'Selfish', 'Hostile']
        ),
        neuroticism: calculateTraitScore(friendEvents, friend,
            ['Anxious', 'Moody', 'Jealous', 'Sensitive', 'Dramatic'],
            ['Calm', 'Stable', 'Confident', 'Resilient', 'Relaxed']
        ),
    };

    // 2. Behavioral Archetype (Phase 2 alignment)
    let archetype = 'The Observer';
    let archetypeIcon = '👁️';
    let archetypeColor = 'text-slate-400';
    let archetypeDescription = 'Quietly observant, providing steady presence without demanding attention.';

    if (traits.agreeableness > 75 && (traits.conscientiousness > 60 || traits.neuroticism > 50)) {
        archetype = 'The Supportive Pillar';
        archetypeIcon = '🛡️';
        archetypeColor = 'text-emerald-500';
        archetypeDescription = 'Always there when you need a listening ear or a helping hand.';
    } else if (traits.openness > 75 && traits.extraversion > 60) {
        archetype = 'The Adventure Seeker';
        archetypeIcon = '🏔️';
        archetypeColor = 'text-sky-500';
        archetypeDescription = 'Your go-to person for spontaneous trips and new experiences.';
    } else if (traits.openness > 70 && traits.extraversion < 50) {
        archetype = 'The Intellectual';
        archetypeIcon = '🧠';
        archetypeColor = 'text-violet-500';
        archetypeDescription = 'Challenges your thinking and shares deep, philosophical insights.';
    } else if (traits.extraversion > 75 && traits.agreeableness > 50) {
        archetype = 'The Life of the Party';
        archetypeIcon = '🎉';
        archetypeColor = 'text-amber-500';
        archetypeDescription = 'Brings energy and laughter to every gathering.';
    } else if (traits.conscientiousness > 75 && traits.openness > 60) {
        archetype = 'The Mentor';
        archetypeIcon = '🎓';
        archetypeColor = 'text-rose-500';
        archetypeDescription = 'Provides guidance, wisdom, and helps you grow.';
    } else if ((friend.streak || 0) > 4) {
        archetype = 'The Consistent Confidant';
        archetypeIcon = '🤝';
        archetypeColor = 'text-violet-400';
        archetypeDescription = 'Reliable, steady, and tracks a long history of shared moments.';
    }

    // ... rest of logic (vulnerabilities, triggers) stays same but adapted to return additional fields ...
    // (truncating for brevity in replacement but I will include all required fields)

    // Communication Style
    let communicationStyle: PsychologicalProfile['communicationStyle'] = 'Diplomatic';
    if (traits.extraversion > 70 && traits.agreeableness < 50) communicationStyle = 'Direct';
    else if (traits.extraversion < 40 && traits.agreeableness < 40) communicationStyle = 'Analytical';
    else if (traits.neuroticism > 60 && traits.agreeableness < 40) communicationStyle = 'Aggressive';
    else if (traits.extraversion < 40 && traits.agreeableness > 60) communicationStyle = 'Passive';

    const motivators = [];
    if (traits.openness > 70) motivators.push('Novelty', 'Growth');
    if (traits.conscientiousness > 70) motivators.push('Order', 'Achievement');
    if (traits.extraversion > 70) motivators.push('Social Status', 'Excitement');
    if (traits.agreeableness > 70) motivators.push('Harmony', 'Connection');
    if (traits.neuroticism > 70) motivators.push('Security', 'Validation');

    const riskFactors = [];
    const stressTriggers = [];
    if (traits.neuroticism > 75) { riskFactors.push('Emotional Volatility'); stressTriggers.push('Uncertainty'); }
    if (traits.conscientiousness < 30) { riskFactors.push('Unreliability'); stressTriggers.push('Strict Deadlines'); }
    if (traits.agreeableness < 30) { riskFactors.push('Conflict Prone'); stressTriggers.push('Emotional Appeals'); }

    if (motivators.length === 0) motivators.push('Comfort', 'Stability');
    if (riskFactors.length === 0) riskFactors.push('None prominent');
    if (stressTriggers.length === 0) stressTriggers.push('Significant Life Changes');

    return {
        archetype,
        archetypeIcon,
        archetypeColor,
        archetypeDescription,
        traits,
        communicationStyle,
        coreValues: motivators,
        riskFactors,
        motivators,
        stressTriggers,
        confidence
    };
};
