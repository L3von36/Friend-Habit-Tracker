import { useState, useMemo, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Users, Activity, BarChart3, UserPlus, Filter, Bell, Download, GitCompare, Users2 } from 'lucide-react';
import type { Friend, Event, Reminder, RelationshipGoal, Memory, GratitudeEntry } from '@/types';
import { CATEGORIES } from '@/types';
import { useStorage } from '@/hooks/useStorage';
import { FriendCard } from '@/components/FriendCard';
import { FriendDetail } from '@/components/FriendDetail';
import { AddFriendForm } from '@/components/AddFriendForm';
import { AddEventForm } from '@/components/AddEventForm';
import { Timeline } from '@/components/Timeline';
import { Insights } from '@/components/Insights';
import { Reminders } from '@/components/Reminders';
import { CompareFriends } from '@/components/CompareFriends';
import { DataExport } from '@/components/DataExport';
import { GroupDynamics } from '@/components/GroupDynamics';
import { generateReminders } from '@/lib/reminders';
import { Toaster, toast } from 'sonner';

function App() {
  const [friends, setFriends] = useStorage<Friend[]>('friends', []);
  const [events, setEvents] = useStorage<Event[]>('events', []);
  const [reminders, setReminders] = useStorage<Reminder[]>('reminders', []);
  const [goals, setGoals] = useStorage<RelationshipGoal[]>('goals', []);
  const [memories, setMemories] = useStorage<Memory[]>('memories', []);
  const [gratitudeEntries, setGratitudeEntries] = useStorage<GratitudeEntry[]>('gratitude', []);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('friends');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showReminders, setShowReminders] = useState(false);

  // Generate reminders periodically
  useEffect(() => {
    const newReminders = generateReminders(friends, events);
    setReminders(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const filteredNew = newReminders.filter(r => !existingIds.has(r.id));
      return [...prev, ...filteredNew];
    });
  }, [friends, events, setReminders]);

  const activeReminderCount = useMemo(() => 
    reminders.filter(r => !r.dismissed).length,
    [reminders]
  );

  const filteredFriends = useMemo(() => {
    return friends.filter(friend => 
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.traits.some(trait => trait.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [friends, searchQuery]);

  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (filterCategory !== 'all') {
      filtered = filtered.filter(e => e.category === filterCategory);
    }
    if (filterTag !== 'all') {
      filtered = filtered.filter(e => e.tags.includes(filterTag));
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, filterCategory, filterTag]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    events.forEach(e => e.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [events]);

  const handleAddFriend = useCallback((friend: Omit<Friend, 'id' | 'createdAt'>) => {
    const newFriend: Friend = {
      ...friend,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      giftIdeas: [],
      interests: [],
    };
    setFriends(prev => [...prev, newFriend]);
    setIsAddFriendOpen(false);
    toast.success(`Added ${newFriend.name} to your friends!`);
  }, [setFriends]);

  const handleEditFriend = useCallback((friend: Friend | Omit<Friend, 'id' | 'createdAt'>) => {
    if (!('id' in friend)) return;
    const fullFriend = friend as Friend;
    setFriends(prev => prev.map(f => f.id === fullFriend.id ? fullFriend : f));
    setEditingFriend(null);
    if (selectedFriend?.id === fullFriend.id) {
      setSelectedFriend(fullFriend);
    }
    toast.success(`Updated ${fullFriend.name}'s profile`);
  }, [setFriends, selectedFriend]);

  const handleDeleteFriend = useCallback((friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    setFriends(prev => prev.filter(f => f.id !== friendId));
    setEvents(prev => prev.filter(e => e.friendId !== friendId));
    setGoals(prev => prev.filter(g => g.friendId !== friendId));
    setMemories(prev => prev.filter(m => m.friendId !== friendId));
    setGratitudeEntries(prev => prev.filter(g => g.friendId !== friendId));
    if (selectedFriend?.id === friendId) {
      setSelectedFriend(null);
    }
    toast.success(`Removed ${friend?.name || 'friend'} from your list`);
  }, [setFriends, setEvents, setGoals, setMemories, setGratitudeEntries, friends, selectedFriend]);

  const handleAddEvent = useCallback((event: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...event,
      id: crypto.randomUUID(),
    };
    setEvents(prev => [...prev, newEvent]);
    
    // Update last contact date for the friend
    setFriends(prev => prev.map(f => 
      f.id === event.friendId 
        ? { ...f, lastContactDate: event.date }
        : f
    ));
    
    // Update goal streaks
    setGoals(prev => prev.map(g => {
      if (g.friendId === event.friendId) {
        const periodStart = g.period === 'weekly'
          ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        
        const eventsInPeriod = events.filter(e => 
          e.friendId === g.friendId && 
          new Date(e.date) >= periodStart
        ).length;
        
        if (eventsInPeriod >= g.target) {
          return { ...g, currentStreak: g.currentStreak + 1 };
        }
      }
      return g;
    }));
    
    setIsAddEventOpen(false);
    toast.success('Event logged successfully!');
  }, [setEvents, setFriends, setGoals, events]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success('Event deleted');
  }, [setEvents]);

  const handleDismissReminder = useCallback((reminderId: string) => {
    setReminders(prev => prev.map(r => 
      r.id === reminderId ? { ...r, dismissed: true } : r
    ));
  }, [setReminders]);

  const handleAddGoal = useCallback((goal: Omit<RelationshipGoal, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak'>) => {
    const newGoal: RelationshipGoal = {
      ...goal,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      currentStreak: 0,
      longestStreak: 0,
    };
    setGoals(prev => [...prev, newGoal]);
    toast.success('Goal created!');
  }, [setGoals]);

  const handleDeleteGoal = useCallback((goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    toast.success('Goal deleted');
  }, [setGoals]);

  const handleAddMemory = useCallback((memory: Omit<Memory, 'id'>) => {
    const newMemory: Memory = {
      ...memory,
      id: crypto.randomUUID(),
    };
    setMemories(prev => [...prev, newMemory]);
    toast.success('Memory saved!');
  }, [setMemories]);

  const handleDeleteMemory = useCallback((memoryId: string) => {
    setMemories(prev => prev.filter(m => m.id !== memoryId));
    toast.success('Memory deleted');
  }, [setMemories]);

  const handleAddGratitude = useCallback((entry: Omit<GratitudeEntry, 'id'>) => {
    const newEntry: GratitudeEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };
    setGratitudeEntries(prev => [...prev, newEntry]);
    toast.success('Gratitude entry saved!');
  }, [setGratitudeEntries]);

  const handleDeleteGratitude = useCallback((entryId: string) => {
    setGratitudeEntries(prev => prev.filter(e => e.id !== entryId));
    toast.success('Entry deleted');
  }, [setGratitudeEntries]);

  const handleUpdateGiftIdeas = useCallback((friendId: string, ideas: string[]) => {
    setFriends(prev => prev.map(f => 
      f.id === friendId ? { ...f, giftIdeas: ideas } : f
    ));
  }, [setFriends]);

  const handleUpdateInterests = useCallback((friendId: string, interests: string[]) => {
    setFriends(prev => prev.map(f => 
      f.id === friendId ? { ...f, interests } : f
    ));
  }, [setFriends]);

  const handleImportData = useCallback((importedFriends: Friend[], importedEvents: Event[]) => {
    setFriends(importedFriends);
    setEvents(importedEvents);
    setGoals([]);
    setMemories([]);
    setGratitudeEntries([]);
    setReminders([]);
  }, [setFriends, setEvents, setGoals, setMemories, setGratitudeEntries, setReminders]);

  const getFriendEvents = useCallback((friendId: string) => {
    return events
      .filter(e => e.friendId === friendId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events]);

  const getFriendStats = useCallback((friendId: string) => {
    const friendEvents = events.filter(e => e.friendId === friendId);
    const totalEvents = friendEvents.length;
    const positiveEvents = friendEvents.filter(e => e.sentiment === 'positive').length;
    const negativeEvents = friendEvents.filter(e => e.sentiment === 'negative').length;
    const categoryCounts = friendEvents.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { totalEvents, positiveEvents, negativeEvents, categoryCounts };
  }, [events]);

  if (selectedFriend) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Toaster position="top-right" />
        <FriendDetail
          friend={selectedFriend}
          events={getFriendEvents(selectedFriend.id)}
          stats={getFriendStats(selectedFriend.id)}
          goals={goals}
          memories={memories}
          gratitudeEntries={gratitudeEntries}
          onBack={() => setSelectedFriend(null)}
          onAddEvent={() => setIsAddEventOpen(true)}
          onDeleteEvent={handleDeleteEvent}
          onEditFriend={() => setEditingFriend(selectedFriend)}
          onAddGoal={handleAddGoal}
          onDeleteGoal={handleDeleteGoal}
          onAddMemory={handleAddMemory}
          onDeleteMemory={handleDeleteMemory}
          onAddGratitude={handleAddGratitude}
          onDeleteGratitude={handleDeleteGratitude}
          onUpdateGiftIdeas={handleUpdateGiftIdeas}
          onUpdateInterests={handleUpdateInterests}
        />
        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log Event for {selectedFriend.name}</DialogTitle>
            </DialogHeader>
            <AddEventForm
              friendId={selectedFriend.id}
              friends={friends}
              onSubmit={handleAddEvent}
              onCancel={() => setIsAddEventOpen(false)}
            />
          </DialogContent>
        </Dialog>
        <Dialog open={!!editingFriend} onOpenChange={() => setEditingFriend(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Friend</DialogTitle>
            </DialogHeader>
            {editingFriend && (
              <AddFriendForm
                initialData={editingFriend}
                onSubmit={handleEditFriend}
                onCancel={() => setEditingFriend(null)}
                isEditing
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Friend Habit Tracker
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Understand the people in your life</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowReminders(!showReminders)}
                className="relative"
              >
                <Bell className="w-5 h-5" />
                {activeReminderCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {activeReminderCount}
                  </span>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsCompareOpen(true)}
              >
                <GitCompare className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsExportOpen(true)}
              >
                <Download className="w-5 h-5" />
              </Button>
              <Dialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Friend
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Friend</DialogTitle>
                  </DialogHeader>
                  <AddFriendForm
                    onSubmit={handleAddFriend}
                    onCancel={() => setIsAddFriendOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Reminders Panel */}
      {showReminders && (
        <div className="fixed top-16 right-4 z-30 w-80 max-h-[calc(100vh-5rem)] overflow-auto">
          <Reminders
            reminders={reminders}
            friends={friends}
            onDismiss={handleDismissReminder}
            onSelectFriend={setSelectedFriend}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users2 className="w-4 h-4" />
              Groups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-6">
            {/* Search and Stats */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search friends or traits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                />
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {friends.length} friends
                </span>
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {events.length} events logged
                </span>
              </div>
            </div>

            {/* Friends Grid */}
            {friends.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <Users className="w-10 h-10 text-violet-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  No friends yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  Start tracking your friends' habits and behaviors to better understand them
                </p>
                <Button 
                  onClick={() => setIsAddFriendOpen(true)}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Friend
                </Button>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400">
                  No friends match your search
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFriends.map(friend => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    eventCount={events.filter(e => e.friendId === friend.id).length}
                    onClick={() => setSelectedFriend(friend)}
                    onDelete={() => handleDeleteFriend(friend.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Filter:</span>
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORIES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm"
              >
                <option value="all">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            <Timeline 
              events={filteredEvents} 
              friends={friends}
              onDelete={handleDeleteEvent}
            />
          </TabsContent>

          <TabsContent value="insights">
            <Insights 
              friends={friends}
              events={events}
              onSelectFriend={setSelectedFriend}
            />
          </TabsContent>

          <TabsContent value="groups">
            <GroupDynamics
              friends={friends}
              events={events}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Compare Dialog */}
      <CompareFriends
        friends={friends}
        events={events}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />

      {/* Export Dialog */}
      <DataExport
        friends={friends}
        events={events}
        onImport={handleImportData}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}

export default App;
