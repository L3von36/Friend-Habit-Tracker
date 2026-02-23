import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { UserProfile, Event } from '@/types';
import { CATEGORIES, SENTIMENTS } from '@/types';
import { MediaGallery } from '../Media/MediaGallery';
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Heart, 
  Sparkles, 
  Brain, 
  Users,
  Target,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  History,
  BarChart3
} from 'lucide-react';

interface UserProfileViewProps {
  profile: UserProfile;
  events: Event[];
  stats: {
    totalFriends: number;
    totalEvents: number;
    positiveEvents: number;
    negativeEvents: number;
    activeStreaks: number;
    categoryCounts: Record<string, number>;
  };
  onBack: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onDeleteEvent: (eventId: string) => void;
}

export function UserProfileView({ 
  profile, 
  events,
  stats, 
  onBack, 
  onUpdateProfile,
  onDeleteEvent
}: UserProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [newTrait, setNewTrait] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const initials = profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSave = () => {
    onUpdateProfile(editedProfile);
    setIsEditing(false);
  };

  const handleAddTrait = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTrait.trim()) {
      setEditedProfile({
        ...editedProfile,
        traits: [...editedProfile.traits, newTrait.trim()]
      });
      setNewTrait('');
    }
  };

  const handleRemoveTrait = (trait: string) => {
    setEditedProfile({
      ...editedProfile,
      traits: editedProfile.traits.filter((t: string) => t !== trait)
    });
  };

  const handleAddInterest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newInterest.trim()) {
      setEditedProfile({
        ...editedProfile,
        interests: [...editedProfile.interests, newInterest.trim()]
      });
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setEditedProfile({
      ...editedProfile,
      interests: editedProfile.interests.filter((i: string) => i !== interest)
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full w-8 h-8 sm:w-10 sm:h-10">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-base font-bold shadow-lg`}>
                  {initials}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">{profile.name}</h1>
                  <p className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">Personal Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-xl">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditing(false)} variant="ghost" className="rounded-xl">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl shadow-lg shadow-violet-500/20">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto no-scrollbar bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-lg">
            <TabsTrigger value="overview" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 text-xs px-4 py-2">
              <Activity className="w-3.5 h-3.5" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 text-xs px-4 py-2">
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 text-xs px-4 py-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Personal Info */}
              <div className="space-y-6">
                <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-violet-500" />
                      About Me
                    </h3>
                  </div>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input 
                          value={editedProfile.name} 
                          onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                          placeholder="Your Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Birthday</Label>
                        <Input 
                          type="date"
                          value={editedProfile.birthday || ''} 
                          onChange={(e) => setEditedProfile({...editedProfile, birthday: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Biography & Goals</Label>
                        <Textarea 
                          value={editedProfile.notes} 
                          onChange={(e) => setEditedProfile({...editedProfile, notes: e.target.value})}
                          placeholder="Tell us about yourself..."
                          className="min-h-[120px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Full Name</p>
                        <p className="text-slate-800 dark:text-slate-200">{profile.name}</p>
                      </div>
                      {profile.birthday && (
                        <div>
                          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Birthday</p>
                          <p className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {new Date(profile.birthday).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Bio</p>
                        {profile.notes ? (
                          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{profile.notes}</p>
                        ) : (
                          <p className="text-slate-400 dark:text-slate-500 text-sm italic">No bio added yet...</p>
                        )}
                      </div>
                    </div>
                  )}
                </Card>

                <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-sm">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    My Traits
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(isEditing ? editedProfile.traits : profile.traits).map((trait: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 gap-1.5 py-1 px-3">
                        {trait}
                        {isEditing && (
                          <X 
                            className="w-3 h-3 cursor-pointer hover:text-red-500" 
                            onClick={() => handleRemoveTrait(trait)}
                          />
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="relative">
                      <Input 
                        placeholder="Add a trait..." 
                        value={newTrait}
                        onChange={(e) => setNewTrait(e.target.value)}
                        onKeyDown={handleAddTrait}
                        className="pr-10"
                      />
                      <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </Card>
              </div>

              {/* Right Column - Interests & Activity Cards */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-sm">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-pink-500" />
                    Personal Interests
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(isEditing ? editedProfile.interests : profile.interests).map((interest: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 gap-1.5 py-1 px-3">
                        {interest}
                        {isEditing && (
                          <X 
                            className="w-3 h-3 cursor-pointer hover:text-red-500" 
                            onClick={() => handleRemoveInterest(interest)}
                          />
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="relative">
                      <Input 
                        placeholder="Add an interest..." 
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        onKeyDown={handleAddInterest}
                        className="pr-10"
                      />
                      <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6 bg-gradient-to-br from-violet-600 to-purple-700 border-0 shadow-lg text-white">
                    <h4 className="font-bold mb-2">Social Sentiment</h4>
                    <p className="text-violet-100 text-sm mb-4">Overall health of your social network interactions.</p>
                    <div className="flex items-end gap-3">
                      <div className="text-3xl font-black">
                        {stats.positiveEvents > stats.negativeEvents ? (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-8 h-8" />
                            Very Positive
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-8 h-8" />
                            Growing
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-white dark:bg-slate-800 border-0 shadow-sm">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Social Energy</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Your current interaction momentum.</p>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000"
                        style={{ width: `${Math.min((stats.activeStreaks / Math.max(stats.totalFriends, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-right text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest">
                      {stats.activeStreaks} / {stats.totalFriends} ACTIVE CONNECTIONS
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Personal Activity History</h3>
                <p className="text-xs text-slate-500 mt-1">Timeline of all your logged friendship interactions.</p>
              </div>
              <div className="p-1 sm:p-6">
                {events.length === 0 ? (
                  <div className="text-center py-12">
                     <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                       <Calendar className="w-8 h-8 text-slate-400" />
                     </div>
                     <p className="text-slate-500 dark:text-slate-400">No activity history yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event: Event, index: number) => (
                      <div key={event.id} className="relative pl-8 pb-4 last:pb-0">
                        {index < events.length - 1 && (
                          <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                        )}
                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full ${CATEGORIES[event.category as keyof typeof CATEGORIES]?.color || 'bg-slate-500'} flex items-center justify-center text-[10px] shadow-sm`}>
                          {CATEGORIES[event.category as keyof typeof CATEGORIES]?.icon || '📝'}
                        </div>
                        
                        <div className="bg-slate-50/50 dark:bg-slate-700/30 rounded-xl p-4 group hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{event.title}</span>
                                <span className={SENTIMENTS[event.sentiment].color}>
                                  {SENTIMENTS[event.sentiment].icon}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">{event.description}</p>
                              
                              {event.attachments && event.attachments.length > 0 && (
                                <div className="mb-3">
                                   <MediaGallery mediaIds={event.attachments} readonly />
                                </div>
                              )}

                              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(event.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50"
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
          </TabsContent>

          <TabsContent value="stats">
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-sm text-center">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-violet-500" />
                  </div>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-200">{stats.totalFriends}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Friends</p>
                </Card>

                <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-sm text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-200">{stats.totalEvents}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Interactions</p>
                </Card>

                <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-sm text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-200">{stats.activeStreaks}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Streaks</p>
                </Card>

                <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-sm text-center">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6 text-rose-500" />
                  </div>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-200">
                    {stats.totalEvents > 0 ? ((stats.positiveEvents / stats.totalEvents) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Positivity</p>
                </Card>
              </div>

              <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-sm">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-violet-500" />
                  Distribution by Category
                </h3>
                <div className="space-y-4 max-w-2xl">
                  {Object.entries(CATEGORIES).map(([key, { label, color }]: [string, any]) => {
                    const count = stats.categoryCounts[key] || 0;
                    const percentage = stats.totalEvents > 0 ? (count / stats.totalEvents * 100).toFixed(0) : 0;
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tight">
                          <span className="text-slate-600 dark:text-slate-400">{label}</span>
                          <span className="text-slate-800 dark:text-slate-200">{count} events ({percentage}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${color} transition-all duration-1000`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
