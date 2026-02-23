import type { Friend, Event } from '@/types';
import { CONVERSATION_STARTERS } from '@/types';
import { callGroq, getGroqApiKey } from './groq';

// Generate personalized conversation starters
export async function generateConversationStarters(friend: Friend, events: Event[]): Promise<string[]> {
  // 1. Check for Groq API
  if (getGroqApiKey()) {
    try {
      const systemPrompt = `You are an expert relationship coach.
Your task is to provide exactly 3 great conversation starters for the user to use with their friend.
The conversation starters should be highly personalized based on the friend's interests and recent events.
Output ONLY a JSON array of strings. No markdown, no explanations.
Example output: ["How was your weekend?", "Did you see that new movie?", "I remember you mentioning..."]`;

      const userPrompt = `Friend Name: ${friend.name}
Interests: ${friend.interests.join(', ')}
Traits: ${friend.traits.join(', ')}
Birthday: ${friend.birthday || 'Unknown'}
Recent Events:
${JSON.stringify(events.slice(-5).map(e => ({ title: e.title, sentiment: e.sentiment, category: e.category, tags: e.tags })), null, 2)}

Provide exactly 3 highly contextual and natural conversation starters in JSON array format [ "Starter 1", "Starter 2", "Starter 3" ].`;

      const response = await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        model: 'llama-3.1-8b-instant',
        temperature: 0.8,
      });

      if (response) {
        try {
          const matches = response.match(/\[([\s\S]*?)\]/);
          if (matches) {
            const parsed = JSON.parse(matches[0]);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed.map(String).slice(0, 3);
            }
          }
        } catch (e) {
          console.warn('Groq Conversational Starters parsing failed, falling back locally.', e);
        }
      }
    } catch (e) {
      console.warn('Groq Conversational api failed, falling back locally.', e);
    }
  }

  // 2. Fallback to Algorithmic Approach
  const starters: string[] = [];
  const recentEvents = events.slice(-5);

  // Based on recent events
  const recentTopics = recentEvents.flatMap(e => {
    if (e.category === 'mood' && e.sentiment === 'negative') {
      return [`I noticed you've seemed ${e.tags.find(t => ['Anxious', 'Stressed', 'Sad'].includes(t)) || 'down'} lately - want to talk about it?`];
    }
    if (e.category === 'interaction' && e.sentiment === 'positive') {
      return ["That was such a great time we had recently!"];
    }
    return [];
  });

  starters.push(...recentTopics.slice(0, 2));

  // Based on interests
  if (friend.interests.length > 0) {
    const randomInterest = friend.interests[Math.floor(Math.random() * friend.interests.length)];
    const interestStarters: Record<string, string> = {
      'Sports': 'Did you catch any games recently?',
      'Music': 'Have you discovered any new music lately?',
      'Movies': 'Seen any good movies recently?',
      'Books': 'Reading anything interesting?',
      'Travel': 'Any travel plans coming up?',
      'Food': 'Tried any new restaurants?',
      'Gaming': 'Playing any new games?',
      'Art': 'Been to any galleries or exhibitions?',
      'Fitness': 'How’s your fitness routine going?',
      'Technology': 'Heard about any cool new tech?',
    };
    if (interestStarters[randomInterest]) {
      starters.push(interestStarters[randomInterest]);
    }
  }

  // Based on birthday
  if (friend.birthday) {
    const today = new Date();
    const birthday = new Date(friend.birthday);
    const daysUntil = Math.floor((birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 0 && daysUntil <= 30) {
      starters.push(`Your birthday is coming up! Any plans?`);
    }
  }

  // Generic fallbacks
  const randomGeneric = CONVERSATION_STARTERS[Math.floor(Math.random() * CONVERSATION_STARTERS.length)];
  starters.push(randomGeneric);

  return [...new Set(starters)].slice(0, 3);
}

// Generate gift suggestions
export function generateGiftSuggestions(friend: Friend, _events: Event[]): string[] {
  const suggestions: string[] = [];

  // Based on interests
  const giftByInterest: Record<string, string[]> = {
    'Sports': ['Tickets to a game', 'Sports equipment', 'Team merchandise'],
    'Music': ['Concert tickets', 'Vinyl records', 'Music streaming subscription'],
    'Movies': ['Movie theater gift card', 'Streaming subscription', 'Movie memorabilia'],
    'Books': ['Bestseller book', 'Bookstore gift card', 'E-reader accessories'],
    'Travel': ['Travel accessories', 'Weekend getaway', 'Luggage'],
    'Food': ['Restaurant gift card', 'Cooking class', 'Gourmet food basket'],
    'Gaming': ['New game release', 'Gaming accessories', 'Gift card to game store'],
    'Art': ['Art supplies', 'Museum membership', 'Art print'],
    'Fitness': ['Gym membership', 'Fitness tracker', 'Workout gear'],
    'Technology': ['Gadget accessories', 'Tech subscription', 'Smart home device'],
    'Fashion': ['Clothing gift card', 'Accessory', 'Styling session'],
    'Photography': ['Camera accessories', 'Photo book', 'Photography class'],
    'Cooking': ['Cookbook', 'Kitchen gadget', 'Cooking class'],
    'Outdoors': ['Camping gear', 'Hiking equipment', 'National park pass'],
    'Pets': ['Pet accessories', 'Pet photo session', 'Pet treat basket'],
  };

  friend.interests.forEach(interest => {
    if (giftByInterest[interest]) {
      suggestions.push(...giftByInterest[interest]);
    }
  });

  // Based on traits
  if (friend.traits.includes('Practical')) {
    suggestions.push('Something useful for daily life');
  }
  if (friend.traits.includes('Sentimental')) {
    suggestions.push('Personalized photo album');
  }
  if (friend.traits.includes('Luxury')) {
    suggestions.push('High-end experience');
  }

  // Use saved gift ideas
  suggestions.push(...friend.giftIdeas);

  return [...new Set(suggestions)].slice(0, 5);
}

// Find compatible friends
export function findCompatibleFriends(friends: Friend[], targetFriend: Friend): Friend[] {
  return friends
    .filter(f => f.id !== targetFriend.id)
    .map(f => {
      let score = 0;

      // Shared interests
      const sharedInterests = f.interests.filter(i => targetFriend.interests.includes(i));
      score += sharedInterests.length * 10;

      // Shared traits
      const sharedTraits = f.traits.filter(t => targetFriend.traits.includes(t));
      score += sharedTraits.length * 5;

      // Same relationship type
      if (f.relationship === targetFriend.relationship) {
        score += 5;
      }

      return { friend: f, score };
    })
    .filter(item => item.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.friend);
}

// Analyze energy patterns
export function analyzeEnergyPatterns(events: Event[]): {
  energizing: number;
  draining: number;
  neutral: number;
  pattern: string;
} {
  const energizing = events.filter(e => e.energyImpact === 'gives').length;
  const draining = events.filter(e => e.energyImpact === 'takes').length;
  const neutral = events.filter(e => e.energyImpact === 'neutral').length;
  const total = events.length || 1;

  let pattern = 'balanced';
  if (energizing / total > 0.6) pattern = 'mostly energizing';
  else if (draining / total > 0.4) pattern = 'often draining';

  return { energizing, draining, neutral, pattern };
}

// Predict mood based on patterns
export function predictMood(_friend: Friend, events: Event[]): {
  prediction: string;
  confidence: number;
  suggestion: string;
} {
  const moodEvents = events.filter(e => e.category === 'mood');

  if (moodEvents.length < 3) {
    return {
      prediction: 'Not enough data',
      confidence: 0,
      suggestion: 'Log more mood events to get predictions',
    };
  }

  // Check for day-of-week patterns
  const dayPatterns: Record<number, number> = {};
  moodEvents.forEach(e => {
    const day = new Date(e.date).getDay();
    const score = e.sentiment === 'positive' ? 1 : e.sentiment === 'negative' ? -1 : 0;
    dayPatterns[day] = (dayPatterns[day] || 0) + score;
  });

  const today = new Date().getDay();
  const todayPattern = dayPatterns[today];

  if (todayPattern !== undefined) {
    if (todayPattern < -1) {
      return {
        prediction: 'May be feeling low today',
        confidence: 70,
        suggestion: 'A supportive message would be appreciated',
      };
    }
    if (todayPattern > 1) {
      return {
        prediction: 'Likely in a good mood today',
        confidence: 70,
        suggestion: 'Good day to plan something fun together',
      };
    }
  }

  // Check recent trend
  const recent = moodEvents.slice(-3);
  const negativeStreak = recent.filter(e => e.sentiment === 'negative').length;

  if (negativeStreak >= 2) {
    return {
      prediction: 'Going through a rough patch',
      confidence: 80,
      suggestion: 'They might need extra support right now',
    };
  }

  return {
    prediction: 'Mood seems stable',
    confidence: 50,
    suggestion: 'Keep checking in regularly',
  };
}

// Generate relationship forecast
export function generateForecast(_friend: Friend, events: Event[]): {
  status: 'healthy' | 'at-risk' | 'needs-attention';
  message: string;
  actions: string[];
} {
  const recentEvents = events.slice(-10);

  if (recentEvents.length === 0) {
    return {
      status: 'needs-attention',
      message: 'No recent interactions logged',
      actions: ['Reach out and catch up', 'Schedule time to connect'],
    };
  }

  const negativeRatio = recentEvents.filter(e => e.sentiment === 'negative').length / recentEvents.length;
  const drainingRatio = recentEvents.filter(e => e.energyImpact === 'takes').length / recentEvents.length;
  const daysSinceLastContact = Math.floor(
    (Date.now() - new Date(recentEvents[recentEvents.length - 1].date).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (negativeRatio > 0.5 || drainingRatio > 0.5) {
    return {
      status: 'at-risk',
      message: 'Recent interactions have been challenging',
      actions: [
        'Have an honest conversation about how things are going',
        'Set boundaries if needed',
        'Consider if this relationship is serving you',
      ],
    };
  }

  if (daysSinceLastContact > 21) {
    return {
      status: 'needs-attention',
      message: 'It\'s been a while since you last connected',
      actions: [
        'Send a message to check in',
        'Schedule a catch-up call or meetup',
      ],
    };
  }

  if (negativeRatio < 0.2 && drainingRatio < 0.2) {
    return {
      status: 'healthy',
      message: 'This relationship is thriving!',
      actions: [
        'Keep nurturing this connection',
        'Express gratitude for their presence in your life',
      ],
    };
  }

  return {
    status: 'healthy',
    message: 'Relationship is stable',
    actions: ['Continue regular check-ins'],
  };
}
