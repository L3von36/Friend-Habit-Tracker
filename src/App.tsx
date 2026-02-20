import { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Users, Activity, BarChart3, UserPlus, Filter, Bell, Download, GitCompare, Users2, Volume2, VolumeX, Calendar } from 'lucide-react';
import type { Friend, Event, Reminder, RelationshipGoal, Memory, GratitudeEntry, UserProfile, Quest } from '@/types';
import { CATEGORIES } from '@/types';
import { useStorage } from '@/hooks/useStorage';
import { FriendCard } from '@/components/FriendCard';
import { FriendDetail } from '@/components/FriendDetail';
import { AddFriendForm } from '@/components/AddFriendForm';
import { AddEventForm } from '@/components/AddEventForm';
// Lazy load heavy components for performance optimization
const Timeline = lazy(() => import('@/components/Timeline').then(m => ({ default: m.Timeline })));
const Insights = lazy(() => import('@/components/Insights').then(m => ({ default: m.Insights })));
const CompareFriends = lazy(() => import('@/components/CompareFriends').then(m => ({ default: m.CompareFriends })));
const DataExport = lazy(() => import('@/components/DataExport').then(m => ({ default: m.DataExport })));
const GroupDynamics = lazy(() => import('@/components/GroupDynamics').then(m => ({ default: m.GroupDynamics })));
const ChatAssistant = lazy(() => import('@/components/AI/ChatAssistant').then(m => ({ default: m.ChatAssistant })));

import { LevelUpCelebration } from '@/components/Effects/LevelUpCelebration';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { showNudgesOnce } from '@/lib/nudges';
import { Reminders } from '@/components/Reminders';
import { generateReminders } from '@/lib/reminders';
import { Toaster, toast } from 'sonner';
import { semanticSearch } from '@/lib/semanticSearch';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BrainCircuit } from 'lucide-react';
import { updateFriendXP, checkStreak, generateQuests, calculateEventXP } from '@/lib/gamification';
import { generateId } from '@/lib/id';
import { QuestBoard } from '@/components/Gamification/QuestBoard';
import { AppLock } from '@/components/Security/AppLock';
import { SecuritySettings } from '@/components/Security/SecuritySettings';
import { UserProfileView } from '@/components/MyProfile/UserProfileView';
import { LayoutGrid, List, Sparkles as SparklesIcon } from 'lucide-react';
import { FriendListRow } from '@/components/FriendListRow';
import { ThemeToggle } from '@/components/Header/ThemeToggle';
import { UserProfile as HeaderUserProfile } from '@/components/Header/UserProfile';
import { audioService } from '@/lib/audio';
import { LandingPage } from '@/components/Auth/LandingPage';
import { mediaStorage } from '@/lib/mediaStorage';
import { BirthdayWidget } from '@/components/BirthdayWidget';
import { CalendarView } from '@/components/CalendarView';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAutoSync } from '@/hooks/useAutoSync';
import { OfflineIndicator } from '@/components/Common/OfflineIndicator';
import { ErrorBoundary } from '@/components/Common/ErrorBoundary';

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-in fade-in duration-500">
    <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    <p className="text-sm text-slate-500 font-medium">Loading experience...</p>
  </div>
);

function App() {
  const [friends, setFriends] = useStorage<Friend[]>('friends', []);
  const [events, setEvents] = useStorage<Event[]>('events', []);
  const [reminders, setReminders] = useStorage<Reminder[]>('reminders', []);
  const [goals, setGoals] = useStorage<RelationshipGoal[]>('goals', []);
  const [memories, setMemories] = useStorage<Memory[]>('memories', []);
  const [gratitudeEntries, setGratitudeEntries] = useStorage<GratitudeEntry[]>('gratitude', []);
  const [quests, setQuests] = useStorage<Quest[]>('quests', []);
  const [pinnedFriendIds, setPinnedFriendIds] = useStorage<string[]>('pinned-friends', []);
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'recent' | 'pinned'>('recent');
  const [groupBy, setGroupBy] = useState<'none' | 'relationship' | 'level'>('none');
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [levelUpData, setLevelUpData] = useState<{ friendName: string; newLevel: number } | null>(null);
  const [isAutoSyncEnabled] = useStorage<boolean>('auto-sync-enabled', false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useStorage<boolean>('is-authenticated', false);
  const [isGuest, setIsGuest] = useStorage<boolean>('is-guest', false);
  
  const [userProfile, setUserProfile] = useStorage<UserProfile>('user-profile', {
    name: 'Hero',
    color: 'bg-violet-500',
    traits: ['Growth Mindset', 'Empathetic'],
    interests: ['Psychology', 'Personal Growth'],
    notes: 'I create meaningful connections and track my personal relationship growth.'
  });

  const handleLogin = useCallback((googleUser: { name: string; email: string; picture: string }) => {
    setUserProfile(prev => ({
      ...prev,
      name: googleUser.name,
      avatar: googleUser.picture,
    }));
    setIsAuthenticated(true);
    setIsGuest(false);
    toast.success(`Welcome back, ${googleUser.name}!`);
  }, [setUserProfile, setIsAuthenticated, setIsGuest]);

  // Integrated Cloud Auto-Sync
  const autoSync = useAutoSync({
    friends,
    events,
    reminders,
    goals,
    memories,
    gratitudeEntries,
    enabled: isAutoSyncEnabled
  });

  const { performSync } = autoSync;

  // PWA Sync & Notification Listeners
  useEffect(() => {
    // 1. Listen for background sync messages from Service Worker
    if ('serviceWorker' in navigator) {
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SYNC_GDRIVE') {
          console.log('Background sync triggered from Service Worker');
          performSync();
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSWMessage);

      // Register sync tag when manual sync is attempted
      const handleManualSyncTrigger = () => {
        performSync();
        // Register for background sync if supported
        navigator.serviceWorker.ready.then(reg => {
          if ('sync' in reg) {
            (reg as any).sync.register('sync-gdrive').catch(console.error);
          }
        });
      };
      window.addEventListener('friend-tracker-sync', handleManualSyncTrigger);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
        window.removeEventListener('friend-tracker-sync', handleManualSyncTrigger);
      };
    }
  }, [performSync]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setIsGuest(false);
    toast.info('Signed out successfully');
  }, [setIsAuthenticated, setIsGuest]);

  const aggregateStats = useMemo(() => {
    const categoryCounts = events.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFriends: friends.length,
      totalEvents: events.length,
      positiveEvents: events.filter(e => e.sentiment === 'positive').length,
      negativeEvents: events.filter(e => e.sentiment === 'negative').length,
      activeStreaks: friends.reduce((sum, f) => sum + (f.streak || 0), 0),
      categoryCounts
    };
  }, [friends, events]);

  // PWA Notification Listener
  useEffect(() => {
    const handleNotificationAction = (e: CustomEvent) => {
      const { action, friendId } = e.detail;
      if (action === 'log') {
        const friend = friends.find(f => f.id === friendId);
        if (friend) {
          setSelectedFriend(friend);
          setIsAddEventOpen(true);
        }
      }
    };

    window.addEventListener('pwa-notification-action', handleNotificationAction as EventListener);
    return () => window.removeEventListener('pwa-notification-action', handleNotificationAction as EventListener);
  }, [friends]);

  // Smart nudges: show once per day on app open
  useEffect(() => {
    if (friends.length > 0) {
      const timer = setTimeout(() => showNudgesOnce(friends, events, setSelectedFriend), 2500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Generate reminders periodically
  useEffect(() => {
    const newReminders = generateReminders(friends, events);
    setReminders(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const filteredNew = newReminders.filter(r => !existingIds.has(r.id));
      return [...prev, ...filteredNew];
    });
  }, [friends, events, setReminders]);

  // Initialize Quests
  useEffect(() => {
    const now = new Date();
    const activeQuests = quests.filter(q => new Date(q.expiresAt) > now);
    if (activeQuests.length < 3) {
      const newQuests = generateQuests();
      setQuests(newQuests);
    }
  }, [quests, setQuests]);

  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Initialize Semantic Search
  useEffect(() => {
    semanticSearch.initialize();
  }, []);

  // Index data when it changes
  useEffect(() => {
    const dataToIndex = [
      ...friends.map(f => ({ ...f, type: 'friend', content: `Friend: ${f.name} - ${f.notes || ''}` })),
      ...events.map(e => ({ ...e, type: 'event', content: `Event: ${e.title} - ${e.description}` })),
      ...memories.map(m => ({ ...m, type: 'memory', content: `Memory: ${m.title} - ${m.description}` })),
    ];
    semanticSearch.indexData(dataToIndex);
  }, [friends, events, memories]);

  const activeReminderCount = useMemo(() => 
    reminders.filter(r => !r.dismissed).length,
    [reminders]
  );

  // Keyboard Shortcuts Registration
  useKeyboardShortcuts({
    n: () => setIsAddFriendOpen(true),
    e: () => setIsAddEventOpen(true),
    k: () => searchInputRef.current?.focus(),
    '1': () => setActiveTab('friends'),
    '2': () => setActiveTab('timeline'),
    '3': () => setActiveTab('insights'),
    '4': () => setActiveTab('groups'),
    '5': () => setActiveTab('calendar'),
    r: () => setShowReminders(!showReminders),
    escape: () => {
      if (selectedFriend) setSelectedFriend(null);
      if (isAddFriendOpen) setIsAddFriendOpen(false);
      if (isAddEventOpen) setIsAddEventOpen(false);
      if (editingFriend) setEditingFriend(null);
    }
  });

  // Perform Semantic Search
  useEffect(() => {
    const performSearch = async () => {
      if (isSemanticSearch && searchQuery.trim().length > 2) {
        setIsSearching(true);
        const results = await semanticSearch.search(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      }
    };
    
    // Debounce search
    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, isSemanticSearch]);

  const filteredFriends = useMemo(() => {
    if (isSemanticSearch && searchQuery.trim().length > 2) {
      const friendIds = new Set(searchResults.filter(r => r.type === 'friend').map(r => r.id));
      return friends.filter(f => friendIds.has(f.id));
    }

    return friends.filter(friend => 
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.traits.some(trait => trait.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [friends, searchQuery, isSemanticSearch, searchResults]);


  const sortedFriends = useMemo(() => {
    let result = [...filteredFriends];
    
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'level') {
      result.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    } else if (sortBy === 'recent') {
      result.sort((a, b) => {
        const lastA = events.filter(e => e.friendId === a.id).sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())[0];
        const lastB = events.filter(e => e.friendId === b.id).sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())[0];
        if (!lastA && !lastB) return 0;
        if (!lastA) return 1;
        if (!lastB) return -1;
        return new Date(lastB.date).getTime() - new Date(lastA.date).getTime();
      });
    } else if (sortBy === 'pinned') {
      result.sort((a, b) => {
        const aPin = pinnedFriendIds.includes(a.id) ? -1 : 1;
        const bPin = pinnedFriendIds.includes(b.id) ? -1 : 1;
        return aPin - bPin;
      });
    }
    
    return result;
  }, [filteredFriends, sortBy, events, pinnedFriendIds]);

  const groupedFriends = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Friends': sortedFriends };
    }
    
    const groups: Record<string, Friend[]> = {};
    
    sortedFriends.forEach(friend => {
      let key = 'Other';
      if (groupBy === 'relationship') {
        key = friend.relationship || 'Uncategorized';
      } else if (groupBy === 'level') {
        const level = Math.floor(Math.sqrt((friend.xp || 0) / 100)) + 1;
        if (level <= 5) key = 'Novice (Lvl 1-5)';
        else if (level <= 10) key = 'Associate (Lvl 6-10)';
        else if (level <= 20) key = 'Expert (Lvl 11-20)';
        else key = 'Master (Lvl 21+)';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(friend);
    });
    
    return groups;
  }, [sortedFriends, groupBy]);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (isSemanticSearch && searchQuery.trim().length > 2) {
      const eventIds = new Set(searchResults.filter(r => r.type === 'event').map(r => r.id));
      filtered = filtered.filter(e => eventIds.has(e.id));
    } else {
      if (filterCategory !== 'all') {
        filtered = filtered.filter(e => e.category === filterCategory);
      }
      if (filterTag !== 'all') {
        filtered = filtered.filter(e => e.tags.includes(filterTag));
      }
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, filterCategory, filterTag, isSemanticSearch, searchQuery, searchResults]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    events.forEach(e => e.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [events]);

  const handleAddFriend = useCallback((friend: Omit<Friend, 'id' | 'createdAt'>) => {
    const newFriend: Friend = {
      ...friend,
      id: generateId(),
      createdAt: new Date().toISOString(),
      giftIdeas: [],
      interests: [],
    };
    audioService.playSuccess();
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
    const removedEvents = events.filter(e => e.friendId === friendId);
    const removedGoals = goals.filter(g => g.friendId === friendId);
    const removedMemories = memories.filter(m => m.friendId === friendId);
    const removedGratitude = gratitudeEntries.filter(g => g.friendId === friendId);
    audioService.playDelete();
    setFriends(prev => prev.filter(f => f.id !== friendId));
    setEvents(prev => prev.filter(e => e.friendId !== friendId));
    setGoals(prev => prev.filter(g => g.friendId !== friendId));
    setMemories(prev => prev.filter(m => m.friendId !== friendId));
    setGratitudeEntries(prev => prev.filter(g => g.friendId !== friendId));
    if (selectedFriend?.id === friendId) setSelectedFriend(null);
    toast(`Removed ${friend?.name || 'friend'}`, {
      action: {
        label: 'Undo',
        onClick: () => {
          setFriends(prev => [...prev, friend!]);
          setEvents(prev => [...prev, ...removedEvents]);
          setGoals(prev => [...prev, ...removedGoals]);
          setMemories(prev => [...prev, ...removedMemories]);
          setGratitudeEntries(prev => [...prev, ...removedGratitude]);
          toast.success(`${friend?.name} restored!`);
        },
      },
      duration: 6000,
    });
  }, [setFriends, setEvents, setGoals, setMemories, setGratitudeEntries, friends, events, goals, memories, gratitudeEntries, selectedFriend]);

  const handlePinFriend = useCallback((friendId: string) => {
    setPinnedFriendIds(prev => {
      const isPinned = prev.includes(friendId);
      const next = isPinned ? prev.filter(id => id !== friendId) : [...prev, friendId];
      const friend = friends.find(f => f.id === friendId);
      toast(isPinned ? `Unpinned ${friend?.name}` : `📌 Pinned ${friend?.name}`);
      return next;
    });
  }, [setPinnedFriendIds, friends]);

  const handleAddEvent = useCallback((event: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...event,
      id: generateId(),
    };
    audioService.playSuccess();
    setEvents(prev => [...prev, newEvent]);
    
    // 1. Calculate XP & Update Level
    const xpGained = calculateEventXP(newEvent);
    
    // 2. Update Friend (Streak & Level)
    setFriends(prev => prev.map(f => {
      if (f.id === event.friendId) {
        let updated = checkStreak(f, new Date(event.date));
        const { friend: leveledFriend, leveledUp } = updateFriendXP(updated, xpGained);
        
        if (leveledUp) {
          setLevelUpData({ friendName: leveledFriend.name, newLevel: leveledFriend.level || 1 });
          audioService.playSuccess();
        }
        return leveledFriend;
      }
      return f;
    }));

    // 3. Update Quests
    setQuests(prev => prev.map(q => {
      if (q.completed) return q;
      let progress = 0;
      
      if (q.type === 'contact') progress = 1;
      if (q.type === 'event' && event.sentiment === 'positive') progress = 1;
      
      if (progress > 0) {
        const newCount = (q.currentCount || 0) + progress;
        const completed = newCount >= q.targetCount;
        
        if (completed && !q.completed) {
           toast.success(`🏆 Quest Completed: ${q.title}! (+${q.rewardXP} XP)`);
           // Note: We'd need to add this XP to a "User Profile" if we had one.
           // For now, let's just mark it complete.
        }
        
        return {
           ...q,
           currentCount: newCount,
           completed,
        };
      }
      return q;
    }));
    
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
    toast.success(`Event logged! +${xpGained} XP`);
  }, [setEvents, setFriends, setGoals, setQuests, events]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    const eventToDelete = events.find(e => e.id === eventId);
    if (!eventToDelete) return;
    audioService.playDelete();
    setEvents(prev => prev.filter(e => e.id !== eventId));
    toast('Event deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          setEvents(prev => [...prev, eventToDelete!]);
          toast.success('Event restored!');
        },
      },
      duration: 5000,
    });
  }, [setEvents, events]);

  const handleAddGoal = useCallback((goal: Omit<RelationshipGoal, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak'>) => {
    const newGoal: RelationshipGoal = {
      ...goal,
      id: generateId(),
      createdAt: new Date().toISOString(),
      currentStreak: 0,
      longestStreak: 0,
    };
    audioService.playSuccess();
    setGoals(prev => [...prev, newGoal]);
    toast.success('Goal created!');
  }, [setGoals]);

  const handleDeleteGoal = useCallback((goalId: string) => {
    audioService.playDelete();
    setGoals(prev => prev.filter(g => g.id !== goalId));
    toast.success('Goal deleted');
  }, [setGoals]);

  const handleAddMemory = useCallback((memory: Omit<Memory, 'id'>) => {
    const newMemory: Memory = {
      ...memory,
      id: generateId(),
    };
    audioService.playSuccess();
    setMemories(prev => [...prev, newMemory]);
    setQuests(prev => prev.map(q => {
      if (q.type === 'memory' && !q.completed) {
        const newCount = (q.currentCount || 0) + 1;
        const completed = newCount >= q.targetCount;
        if (completed) toast.success(`🏆 Quest Completed: ${q.title}!`);
        return { ...q, currentCount: newCount, completed };
      }
      return q;
    }));
    toast.success('Memory saved! (+50 XP)'); 
    
    // Also add XP to friend
    setFriends(prev => prev.map(f => {
       if (f.id === memory.friendId) {
          const { friend, leveledUp } = updateFriendXP(f, 50); // Fixed 50XP for memory
          if (leveledUp) toast.success(`🎉 ${f.name} reached Level ${friend.level}!`);
          return friend;
       }
       return f;
    }));
  }, [setMemories, setQuests, setFriends]);

  const handleDeleteMemory = useCallback((memoryId: string) => {
    audioService.playDelete();
    setMemories(prev => prev.filter(m => m.id !== memoryId));
    toast.success('Memory deleted');
  }, [setMemories]);

  const handleAddGratitude = useCallback((entry: Omit<GratitudeEntry, 'id'>) => {
    const newEntry: GratitudeEntry = {
      ...entry,
      id: generateId(),
    };
    audioService.playSuccess();
    setGratitudeEntries(prev => [...prev, newEntry]);
    toast.success('Gratitude entry saved!');
  }, [setGratitudeEntries]);

  const handleDeleteGratitude = useCallback((entryId: string) => {
    audioService.playDelete();
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

  const handleImportAllData = useCallback(async (data: any) => {
    try {
      setFriends(data.friends || []);
      setEvents(data.events || []);
      setGoals(data.goals || []);
      setMemories(data.memories || []);
      setGratitudeEntries(data.gratitudeEntries || []);
      setReminders(data.reminders || []);
      
      // Restore media if present
      if (data.media && Array.isArray(data.media)) {
        for (const item of data.media) {
          try {
            const res = await fetch(`data:${item.type === 'audio' ? 'audio/webm' : 'image/jpeg'};base64,${item.base64}`);
            const blob = await res.blob();
            await mediaStorage.restoreMedia(item.id, blob, item.type, item.createdAt, item.relatedId);
          } catch (e) {
            console.error('Failed to restore media item:', item.id, e);
          }
        }
      }
      return true;
    } catch (error) {
       console.error('Import failed:', error);
       return false;
    }
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

  if (!isAuthenticated && !isGuest) {
    return (
      <div className="min-h-screen">
        <Toaster position="top-right" />
        <LandingPage onLogin={handleLogin} onContinueAsGuest={() => setIsGuest(true)} />
      </div>
    );
  }

  if (isUserProfileOpen) {
    return (
      <div className="min-h-screen">
        <Toaster position="top-right" />
        <UserProfileView 
          profile={userProfile}
          events={events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
          stats={aggregateStats}
          onBack={() => setIsUserProfileOpen(false)}
          onUpdateProfile={setUserProfile}
          onDeleteEvent={handleDeleteEvent}
        />
      </div>
    );
  }

  if (selectedFriend) {
    return (
      <div className="min-h-screen">
        <Toaster position="top-right" />
        <FriendDetail
          friend={selectedFriend}
          events={getFriendEvents(selectedFriend.id)}
          stats={getFriendStats(selectedFriend.id)}
          goals={goals}
          memories={memories}
          gratitudeEntries={gratitudeEntries}
          allFriends={friends}
          userName={userProfile.name}
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
          onIntroduce={(eventA: Omit<Event, 'id'>, eventB: Omit<Event, 'id'>) => {
            handleAddEvent(eventA);
            handleAddEvent(eventB);
          }}
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
    <div className="min-h-screen">
      <OfflineIndicator />
      <ErrorBoundary>
        <Toaster position="top-right" />
        <AppLock />
        
        {/* Header */}
        <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4 group cursor-default">
              <div className="relative">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 transform group-hover:rotate-6 transition-transform">
                  <Users className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white dark:bg-slate-900 rounded-md sm:rounded-lg flex items-center justify-center shadow-md">
                   <SparklesIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 animate-pulse" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Friend<span className="text-slate-800 dark:text-white">Tracker</span>
                </h1>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Relationship Intelligence</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-0.5 sm:p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                <ThemeToggle />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowReminders(!showReminders)}
                  className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
                >
                  <Bell className="w-5 h-5" />
                  {activeReminderCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {activeReminderCount}
                    </span>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    const muted = audioService.toggleMute();
                    setIsMuted(muted);
                    if (!muted) audioService.playClick();
                  }}
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5 text-violet-500" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsExportOpen(true)}
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
                  title="Backup & Restore"
                >
                  <Download className="w-5 h-5" />
                </Button>
                <KeyboardShortcutsDialog />
                <HeaderUserProfile 
                  userProfile={userProfile} 
                  onOpenProfile={() => setIsUserProfileOpen(true)} 
                  onLogout={handleLogout}
                  isGuest={isGuest}
                />
              </div>
              
              {/* Desktop-only secondary actions */}
              <div className="hidden md:flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsCompareOpen(true)}
                  className="h-10 w-10 rounded-xl"
                  title="Compare Friends"
                >
                  <GitCompare className="w-5 h-5" />
                </Button>
                <SecuritySettings />
              </div>

              <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
              
              {/* Desktop-only Add Friend Button */}
              <div className="hidden sm:block">
                <Dialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 h-11 px-6 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg p-3 sm:p-6 max-h-[95vh] overflow-y-auto rounded-2xl">
                    <DialogHeader className="mb-2 sm:mb-4">
                      <DialogTitle className="text-lg sm:text-xl font-bold">Add New Friend</DialogTitle>
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
        </div>
      </header>

      {/* Reminders Panel */}
      {showReminders && (
        <div className="fixed top-16 right-0 sm:right-4 z-50 w-full sm:w-80 max-h-[calc(100vh-5rem)] overflow-auto px-4 sm:px-0">
          <div className="mt-2 sm:mt-0 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
            <Reminders
              reminders={reminders}
              friends={friends}
              onDismiss={(id) => setReminders(prev => prev.map(r => r.id === id ? { ...r, dismissed: true } : r))}
              onSelectFriend={(f: Friend) => {
                setSelectedFriend(f);
                setShowReminders(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto no-scrollbar bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-1">
            <TabsTrigger value="friends" className="flex-1 flex items-center justify-center gap-2 px-3 py-2">
              <Users className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Friends</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1 flex items-center justify-center gap-2 px-3 py-2">
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex-1 flex items-center justify-center gap-2 px-3 py-2">
              <Activity className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex-1 flex items-center justify-center gap-2 px-3 py-2">
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex-1 flex items-center justify-center gap-2 px-3 py-2">
              <Users2 className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Groups</span>
            </TabsTrigger>
          </TabsList>

          <div 
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('bg-amber-100', 'dark:bg-amber-900/30', 'scale-105');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('bg-amber-100', 'dark:bg-amber-900/30', 'scale-105');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('bg-amber-100', 'dark:bg-amber-900/30', 'scale-105');
              const friendId = e.dataTransfer.getData('friendId');
              if (friendId) handlePinFriend(friendId);
            }}
            className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl transition-all text-slate-400 font-medium text-sm"
          >
            <span>📌 Drop here to Pin/Unpin Friends</span>
          </div>

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center space-x-2 pb-2">
                 <Switch 
                   id="semantic-mode" 
                   checked={isSemanticSearch} 
                   onCheckedChange={setIsSemanticSearch}
                 />
                 <Label htmlFor="semantic-mode" className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                   <BrainCircuit className="w-4 h-4 text-violet-500" />
                   AI Semantic Search {isSearching && <span className="text-xs animate-pulse text-violet-500">(Searching...)</span>}
                 </Label>
               </div>

            <QuestBoard 
              quests={quests} 
              onRefresh={() => {}}
              onClaim={(id) => {
                audioService.playSuccess();
                setQuests(prev => prev.map(q => q.id === id ? { ...q, completed: true } : q));
                toast.success('Quests refreshed!');
              }}
            />

            {/* Friend List Controls */}
            <div className="flex flex-col gap-4 bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
                <div className="flex flex-col xs:flex-row items-center gap-3 w-full">
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg self-start xs:self-center">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setViewMode('grid')}
                            className={`rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600' : 'text-slate-500 hover:text-slate-700 hover:bg-transparent'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setViewMode('list')}
                            className={`rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600' : 'text-slate-500 hover:text-slate-700 hover:bg-transparent'}`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-2 w-full">
                        <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-slate-100/50 dark:bg-slate-900/30">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Sort</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer w-full"
                            >
                                <option value="recent">Recent</option>
                                <option value="level">Level</option>
                                <option value="name">Name</option>
                                <option value="pinned">Pinned First</option>
                            </select>
                        </div>
                        <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-slate-100/50 dark:bg-slate-900/30">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Group</span>
                            <select
                                value={groupBy}
                                onChange={(e) => setGroupBy(e.target.value as any)}
                                className="bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer w-full"
                            >
                                <option value="none">None</option>
                                <option value="relationship">Role</option>
                                <option value="level">Tier</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

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
            ) : sortedFriends.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400">
                  No friends match your search
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedFriends).map(([groupName, groupFriends]) => (
                  <div key={groupName} className="space-y-4">
                    {groupBy !== 'none' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                          {groupName} ({groupFriends.length})
                        </span>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                      </div>
                    )}
                    
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {groupFriends.slice(0, visibleCount).map(friend => (
                            <FriendCard
                              key={friend.id}
                              friend={friend}
                              eventCount={events.filter(e => e.friendId === friend.id).length}
                              isPinned={pinnedFriendIds.includes(friend.id)}
                              onPin={() => handlePinFriend(friend.id)}
                              onClick={() => setSelectedFriend(friend)}
                              onDelete={() => handleDeleteFriend(friend.id)}
                              events={events}
                              memories={memories}
                            />
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 backdrop-blur-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                          {groupFriends.slice(0, visibleCount).map(friend => {
                              const friendEvents = events.filter(e => e.friendId === friend.id);
                              const lastEvent = friendEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                              
                              return (
                                <FriendListRow
                                    key={friend.id}
                                    friend={friend}
                                    eventCount={friendEvents.length}
                                    lastEventDate={lastEvent?.date}
                                    isPinned={pinnedFriendIds.includes(friend.id)}
                                    onPin={() => handlePinFriend(friend.id)}
                                    onClick={() => setSelectedFriend(friend)}
                                    onDelete={() => handleDeleteFriend(friend.id)}
                                    onLogEvent={() => {
                                        setSelectedFriend(friend);
                                        setIsAddEventOpen(true);
                                    }}
                                />
                              );
                          })}
                      </div>
                    )}
                    {groupFriends.length > visibleCount && (
                      <div className="flex justify-center py-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setVisibleCount(prev => prev + 20)}
                          className="text-slate-500"
                        >
                          Load more friends...
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
              </div>
              
              <div className="space-y-6">
                <BirthdayWidget 
                  friends={friends} 
                  onSelectFriend={(f) => {
                    setSelectedFriend(f);
                    audioService.playClick();
                  }} 
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView 
              friends={friends} 
              events={events} 
              onSelectFriend={(f) => {
                setSelectedFriend(f);
                audioService.playClick();
              }} 
            />
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

            <Suspense fallback={<LoadingFallback />}>
              <Timeline 
                events={filteredEvents} 
                friends={friends}
                onDelete={handleDeleteEvent}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="insights">
            <Suspense fallback={<LoadingFallback />}>
              <Insights 
                friends={friends} 
                events={events}
                onSelectFriend={setSelectedFriend}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="groups">
            <Suspense fallback={<LoadingFallback />}>
              <GroupDynamics
                friends={friends}
                events={events}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>

      {/* Compare Dialog */}
      <Suspense fallback={null}>
        <CompareFriends
          friends={friends}
          events={events}
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
        />
      </Suspense>

      {/* Export Dialog */}
      <Suspense fallback={null}>
        <DataExport
          friends={friends}
          events={events}
          reminders={reminders}
          goals={goals}
          memories={memories}
          gratitudeEntries={gratitudeEntries}
          onImport={(data) => handleImportAllData(data)}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          isAuthenticated={isAuthenticated}
        />
      </Suspense>

      {/* Floating Add Friend Button - Mobile Only */}
      <Button
        onClick={() => setIsAddFriendOpen(true)}
        className="fixed bottom-6 right-6 z-50 sm:hidden w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-2xl flex items-center justify-center p-0 transition-all hover:scale-110 active:scale-95 shadow-violet-500/40"
      >
        <UserPlus className="w-6 h-6" />
      </Button>

      <LevelUpCelebration 
        isOpen={!!levelUpData}
        friendName={levelUpData?.friendName || ''}
        newLevel={levelUpData?.newLevel || 1}
        onClose={() => setLevelUpData(null)}
      />

      {/* AI Assistant Sheet */}
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetContent side="right" className="p-0 border-l border-slate-200 dark:border-slate-800 w-full sm:max-w-md">
          <Suspense fallback={<LoadingFallback />}>
            <ChatAssistant 
              friends={friends}
              events={events}
              memories={memories}
            />
          </Suspense>
        </SheetContent>
      </Sheet>

      {/* AI Assistant Floating Toggle */}
      <Button
        onClick={() => { audioService.playClick(); setIsChatOpen(true); }}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-white dark:bg-slate-800 text-violet-600 shadow-2xl flex items-center justify-center p-0 border border-slate-100 dark:border-slate-700 transition-all hover:scale-110 active:scale-95 group"
      >
        <div className="relative">
          <BrainCircuit className="w-6 h-6 transition-transform group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
          </span>
        </div>
      </Button>
    </ErrorBoundary>
    </div>
  );
}

export default App;
