export interface Friend {
  id: string;
  name: string;
  avatar?: string;
  relationship: string;
  notes: string;
  traits: string[];
  createdAt: string;
  color: string;
  birthday?: string;
  lastContactDate?: string;
  // Communication preferences
  preferredContact?: 'text' | 'call' | 'in-person' | 'social';
  bestTimeToReach?: string;
  averageResponseTime?: number; // in hours
  // Gift preferences
  giftIdeas: string[];
  interests: string[];
  // Introduction tracking
  introducedBy?: string; // friendId
  introducedDate?: string;
  connectedFriends?: string[]; // IDs of friends they are connected to
  // Gamification
  xp: number;
  level: number;
  streak: number;
  lastStreakUpdate?: string;
}

export interface UserProfile {
  name: string;
  birthday?: string;
  color: string;
  traits: string[];
  interests: string[];
  notes: string;
  avatar?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'event' | 'memory' | 'contact' | 'gift' | 'goal';
  targetCount: number;
  currentCount: number;
  rewardXP: number;
  completed: boolean;
  expiresAt: string;
}

export interface Event {
  id: string;
  friendId: string;
  title: string;
  description: string;
  date: string;
  category: 'behavior' | 'reaction' | 'habit' | 'interaction' | 'mood' | 'conflict' | 'gratitude';
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  importance: 1 | 2 | 3 | 4 | 5;
  // Energy tracking
  energyImpact: 'gives' | 'neutral' | 'takes';
  // Conflict resolution
  conflictStatus?: 'unresolved' | 'resolving' | 'resolved';
  resolutionNotes?: string;
  // Group events
  participantIds?: string[];
  // Rich Media
  attachments?: string[]; // IDs of media items in IndexedDB
}

export interface Reminder {
  id: string;
  friendId: string;
  type: 'birthday' | 'checkin' | 'custom' | 'conversation-starter' | 'gift' | 'goal';
  message: string;
  date: string;
  dismissed: boolean;
  suggestedAction?: string;
}

export interface HealthScore {
  overall: number;
  sentiment: number;
  frequency: number;
  reciprocity: number;
  depth: number;
  energy: number;
  trend: 'up' | 'down' | 'stable';
}

export interface RelationshipGoal {
  id: string;
  friendId: string;
  title: string;
  target: number; // e.g., 4 times per month
  period: 'weekly' | 'monthly';
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
}

export interface Memory {
  id: string;
  friendId: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  attachments?: string[]; // IDs of media items in IndexedDB
}

export interface GratitudeEntry {
  id: string;
  friendId: string;
  content: string;
  date: string;
}

export const CATEGORIES = {
  behavior: { label: 'Behavior', icon: '👤', color: 'bg-blue-500' },
  reaction: { label: 'Reaction', icon: '💬', color: 'bg-purple-500' },
  habit: { label: 'Habit', icon: '🔄', color: 'bg-green-500' },
  interaction: { label: 'Interaction', icon: '🤝', color: 'bg-orange-500' },
  mood: { label: 'Mood', icon: '😊', color: 'bg-pink-500' },
  conflict: { label: 'Conflict', icon: '⚡', color: 'bg-red-500' },
  gratitude: { label: 'Gratitude', icon: '💝', color: 'bg-yellow-500' },
} as const;

export const SENTIMENTS = {
  positive: { label: 'Positive', icon: '😊', color: 'text-green-500' },
  neutral: { label: 'Neutral', icon: '😐', color: 'text-gray-500' },
  negative: { label: 'Negative', icon: '😤', color: 'text-red-500' },
} as const;

export const ENERGY_IMPACTS = {
  gives: { label: 'Energizing', icon: '⚡', color: 'text-green-500', bg: 'bg-green-100' },
  neutral: { label: 'Neutral', icon: '➖', color: 'text-gray-500', bg: 'bg-gray-100' },
  takes: { label: 'Draining', icon: '🔋', color: 'text-red-500', bg: 'bg-red-100' },
} as const;

export const FRIEND_COLORS = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
];

export const COMMON_TAGS = [
  'Supportive',
  'Reliable',
  'Flaky',
  'Dramatic',
  'Funny',
  'Serious',
  'Optimistic',
  'Pessimistic',
  'Impulsive',
  'Thoughtful',
  'Jealous',
  'Competitive',
  'Loyal',
  'Distant',
  'Clingy',
  'Independent',
  'Generous',
  'Selfish',
  'Honest',
  'Secretive',
  'Hot-tempered',
  'Calm',
  'Anxious',
  'Confident',
  'Insecure',
];

export const RELATIONSHIP_TYPES = [
  'Close Friend',
  'Friend',
  'Coworker',
  'Family',
  'Partner',
  'Acquaintance',
  'Mentor',
  'Mentee',
  'Neighbor',
  'Other',
];

export const INTERESTS = [
  'Sports',
  'Music',
  'Movies',
  'Books',
  'Travel',
  'Food',
  'Gaming',
  'Art',
  'Fitness',
  'Technology',
  'Fashion',
  'Photography',
  'Cooking',
  'Outdoors',
  'Pets',
];

export const CONVERSATION_STARTERS = [
  "How's your week going?",
  "What have you been up to lately?",
  "Have you seen any good movies/shows recently?",
  "How's work/school going?",
  "Any exciting plans coming up?",
  "How's your family doing?",
  "Have you tried any new restaurants?",
  "What's something you're looking forward to?",
  "How are you feeling today?",
  "Anything on your mind lately?",
];

export const GIFT_CATEGORIES = [
  'Experience',
  'Personalized',
  'Practical',
  'Luxury',
  'DIY',
  'Subscription',
  'Books',
  'Tech',
  'Food/Drink',
  'Art/Craft',
];
