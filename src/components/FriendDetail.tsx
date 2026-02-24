import type { Friend, Event, RelationshipGoal, Memory, GratitudeEntry } from '@/types';
import { CATEGORIES, SENTIMENTS } from '@/types';
import { audioService } from '@/lib/audio';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmartDrafts } from './SmartDrafts';
import { ArrowLeft, Plus, Calendar, Tag, TrendingUp, TrendingDown, Minus, Edit2, Trash2, Activity, BarChart3, Smile, Zap, MessageCircle, Gift, Target, Camera, Heart, Sparkles, Brain, Paperclip, Share2, BookOpen, Users2, Printer, Network } from 'lucide-react';
import { LoomLogo } from './Common/LoomLogo';
import { MediaGallery } from './Media/MediaGallery';
import { calculateHealthScore } from '@/lib/healthScore';
import { HealthScoreCard } from './HealthScoreCard';
import { MoodTrends } from './MoodTrends';
import { EnergyTracker } from './EnergyTracker';
import { ConversationStarters } from './ConversationStarters';
import { GiftSuggestions } from './GiftSuggestions';
import { RelationshipGoals } from './RelationshipGoals';
import { generatePsychologicalProfile } from '@/lib/profiling';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Memories } from './Memories';
import { GratitudeJournal } from './GratitudeJournal';
import { RelationshipForecast } from './RelationshipForecast';
import { PsychologicalProfile } from './PsychologicalProfile';
import { ShareFriendCard } from './Social/ShareFriendCard';
import { CollaborativeNotes } from './Social/CollaborativeNotes';
import { IntroduceFriends } from './Social/IntroduceFriends';
import { EditConnections } from './Social/EditConnections';
import { generateNarrativeSummary } from '@/lib/narrativeEngine';
import { useState, useMemo } from 'react';

interface FriendDetailProps {
  friend: Friend;
  allFriends?: Friend[];
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
  userName?: string;
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
  onIntroduce?: (eventA: any, eventB: any) => void;
  onUpdateConnections: (friendId: string, connectedIds: string[]) => void;
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
  onIntroduce,
  onUpdateConnections,
  allFriends = [],
  userName = 'Me',
}: FriendDetailProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isIntroduceOpen, setIsIntroduceOpen] = useState(false);
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const initials = friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const healthScore = calculateHealthScore(friend, events);
  const profile = useMemo(() => generatePsychologicalProfile(friend, events, memories), [friend, events, memories]);
  const narrative = useMemo(() => generateNarrativeSummary(friend, events), [friend, events]);
  
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
    <div className="min-h-screen pb-20 page-enter">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full w-8 h-8 sm:w-10 sm:h-10">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-10 h-10 rounded-xl ${friend.color} flex items-center justify-center text-white text-base font-bold shadow-lg`}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{friend.name}</h1>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate shrink-0">{friend.relationship}</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-help transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
                            <span className="text-[10px]">{profile.archetypeIcon}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${profile.archetypeColor}`}>
                              {profile.archetype}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs text-xs">
                          {profile.archetypeDescription}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" title="Share Profile" onClick={() => { audioService.playClick(); setIsShareOpen(true); }} className="rounded-full text-slate-500 hover:text-violet-600">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Shared Notes" onClick={() => { audioService.playClick(); setIsNotesOpen(true); }} className="rounded-full text-slate-500 hover:text-violet-600">
                <BookOpen className="w-4 h-4" />
              </Button>
              {allFriends.length > 1 && (
                <>
                  <Button variant="ghost" size="icon" title="Introduce to a Friend" onClick={() => { audioService.playClick(); setIsIntroduceOpen(true); }} className="rounded-full text-slate-500 hover:text-violet-600">
                    <Users2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Edit Connections" onClick={() => { audioService.playClick(); setIsConnectionsOpen(true); }} className="rounded-full text-slate-500 hover:text-violet-600">
                    <Network className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" title="Print Report" onClick={() => { audioService.playClick(); window.print(); }} className="rounded-full text-slate-500 hover:text-violet-600">
                <Printer className="w-4 h-4" />
              </Button>
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
          <TabsList className="flex w-full overflow-x-auto no-scrollbar bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-lg">
            <TabsTrigger value="overview" className="flex-1 min-w-[80px] flex items-center justify-center gap-1 text-xs px-3 py-2">
              <Activity className="w-3 h-3" />
              <span className="hidden xs:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex-1 min-w-[70px] flex items-center justify-center gap-1 text-xs px-3 py-2">
              <BarChart3 className="w-3 h-3" />
              <span className="hidden xs:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="mood" className="flex-1 min-w-[70px] flex items-center justify-center gap-1 text-xs px-3 py-2">
              <Smile className="w-3 h-3" />
              <span className="hidden xs:inline">Mood</span>
            </TabsTrigger>
            <TabsTrigger value="energy" className="flex-1 min-w-[70px] flex items-center justify-center gap-1 text-xs px-3 py-2">
              <Zap className="w-3 h-3" />
              <span className="hidden xs:inline">Energy</span>
            </TabsTrigger>
            <TabsTrigger value="conversation" className="flex-1 min-w-[70px] flex items-center justify-center gap-1 text-xs px-3 py-2">
              <MessageCircle className="w-3 h-3" />
              <span className="hidden xs:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex-1 min-w-[70px] flex items-center justify-center gap-1 text-xs px-3 py-2">
              <Gift className="w-3 h-3" />
              <span className="hidden xs:inline">Gifts</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex-1 min-w-[70px] flex items-center justify-center gap-1 text-xs px-3 py-2">
              <Target className="w-3 h-3" />
              <span className="hidden xs:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="memories" className="flex-1 min-w-[80px] flex items-center justify-center gap-1 text-xs px-3 py-2">
              <Camera className="w-3 h-3" />
              <span className="hidden xs:inline">Memories</span>
            </TabsTrigger>
            <TabsTrigger value="gratitude" className="flex-1 min-w-[80px] flex items-center justify-center gap-1 text-xs px-3 py-2">
              <Heart className="w-3 h-3" />
              <span className="hidden xs:inline">Gratitude</span>
            </TabsTrigger>
            <TabsTrigger value="forecast" className="flex-1 min-w-[80px] flex items-center justify-center gap-1 text-xs px-3 py-2">
              <Sparkles className="w-3 h-3" />
              <span className="hidden xs:inline">Forecast</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-1 min-w-[80px] flex items-center justify-center gap-1 text-xs px-3 py-2">
              <Brain className="w-3 h-3" />
              <span className="hidden xs:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Info & Categories */}
              <div className="space-y-6">
                {/* The Story of Us - Narrative Engine */}
                <Card className="p-6 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 dark:from-indigo-900/10 dark:to-violet-900/10 backdrop-blur-sm border-0 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <LoomLogo className="w-12 h-12" />
                  </div>
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-400 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    The Story of Us
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm italic leading-relaxed relative z-10">
                    "{narrative}"
                  </p>
                </Card>

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
                        <Button onClick={() => {
                          audioService.playClick();
                          onAddEvent();
                        }} variant="outline">
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
                            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full ${CATEGORIES[event.category as keyof typeof CATEGORIES]?.color || 'bg-slate-500'} flex items-center justify-center`}>
                              <span className="text-xs">{CATEGORIES[event.category as keyof typeof CATEGORIES]?.icon || '📝'}</span>
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
                                  
                                  {event.attachments && event.attachments.length > 0 && (
                                    <div className="mb-3">
                                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                                         <Paperclip className="w-3 h-3" />
                                         <span>Attachments</span>
                                      </div>
                                      <MediaGallery mediaIds={event.attachments} readonly />
                                    </div>
                                  )}

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
                                  onClick={() => {
                                    audioService.playDelete();
                                    onDeleteEvent(event.id);
                                  }}
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
            <div className="max-w-2xl mx-auto space-y-8">
              <SmartDrafts friend={friend} events={events} />
              <div className="border-t border-slate-200 dark:border-slate-700/50 pt-8">
                  <ConversationStarters friend={friend} events={events} />
              </div>
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

          <TabsContent value="profile">
            <div className="max-w-3xl mx-auto">
              <PsychologicalProfile friend={friend} events={events} memories={memories} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Social Modals */}
      <ShareFriendCard
        friend={friend}
        events={events}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
      <CollaborativeNotes
        friend={friend}
        userName={userName}
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
      />
      {allFriends.length > 1 && (
        <IntroduceFriends
          sourceFriend={friend}
          allFriends={allFriends}
          isOpen={isIntroduceOpen}
          onClose={() => setIsIntroduceOpen(false)}
          onIntroduce={(eventA, eventB) => {
            if (onIntroduce) onIntroduce(eventA, eventB);
            setIsIntroduceOpen(false);
          }}
        />
      )}
      <EditConnections
         friend={friend}
         allFriends={allFriends}
         isOpen={isConnectionsOpen}
         onClose={() => setIsConnectionsOpen(false)}
         onUpdateConnections={onUpdateConnections}
      />
      
    </div>
  );
}
