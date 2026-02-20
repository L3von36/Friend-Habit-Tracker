import type { Friend, Event } from '@/types';

export interface Archetype {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    requirements: string;
}

export const ARCHETYPES: Archetype[] = [
    {
        id: 'supportive_pillar',
        name: 'The Supportive Pillar',
        description: 'Always there when you need a listening ear or a helping hand.',
        icon: '🛡️',
        color: 'text-emerald-500',
        requirements: 'High empathetic traits or frequent support-related interactions.'
    },
    {
        id: 'adventure_seeker',
        name: 'The Adventure Seeker',
        description: 'Your go-to person for spontaneous trips and new experiences.',
        icon: '🏔️',
        color: 'text-sky-500',
        requirements: 'Active/Adventurous traits or outing-heavy history.'
    },
    {
        id: 'intellectual',
        name: 'The Intellectual',
        description: 'Challenges your thinking and shares deep, philosophical insights.',
        icon: '🧠',
        color: 'text-violet-500',
        requirements: 'Curious/Smart traits or deep talk-heavy history.'
    },
    {
        id: 'life_of_party',
        name: 'The Life of the Party',
        description: 'Brings energy and laughter to every gathering.',
        icon: '🎉',
        color: 'text-amber-500',
        requirements: 'Outgoing/Funny traits or social-heavy history.'
    },
    {
        id: 'mentor',
        name: 'The Mentor',
        description: 'Provides guidance, wisdom, and helps you grow.',
        icon: '🎓',
        color: 'text-rose-500',
        requirements: 'Wise/Experienced traits or professional/growth history.'
    },
    {
        id: 'consistent_confidant',
        name: 'The Consistent Confidant',
        description: 'Reliable, steady, and tracks a long history of shared moments.',
        icon: '🤝',
        color: 'text-slate-500',
        requirements: 'Long-term high streak or high interaction count.'
    }
];

export function getFriendArchetype(friend: Friend, events: Event[]): Archetype {
    const friendEvents = events.filter(e => e.friendId === friend.id);
    const traits = friend.name.toLowerCase() + ' ' + friend.traits.join(' ').toLowerCase();

    // Scoring
    let scores = {
        supportive_pillar: 0,
        adventure_seeker: 0,
        intellectual: 0,
        life_of_party: 0,
        mentor: 0,
        consistent_confidant: 0
    };

    // Trait analysis
    if (/empathetic|reliable|kind|supportive|listener/i.test(traits)) scores.supportive_pillar += 3;
    if (/adventurous|active|wild|travel|sporty/i.test(traits)) scores.adventure_seeker += 3;
    if (/smart|curious|intellectual|nerdy|deep/i.test(traits)) scores.intellectual += 3;
    if (/funny|outgoing|social|energetic|party/i.test(traits)) scores.life_of_party += 3;
    if (/wise|mentor|teacher|experienced|leader/i.test(traits)) scores.mentor += 3;

    // Event analysis
    friendEvents.forEach(e => {
        const content = (e.title + ' ' + e.description + ' ' + e.category).toLowerCase();
        if (/help|support|listen|sad|tough/i.test(content)) scores.supportive_pillar += 1;
        if (/trip|hike|travel|new|explore|outside/i.test(content)) scores.adventure_seeker += 1;
        if (/talk|discuss|learn|book|philosophy|idea/i.test(content)) scores.intellectual += 1;
        if (/party|celebrate|drink|club|laugh|event/i.test(content)) scores.life_of_party += 1;
        if (/advice|work|career|growth|future/i.test(content)) scores.mentor += 1;
    });

    // Consistency check
    if ((friend.streak || 0) > 4) scores.consistent_confidant += 5;
    if (friendEvents.length > 20) scores.consistent_confidant += 3;

    // Determine winner
    let maxScore = -1;
    let winner = ARCHETYPES[0];

    Object.entries(scores).forEach(([id, score]) => {
        if (score > maxScore) {
            maxScore = score;
            winner = ARCHETYPES.find(a => a.id === id) || ARCHETYPES[0];
        }
    });

    // Default to supportive if very little data
    if (maxScore === 0) return ARCHETYPES[0];

    return winner;
}
