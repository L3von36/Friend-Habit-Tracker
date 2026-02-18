import type { Friend, Event, RelationshipGoal, Memory, GratitudeEntry } from '@/types';
import { CATEGORIES, SENTIMENTS } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Calendar, Tag, TrendingUp, TrendingDown, Minus, Edit2, Trash2, Activity, BarChart3, Smile, Zap, MessageCircle, Gift, Target, Camera, Heart, Sparkles } from 'lucide-react';
import { calculateHealthScore } from '@/lib/healthScore';
import { HealthScoreCard } from './HealthScoreCard';
import { MoodTrends } from './MoodTrends';
import { EnergyTracker } from './EnergyTracker';
import { ConversationStarters } from './ConversationStarters';
import { GiftSuggestions } from './GiftSuggestions';
import { RelationshipGoals } from './RelationshipGoals';
import { Memories } from './Memories';
import { GratitudeJournal } from './GratitudeJournal';
import { RelationshipForecast } from './RelationshipForecast';

interface FriendDetailProps {
  friend: Friend;
  events: Event[];
  stats: {
    totalEvents: number;
    positiveEvents: number;
    negativeEvents: number;
    categoryCounts: Record<string, number>;
  };
  goals: RelationshipGoal[];
  memories: Memory[];
  gratitudeEntries: GratitudeEntry[];
  onBack: () => void;
  onAddEvent: () => void;
  onDeleteEvent: (eventId: string) => void;
  onEditFriend: () => void;
  onAddGoal: (goal: Omit<RelationshipGoal, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak'>) => void;
  onDeleteGoal: (goalId: string) => void;
  onAddMemory: (memory: Omit<Memory, 'id'>) => void;
  onDeleteMemory: (memoryId: string) => void;
  onAddGratitude: (entry: Omit<GratitudeEntry, 'id'>) => void;
  onDeleteGratitude: (entryId: string) => void;
  onUpdateGiftIdeas: (friendId: string, ideas: string[]) => void;
  onUpdateInterests: (friendId: string, interests: string[]) => void;
}

export function FriendDetail({ 
  friend, 
  events, 
  stats, 
  goals,
  memories,
  gratitudeEntries,
  onBack, 
  onAddEvent, 
  onDeleteEvent,
  onEditFriend,
  onAddGoal,
  onDeleteGoal,
  onAddMemory,
  onDeleteMemory,
  onAddGratitude,
  onDeleteGratitude,
  onUpdateGiftIdeas,
  onUpdateInterests,
}: FriendDetailProps) {
  const initials = friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const healthScore = calculateHealthScore(friend, events);
  
  const sentimentScore = stats.totalEvents > 0 
    ? ((stats.positiveEvents - stats.negativeEvents) / stats.totalEvents * 100).toFixed(0)
    : '0';

  const getSentimentIcon = () => {
    const score = Number(sentimentScore);
    if (score > 20) return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (score < -20) return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${friend.color} flex items-center justify-center text-white font-bold shadow-lg`}>
                  {initials}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">{friend.name}</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{friend.relationship}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onEditFriend} className="rounded-full">
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button 
                onClick={onAddEvent}
                className="bg-gradient-to-r from-violet-500 to-purple-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Event
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stats.totalEvents}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Events</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.positiveEvents}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Positive</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.negativeEvents}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Negative</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                {getSentimentIcon()}
              </div>
              <div>
                <p className={`text-2xl font-bold ${Number(sentimentScore) > 0 ? 'text-green-600' : Number(sentimentScore) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {Number(sentimentScore) > 0 ? `+${sentimentScore}` : sentimentScore}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Sentiment</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex flex-wrap w-full gap-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-lg">
            <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
              <Activity className="w-3 h-3" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-1 text-xs">
              <BarChart3 className="w-3 h-3" />
              Health
            </TabsTrigger>
            <TabsTrigger value="mood" className="flex items-center gap-1 text-xs">
              <Smile className="w-3 h-3" />
              Mood
            </TabsTrigger>
            <TabsTrigger value="energy" className="flex items-center gap-1 text-xs">
              <Zap className="w-3 h-3" />
              Energy
            </TabsTrigger>
            <TabsTrigger value="conversation" className="flex items-center gap-1 text-xs">
              <MessageCircle className="w-3 h-3" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex items-center gap-1 text-xs">
              <Gift className="w-3 h-3" />
              Gifts
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-1 text-xs">
              <Target className="w-3 h-3" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="memories" className="flex items-center gap-1 text-xs">
              <Camera className="w-3 h-3" />
              Memories
            </TabsTrigger>
            <TabsTrigger value="gratitude" className="flex items-center gap-1 text-xs">
              <Heart className="w-3 h-3" />
              Gratitude
            </TabsTrigger>
            <TabsTrigger value="forecast" className="flex items-center gap-1 text-xs">
              <Sparkles className="w-3 h-3" />
              Forecast
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Info & Categories */}
              <div className="space-y-6">
                {/* About */}
                <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">About</h3>
                  {friend.notes ? (
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{friend.notes}</p>
                  ) : (
                    <p className="text-slate-400 dark:text-slate-500 text-sm italic">No notes added yet</p>
                  )}
                </Card>

                {/* Traits */}
                <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Traits</h3>
                  <div className="flex flex-wrap gap-2">
                    {friend.traits.map((trait, i) => (
                      <Badge key={i} variant="secondary" className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </Card>

                {/* Interests */}
                {friend.interests.length > 0 && (
                  <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {friend.interests.map((interest, i) => (
                        <Badge key={i} variant="secondary" className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Category Breakdown */}
                <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Categories</h3>
                  <div className="space-y-3">
                    {Object.entries(CATEGORIES).map(([key, { label, color }]) => {
                      const count = stats.categoryCounts[key] || 0;
                      const percentage = stats.totalEvents > 0 ? (count / stats.totalEvents * 100).toFixed(0) : 0;
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${color}`} />
                            <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${color} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Right Column - Timeline */}
              <div className="lg:col-span-2">
                <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Event Timeline</h3>
                  </div>
                  <div className="p-6">
                    {events.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">No events logged yet</p>
                        <Button onClick={onAddEvent} variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Log First Event
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {events.map((event, index) => (
                          <div key={event.id} className="relative pl-8 pb-4 last:pb-0">
                            {/* Timeline line */}
                            {index < events.length - 1 && (
                              <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                            )}
                            {/* Timeline dot */}
                            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full ${CATEGORIES[event.category].color} flex items-center justify-center`}>
                              <span className="text-xs">{CATEGORIES[event.category].icon}</span>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{event.title}</span>
                                    <span className={SENTIMENTS[event.sentiment].color}>
                                      {SENTIMENTS[event.sentiment].icon}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{event.description}</p>
                                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(event.date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                      })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Tag className="w-3 h-3" />
                                      {event.tags.join(', ')}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                                  onClick={() => onDeleteEvent(event.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="health">
            <div className="max-w-2xl mx-auto">
              <HealthScoreCard score={healthScore} friendName={friend.name} />
            </div>
          </TabsContent>

          <TabsContent value="mood">
            <div className="max-w-2xl mx-auto">
              <MoodTrends friend={friend} events={events} />
            </div>
          </TabsContent>

          <TabsContent value="energy">
            <div className="max-w-2xl mx-auto">
              <EnergyTracker events={events} />
            </div>
          </TabsContent>

          <TabsContent value="conversation">
            <div className="max-w-2xl mx-auto">
              <ConversationStarters friend={friend} events={events} />
            </div>
          </TabsContent>

          <TabsContent value="gifts">
            <div className="max-w-2xl mx-auto">
              <GiftSuggestions 
                friend={friend} 
                onUpdateGiftIdeas={(ideas) => onUpdateGiftIdeas(friend.id, ideas)}
                onUpdateInterests={(interests) => onUpdateInterests(friend.id, interests)}
              />
            </div>
          </TabsContent>

          <TabsContent value="goals">
            <div className="max-w-2xl mx-auto">
              <RelationshipGoals
                friendId={friend.id}
                goals={goals}
                events={events}
                onAddGoal={onAddGoal}
                onDeleteGoal={onDeleteGoal}
              />
            </div>
          </TabsContent>

          <TabsContent value="memories">
            <div className="max-w-2xl mx-auto">
              <Memories
                friendId={friend.id}
                memories={memories}
                onAddMemory={onAddMemory}
                onDeleteMemory={onDeleteMemory}
              />
            </div>
          </TabsContent>

          <TabsContent value="gratitude">
            <div className="max-w-2xl mx-auto">
              <GratitudeJournal
                friendId={friend.id}
                entries={gratitudeEntries}
                friendName={friend.name}
                onAddEntry={onAddGratitude}
                onDeleteEntry={onDeleteGratitude}
              />
            </div>
          </TabsContent>

          <TabsContent value="forecast">
            <div className="max-w-2xl mx-auto">
              <RelationshipForecast friend={friend} events={events} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
