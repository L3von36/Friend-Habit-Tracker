import { useMemo } from 'react';
import type { Friend, Event } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, AlertTriangle, Heart, TrendingUp, Users, Sparkles } from 'lucide-react';

interface InsightsProps {
  friends: Friend[];
  events: Event[];
  onSelectFriend: (friend: Friend) => void;
}

interface FriendInsight {
  friend: Friend;
  type: 'positive' | 'warning' | 'pattern' | 'tip';
  title: string;
  message: string;
  relatedTags: string[];
}

export function Insights({ friends, events, onSelectFriend }: InsightsProps) {
  const insights = useMemo(() => {
    const result: FriendInsight[] = [];

    friends.forEach(friend => {
      const friendEvents = events.filter(e => e.friendId === friend.id);
      if (friendEvents.length === 0) return;

      const sentiments = {
        positive: friendEvents.filter(e => e.sentiment === 'positive').length,
        negative: friendEvents.filter(e => e.sentiment === 'negative').length,
        neutral: friendEvents.filter(e => e.sentiment === 'neutral').length,
      };

      const total = friendEvents.length;
      const positiveRatio = sentiments.positive / total;
      const negativeRatio = sentiments.negative / total;

      // Positive insight
      if (positiveRatio >= 0.6) {
        result.push({
          friend,
          type: 'positive',
          title: 'Positive Influence',
          message: `${friend.name} has a predominantly positive impact on your life. ${sentiments.positive} out of ${total} logged interactions were positive.`,
          relatedTags: friendEvents.filter(e => e.sentiment === 'positive').flatMap(e => e.tags),
        });
      }

      // Warning insight
      if (negativeRatio >= 0.4) {
        result.push({
          friend,
          type: 'warning',
          title: 'Potential Concern',
          message: `${friend.name} has shown ${sentiments.negative} negative interactions out of ${total}. Consider setting boundaries or having an honest conversation.`,
          relatedTags: friendEvents.filter(e => e.sentiment === 'negative').flatMap(e => e.tags),
        });
      }

      // Pattern insights based on categories
      const categoryCounts = friendEvents.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      if (categoryCounts['reaction'] && categoryCounts['reaction'] >= 3) {
        const reactionEvents = friendEvents.filter(e => e.category === 'reaction');
        const negativeReactions = reactionEvents.filter(e => e.sentiment === 'negative').length;
        if (negativeReactions >= 2) {
          result.push({
            friend,
            type: 'pattern',
            title: 'Reactive Pattern',
            message: `${friend.name} tends to react negatively in certain situations. Be mindful of triggers when interacting with them.`,
            relatedTags: reactionEvents.flatMap(e => e.tags),
          });
        }
      }

      if (categoryCounts['mood'] && categoryCounts['mood'] >= 3) {
        const moodEvents = friendEvents.filter(e => e.category === 'mood');
        const negativeMoods = moodEvents.filter(e => e.sentiment === 'negative').length;
        const ratio = negativeMoods / moodEvents.length;
        if (ratio >= 0.5) {
          result.push({
            friend,
            type: 'pattern',
            title: 'Mood Patterns',
            message: `${friend.name} experiences frequent low moods. They might benefit from additional support or understanding.`,
            relatedTags: moodEvents.flatMap(e => e.tags),
          });
        }
      }

      // Trait-based insights
      const allTags = friendEvents.flatMap(e => e.tags);
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const frequentTags = Object.entries(tagCounts)
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      if (frequentTags.length > 0) {
        const traitNames = frequentTags.map(([tag]) => tag).join(', ');
        result.push({
          friend,
          type: 'tip',
          title: 'Key Traits Observed',
          message: `Common traits observed in ${friend.name}: ${traitNames}. Understanding these can help you navigate your relationship better.`,
          relatedTags: frequentTags.map(([tag]) => tag),
        });
      }

      // Loyalty/Reliability insight
      if (tagCounts['Loyal'] && tagCounts['Reliable']) {
        result.push({
          friend,
          type: 'positive',
          title: 'Trustworthy Friend',
          message: `${friend.name} has consistently shown loyalty and reliability. This is someone you can count on.`,
          relatedTags: ['Loyal', 'Reliable'],
        });
      }

      // Drama/Negativity insight
      if (tagCounts['Dramatic'] && tagCounts['Dramatic'] >= 2) {
        result.push({
          friend,
          type: 'warning',
          title: 'Drama Patterns',
          message: `${friend.name} tends to create or attract drama. Consider how much emotional energy you're willing to invest.`,
          relatedTags: ['Dramatic'],
        });
      }
    });

    return result;
  }, [friends, events]);

  const getInsightIcon = (type: FriendInsight['type']) => {
    switch (type) {
      case 'positive':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'pattern':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'tip':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getInsightColor = (type: FriendInsight['type']) => {
    switch (type) {
      case 'positive':
        return 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'pattern':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'tip':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    }
  };

  if (friends.length === 0) {
    return (
      <Card className="p-12 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
          No insights yet
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Add friends and log events to generate personalized insights about your relationships
        </p>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="p-12 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Users className="w-10 h-10 text-violet-500" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
          Keep logging events
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Log more events to unlock personalized insights about your friends' patterns and behaviors
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Relationship Insights</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">AI-powered analysis of your friends' patterns</p>
        </div>
        <Badge variant="secondary" className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
          {insights.length} insights
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const initials = insight.friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          
          return (
            <Card 
              key={index} 
              className={`p-5 border-2 cursor-pointer hover:shadow-lg transition-all ${getInsightColor(insight.type)}`}
              onClick={() => onSelectFriend(insight.friend)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-full ${insight.friend.color} flex items-center justify-center text-white text-xs`}>
                      {initials[0]}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{insight.friend.name}</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{insight.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{insight.message}</p>
                  
                  {insight.relatedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {[...new Set(insight.relatedTags)].slice(0, 4).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <Card className="p-6 bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6" />
          <h3 className="font-semibold">Quick Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-3xl font-bold">{friends.length}</p>
            <p className="text-sm text-violet-200">Friends tracked</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{events.length}</p>
            <p className="text-sm text-violet-200">Events logged</p>
          </div>
          <div>
            <p className="text-3xl font-bold">
              {events.filter(e => e.sentiment === 'positive').length}
            </p>
            <p className="text-sm text-violet-200">Positive moments</p>
          </div>
          <div>
            <p className="text-3xl font-bold">
              {new Set(events.flatMap(e => e.tags)).size}
            </p>
            <p className="text-sm text-violet-200">Unique tags</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
