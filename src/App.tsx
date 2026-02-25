
import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  lazy,
  Suspense,
} from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  // DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Users,
  Activity,
  // BarChart3,
  UserPlus,
  Filter,
  Bell,
  GitCompare,
  Users2,
  Sparkles,
  BrainCircuit,
  LayoutGrid,
  List,
  Calendar,
  // Menu,
  Pin,
  Download,
  ShieldCheck,
  // ShieldAlert,
} from "lucide-react";
import type {
  Friend,
  Event,
  RelationshipGoal,
  Memory,
  GratitudeEntry,
} from "@/types";
import { CATEGORIES } from "@/types";
import { useStorage } from "@/hooks/useStorage";
import { useStore } from "@/store/useStore";
import { useStats } from "@/hooks/useStats";
import { FriendCard } from "@/components/FriendCard";
import { FriendDetail } from "@/components/FriendDetail";
import { AddFriendForm } from "@/components/AddFriendForm";
import { AddEventForm } from "@/components/AddEventForm";
import { Dashboard } from "@/components/Dashboard";
import { DataExport } from "@/components/DataExport";
import { DeepInsightsCard } from "@/components/AI/DeepInsightsCard";
import { SecuritySettings } from "@/components/Security/SecuritySettings";
import { RelationshipWrapped } from "@/components/Gamification/RelationshipWrapped";
import { LandingPage } from "@/components/Auth/LandingPage";
import { UserProfileView } from "@/components/MyProfile/UserProfileView";
import { QuestBoard } from "@/components/Gamification/QuestBoard";
// Lazy load heavy components for performance optimization
const Timeline = lazy(() =>
  import("@/components/Timeline").then((m) => ({ default: m.Timeline })),
);
const Insights = lazy(() =>
  import("@/components/Insights").then((m) => ({ default: m.Insights })),
);
const CompareFriends = lazy(() =>
  import("@/components/CompareFriends").then((m) => ({
    default: m.CompareFriends,
  })),
);
const GroupDynamics = lazy(() =>
  import("@/components/GroupDynamics").then((m) => ({
    default: m.GroupDynamics,
  })),
);
const ChatAssistant = lazy(() =>
  import("@/components/AI/ChatAssistant").then((m) => ({
    default: m.ChatAssistant,
  })),
);
const PredictiveAnalytics = lazy(() =>
  import("@/components/AI/PredictiveAnalytics").then((m) => ({
    default: m.PredictiveAnalytics,
  })),
);

// import { LevelUpCelebration } from "@/components/Effects/LevelUpCelebration";
// import { Sheet, SheetContent } from "@/components/ui/sheet";
import { showNudgesOnce } from "@/lib/nudges";
import { Reminders } from "@/components/Reminders";
import { generateReminders } from "@/lib/reminders";
import { Toaster, toast } from "sonner";
import { semanticSearch } from "@/lib/semanticSearch";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import {
  updateFriendXP,
  checkStreak,
  generateQuests,
  calculateEventXP,
} from "@/lib/gamification";
import { generateId } from "@/lib/id";
import { AppLock } from "@/components/Security/AppLock";

import { LoomLogo } from "@/components/Common/LoomLogo";
import { ThemeToggle } from "@/components/Header/ThemeToggle";
import { UserProfile as HeaderUserProfile } from "@/components/Header/UserProfile";
import { MobileMenu } from "@/components/Header/MobileMenu";
import { audioService } from "@/lib/audio";
import { mediaStorage } from "@/lib/mediaStorage";
import { BirthdayWidget } from "@/components/BirthdayWidget";
import { CalendarView } from "@/components/CalendarView";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAutoSync } from "@/hooks/useAutoSync";
import { OfflineIndicator } from "@/components/Common/OfflineIndicator";
import { ErrorBoundary } from "@/components/Common/ErrorBoundary";
import {
  requestNotificationPermission,
  checkAndNotifyExpiringStreaks,
} from "@/lib/notifications";

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-in fade-in duration-500">
    <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    <p className="text-sm text-slate-500 font-medium">Loading experience...</p>
  </div>
);

function App() {
  // Centralized Store
  const {
    friends,
    setFriends,
    events,
    setEvents,
    reminders,
    setReminders,
    goals,
    setGoals,
    memories,
    setMemories,
    gratitudeEntries,
    setGratitudeEntries,
    quests,
    setQuests,
    pinnedFriendIds,
    setPinnedFriendIds,
    userProfile,
    setUserProfile,
    isAuthenticated,
    isGuest,
    setIsGuest,
    login,
    logout,
  } = useStore();

  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isWrappedOpen, setIsWrappedOpen] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "level" | "recent" | "pinned">(
    "recent",
  );
  const [groupBy, setGroupBy] = useState<"none" | "relationship" | "level">(
    "none",
  );
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  // const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [_levelUpData, setLevelUpData] = useState<{
    friendName: string;
    newLevel: number;
  } | null>(null);
  const [isAutoSyncEnabled] = useStorage<boolean>("auto-sync-enabled", false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = useCallback(
    (googleUser: { name: string; email: string; picture: string }) => {
      login({ name: googleUser.name, avatar: googleUser.picture });
      toast.success(`Welcome back, ${googleUser.name}!`);
    },
    [login],
  );

  // Integrated Cloud Auto-Sync
  const autoSync = useAutoSync({
    friends,
    events,
    reminders,
    goals,
    memories,
    gratitudeEntries,
    enabled: isAutoSyncEnabled,
  });

  const { performSync } = autoSync;

  // PWA Sync & Notification Listeners
  useEffect(() => {
    // 1. Listen for background sync messages from Service Worker
    if ("serviceWorker" in navigator) {
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data?.type === "SYNC_GDRIVE") {
          console.log("Background sync triggered from Service Worker");
          performSync();
        }
      };
      navigator.serviceWorker.addEventListener("message", handleSWMessage);

      // Register sync tag when manual sync is attempted
      const handleManualSyncTrigger = () => {
        performSync();
        // Register for background sync if supported
        navigator.serviceWorker.ready.then((reg) => {
          if ("sync" in reg) {
            (reg as any).sync.register("sync-gdrive").catch(console.error);
          }
        });
      };
      window.addEventListener("loom-sync", handleManualSyncTrigger);

      return () => {
        navigator.serviceWorker.removeEventListener("message", handleSWMessage);
        window.removeEventListener(
          "loom-sync",
          handleManualSyncTrigger,
        );
      };
    }
  }, [performSync]);

  const handleLogout = useCallback(() => {
    logout();
    toast.info("Signed out successfully");
  }, [logout]);

  const { aggregateStats } = useStats();

  // PWA Notification Listener
  useEffect(() => {
    const handleNotificationAction = (e: CustomEvent) => {
      const { action, friendId } = e.detail;
      if (action === "log") {
        const friend = friends.find((f) => f.id === friendId);
        if (friend) {
          setSelectedFriend(friend);
          setIsAddEventOpen(true);
        }
      }
    };

    window.addEventListener(
      "pwa-notification-action",
      handleNotificationAction as EventListener,
    );
    return () =>
      window.removeEventListener(
        "pwa-notification-action",
        handleNotificationAction as EventListener,
      );
  }, [friends]);

  // Smart nudges: show once per day on app open
  useEffect(() => {
    if (friends.length > 0) {
      const timer = setTimeout(() => {
        showNudgesOnce(friends, events, setSelectedFriend);

        // Push notification permissions & checks
        requestNotificationPermission().then((granted) => {
          if (granted) {
            checkAndNotifyExpiringStreaks(friends);
          }
        });
      }, 2500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Generate reminders periodically
  useEffect(() => {
    const newReminders = generateReminders(friends, events);
    setReminders((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const filteredNew = newReminders.filter((r) => !existingIds.has(r.id));
      return [...prev, ...filteredNew];
    });
  }, [friends, events, setReminders]);

  // Initialize Quests
  useEffect(() => {
    const now = new Date();
    const activeQuests = quests.filter((q) => new Date(q.expiresAt) > now);
    if (activeQuests.length < 3) {
      const newQuests = generateQuests();
      setQuests(newQuests);
    }
  }, [quests, setQuests]);

  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const activeReminderCount = useMemo(
    () => reminders.filter((r) => !r.dismissed).length,
    [reminders],
  );

  // Keyboard Shortcuts Registration
  useKeyboardShortcuts({
    n: () => setIsAddFriendOpen(true),
    e: () => setIsAddEventOpen(true),
    k: () => searchInputRef.current?.focus(),
    "1": () => setActiveTab("friends"),
    "2": () => setActiveTab("timeline"),
    "3": () => setActiveTab("insights"),
    "4": () => setActiveTab("groups"),
    "5": () => setActiveTab("calendar"),
    r: () => setShowReminders(!showReminders),
    escape: () => {
      if (selectedFriend) setSelectedFriend(null);
      if (isAddFriendOpen) setIsAddFriendOpen(false);
      if (isAddEventOpen) setIsAddEventOpen(false);
      if (editingFriend) setEditingFriend(null);
    },
  });

  // Perform Semantic Search
  useEffect(() => {
    const performSearch = async () => {
      if (isSemanticSearch && searchQuery.trim().length > 2) {
        setIsSearching(true);
        const results = await semanticSearch.search(searchQuery, friends);
        setSearchResults(results);
        setIsSearching(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, isSemanticSearch, friends]);

  const filteredFriends = useMemo(() => {
    if (isSemanticSearch && searchQuery.trim().length > 2) {
      return searchResults;
    }

    return friends.filter(
      (friend) =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.traits.some((trait) =>
          trait.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
  }, [friends, searchQuery, isSemanticSearch, searchResults]);

  const sortedFriends = useMemo(() => {
    let result = [...filteredFriends];

    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "level") {
      result.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    } else if (sortBy === "recent") {
      result.sort((a, b) => {
        const lastA = events
          .filter((e) => e.friendId === a.id)
          .sort(
            (x, y) => new Date(y.date).getTime() - new Date(x.date).getTime(),
          )[0];
        const lastB = events
          .filter((e) => e.friendId === b.id)
          .sort(
            (x, y) => new Date(y.date).getTime() - new Date(x.date).getTime(),
          )[0];
        if (!lastA && !lastB) return 0;
        if (!lastA) return 1;
        if (!lastB) return -1;
        return new Date(lastB.date).getTime() - new Date(lastA.date).getTime();
      });
    } else if (sortBy === "pinned") {
      result.sort((a, b) => {
        const aPin = pinnedFriendIds.includes(a.id) ? -1 : 1;
        const bPin = pinnedFriendIds.includes(b.id) ? -1 : 1;
        return aPin - bPin;
      });
    }

    return result;
  }, [filteredFriends, sortBy, events, pinnedFriendIds]);

  const groupedFriends = useMemo(() => {
    if (groupBy === "none") {
      return { "All Friends": sortedFriends };
    }

    const groups: Record<string, Friend[]> = {};

    sortedFriends.forEach((friend) => {
      let key = "Other";
      if (groupBy === "relationship") {
        key = friend.relationship || "Uncategorized";
      } else if (groupBy === "level") {
        const level = Math.floor(Math.sqrt((friend.xp || 0) / 100)) + 1;
        if (level <= 5) key = "Novice (Lvl 1-5)";
        else if (level <= 10) key = "Associate (Lvl 6-10)";
        else if (level <= 20) key = "Expert (Lvl 11-20)";
        else key = "Master (Lvl 21+)";
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(friend);
    });

    return groups;
  }, [sortedFriends, groupBy]);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (filterCategory !== "all") {
      filtered = filtered.filter((e) => e.category === filterCategory);
    }
    if (filterTag !== "all") {
      filtered = filtered.filter((e) => e.tags.includes(filterTag));
    }

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [events, filterCategory, filterTag]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    events.forEach((e) => e.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [events]);

  const handleAddFriend = useCallback(
    (friend: Omit<Friend, "id" | "createdAt">) => {
      const newFriend: Friend = {
        ...friend,
        id: generateId(),
        createdAt: new Date().toISOString(),
        giftIdeas: [],
        interests: [],
        xp: 0,
        level: 1,
        streak: 0,
        averageResponseTime: 0,
      };
      audioService.playSuccess();
      setFriends((prev) => [...prev, newFriend]);
      setIsAddFriendOpen(false);
      toast.success(`Added ${newFriend.name} to your friends!`);
    },
    [setFriends],
  );

  const handleEditFriend = useCallback(
    (friend: Friend | Omit<Friend, "id" | "createdAt">) => {
      if (!("id" in friend)) return;
      const fullFriend = friend as Friend;
      setFriends((prev) =>
        prev.map((f) => (f.id === fullFriend.id ? fullFriend : f)),
      );
      setEditingFriend(null);
      if (selectedFriend?.id === fullFriend.id) {
        setSelectedFriend(fullFriend);
      }
      toast.success(`Updated ${fullFriend.name}'s profile`);
    },
    [setFriends, selectedFriend],
  );

  const handleDeleteFriend = useCallback(
    (friendId: string) => {
      const friend = friends.find((f) => f.id === friendId);
      const removedEvents = events.filter((e) => e.friendId === friendId);
      const removedGoals = goals.filter((g) => g.friendId === friendId);
      const removedMemories = memories.filter((m) => m.friendId === friendId);
      const removedGratitude = gratitudeEntries.filter(
        (g) => g.friendId === friendId,
      );
      audioService.playDelete();
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      setEvents((prev) => prev.filter((e) => e.friendId !== friendId));
      setGoals((prev) => prev.filter((g) => g.friendId !== friendId));
      setMemories((prev) => prev.filter((m) => m.friendId !== friendId));
      setGratitudeEntries((prev) =>
        prev.filter((g) => g.friendId !== friendId),
      );
      if (selectedFriend?.id === friendId) setSelectedFriend(null);
      toast(`Removed ${friend?.name || "friend"}`, {
        action: {
          label: "Undo",
          onClick: () => {
            setFriends((prev) => [...prev, friend!]);
            setEvents((prev) => [...prev, ...removedEvents]);
            setGoals((prev) => [...prev, ...removedGoals]);
            setMemories((prev) => [...prev, ...removedMemories]);
            setGratitudeEntries((prev) => [...prev, ...removedGratitude]);
            toast.success(`${friend?.name} restored!`);
          },
        },
        duration: 6000,
      });
    },
    [
      setFriends,
      setEvents,
      setGoals,
      setMemories,
      setGratitudeEntries,
      friends,
      events,
      goals,
      memories,
      gratitudeEntries,
      selectedFriend,
    ],
  );

  const handlePinFriend = useCallback(
    (friendId: string) => {
      setPinnedFriendIds((prev) => {
        const isPinned = prev.includes(friendId);
        const next = isPinned
          ? prev.filter((id) => id !== friendId)
          : [...prev, friendId];
        const friend = friends.find((f) => f.id === friendId);
        toast(
          isPinned ? `Unpinned ${friend?.name}` : `📌 Pinned ${friend?.name}`,
        );
        return next;
      });
    },
    [setPinnedFriendIds, friends],
  );

  const handleAddEvent = useCallback(
    (event: Omit<Event, "id">) => {
      const newEvent: Event = {
        ...event,
        id: generateId(),
      };
      audioService.playSuccess();
      setEvents((prev) => [...prev, newEvent]);

      // 1. Calculate XP & Update Level
      const xpGained = calculateEventXP(newEvent);

      // 2. Update Friend (Streak & Level)
      setFriends((prev) =>
        prev.map((f) => {
          if (f.id === event.friendId) {
            let updated = checkStreak(f, new Date(event.date));
            const { friend: leveledFriend, leveledUp } = updateFriendXP(
              updated,
              xpGained,
            );

            if (leveledUp) {
              setLevelUpData({
                friendName: leveledFriend.name,
                newLevel: leveledFriend.level || 1,
              });
              audioService.playSuccess();
            }
            return leveledFriend;
          }
          return f;
        }),
      );

      // 3. Update Quests
      setQuests((prev) =>
        prev.map((q) => {
          if (q.completed) return q;
          let progress = 0;

          if (q.type === "contact") progress = 1;
          if (q.type === "event" && event.sentiment === "positive")
            progress = 1;

          if (progress > 0) {
            const newCount = (q.currentCount || 0) + progress;
            const completed = newCount >= q.targetCount;

            if (completed && !q.completed) {
              toast.success(
                `🏆 Quest Completed: ${q.title}! (+${q.rewardXP} XP)`,
              );
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
        }),
      );

      // Update goal streaks
      setGoals((prev) =>
        prev.map((g) => {
          if (g.friendId === event.friendId) {
            const periodStart =
              g.period === "weekly"
                ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

            const eventsInPeriod = events.filter(
              (e) =>
                e.friendId === g.friendId && new Date(e.date) >= periodStart,
            ).length;

            if (eventsInPeriod >= g.target) {
              return { ...g, currentStreak: g.currentStreak + 1 };
            }
          }
          return g;
        }),
      );

      setIsAddEventOpen(false);
      toast.success(`Event logged! +${xpGained} XP`);
    },
    [setEvents, setFriends, setGoals, setQuests, events],
  );

  const handleDeleteEvent = useCallback(
    (eventId: string) => {
      const eventToDelete = events.find((e) => e.id === eventId);
      if (!eventToDelete) return;
      audioService.playDelete();
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast("Event deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            setEvents((prev) => [...prev, eventToDelete!]);
            toast.success("Event restored!");
          },
        },
        duration: 5000,
      });
    },
    [setEvents, events],
  );

  const handleAddGoal = useCallback(
    (
      goal: Omit<
        RelationshipGoal,
        "id" | "createdAt" | "currentStreak" | "longestStreak"
      >,
    ) => {
      const newGoal: RelationshipGoal = {
        ...goal,
        id: generateId(),
        createdAt: new Date().toISOString(),
        currentStreak: 0,
        longestStreak: 0,
      };
      audioService.playSuccess();
      setGoals((prev) => [...prev, newGoal]);
      toast.success("Goal created!");
    },
    [setGoals],
  );

  const handleDeleteGoal = useCallback(
    (goalId: string) => {
      audioService.playDelete();
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      toast.success("Goal deleted");
    },
    [setGoals],
  );

  const handleAddMemory = useCallback(
    (memory: Omit<Memory, "id">) => {
      const newMemory: Memory = {
        ...memory,
        id: generateId(),
      };
      audioService.playSuccess();
      setMemories((prev) => [...prev, newMemory]);
      setQuests((prev) =>
        prev.map((q) => {
          if (q.type === "memory" && !q.completed) {
            const newCount = (q.currentCount || 0) + 1;
            const completed = newCount >= q.targetCount;
            if (completed) toast.success(`🏆 Quest Completed: ${q.title}!`);
            return { ...q, currentCount: newCount, completed };
          }
          return q;
        }),
      );
      toast.success("Memory saved! (+50 XP)");

      // Also add XP to friend
      setFriends((prev) =>
        prev.map((f) => {
          if (f.id === memory.friendId) {
            const { friend, leveledUp } = updateFriendXP(f, 50); // Fixed 50XP for memory
            if (leveledUp)
              toast.success(`🎉 ${f.name} reached Level ${friend.level}!`);
            return friend;
          }
          return f;
        }),
      );
    },
    [setMemories, setQuests, setFriends],
  );

  const handleDeleteMemory = useCallback(
    (memoryId: string) => {
      audioService.playDelete();
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
      toast.success("Memory deleted");
    },
    [setMemories],
  );

  const handleAddGratitude = useCallback(
    (entry: Omit<GratitudeEntry, "id">) => {
      const newEntry: GratitudeEntry = {
        ...entry,
        id: generateId(),
      };
      audioService.playSuccess();
      setGratitudeEntries((prev) => [...prev, newEntry]);
      toast.success("Gratitude entry saved!");
    },
    [setGratitudeEntries],
  );

  const handleDeleteGratitude = useCallback(
    (entryId: string) => {
      audioService.playDelete();
      setGratitudeEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast.success("Entry deleted");
    },
    [setGratitudeEntries],
  );

  const handleUpdateGiftIdeas = useCallback(
    (friendId: string, ideas: string[]) => {
      setFriends((prev) =>
        prev.map((f) => (f.id === friendId ? { ...f, giftIdeas: ideas } : f)),
      );
    },
    [setFriends],
  );

  const handleUpdateInterests = useCallback(
    (friendId: string, interests: string[]) => {
      setFriends((prev) =>
        prev.map((f) => (f.id === friendId ? { ...f, interests } : f)),
      );
    },
    [setFriends],
  );

  const handleUpdateConnections = useCallback(
    (friendId: string, connectedIds: string[]) => {
      setFriends((prev) =>
        prev.map((f) =>
          f.id === friendId ? { ...f, connectedFriends: connectedIds } : f,
        ),
      );
    },
    [setFriends],
  );

  const handleImportAllData = useCallback(
    async (data: any) => {
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
              const res = await fetch(
                `data:${item.type === "audio" ? "audio/webm" : "image/jpeg"};base64,${item.base64}`,
              );
              const blob = await res.blob();
              await mediaStorage.restoreMedia(
                item.id,
                blob,
                item.type,
                item.createdAt,
                item.relatedId,
              );
            } catch (e) {
              console.error("Failed to restore media item:", item.id, e);
            }
          }
        }
        return true;
      } catch (error) {
        console.error("Import failed:", error);
        return false;
      }
    },
    [
      setFriends,
      setEvents,
      setGoals,
      setMemories,
      setGratitudeEntries,
      setReminders,
    ],
  );

  const getFriendEvents = useCallback(
    (friendId: string) => {
      return events
        .filter((e) => e.friendId === friendId)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    },
    [events],
  );

  const getFriendStats = useCallback(
    (friendId: string) => {
      const friendEvents = events.filter((e) => e.friendId === friendId);
      const totalEvents = friendEvents.length;
      const positiveEvents = friendEvents.filter(
        (e) => e.sentiment === "positive",
      ).length;
      const negativeEvents = friendEvents.filter(
        (e) => e.sentiment === "negative",
      ).length;
      const categoryCounts = friendEvents.reduce(
        (acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return { totalEvents, positiveEvents, negativeEvents, categoryCounts };
    },
    [events],
  );


  const globalDialogs = (
    <>
      <DataExport
        friends={friends}
        events={events}
        reminders={reminders}
        goals={goals}
        memories={memories}
        gratitudeEntries={gratitudeEntries}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onImport={handleImportAllData}
      />
      <Dialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg p-3 sm:p-6 max-h-[95vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="mb-2 sm:mb-4">
            <DialogTitle className="text-xl font-bold">
              Add New Connection
            </DialogTitle>
          </DialogHeader>
          <AddFriendForm
            onSubmit={handleAddFriend}
            onCancel={() => setIsAddFriendOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Suspense fallback={null}>
        <CompareFriends
          friends={friends}
          events={events}
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
        />
      </Suspense>
      <SecuritySettings
        open={isSecurityOpen}
        onOpenChange={setIsSecurityOpen}
      />
      <RelationshipWrapped
        friends={friends}
        events={events}
        isOpen={isWrappedOpen}
        onClose={() => setIsWrappedOpen(false)}
        userName={userProfile.name}
      />
    </>
  );

  if (!isAuthenticated && !isGuest) {
    return (
      <div className="min-h-screen">
        <Toaster position="top-right" />
        <LandingPage
          onLogin={handleLogin}
          onContinueAsGuest={() => setIsGuest(true)}
        />
        {globalDialogs}
      </div>
    );
  }

  if (isUserProfileOpen) {
    return (
      <div className="min-h-screen">
        <Toaster position="top-right" />
        <UserProfileView
          profile={userProfile}
          events={events.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )}
          stats={aggregateStats}
          onBack={() => setIsUserProfileOpen(false)}
          onUpdateProfile={setUserProfile}
          onDeleteEvent={handleDeleteEvent}
        />
        {globalDialogs}
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
          onIntroduce={(
            eventA: Omit<Event, "id">,
            eventB: Omit<Event, "id">,
          ) => {
            handleAddEvent(eventA);
            handleAddEvent(eventB);

            // Cross-link the friends
            setFriends((prev) =>
              prev.map((f) => {
                if (f.id === eventA.friendId) {
                  const newConnected = new Set([
                    ...(f.connectedFriends || []),
                    eventB.friendId,
                  ]);
                  return { ...f, connectedFriends: Array.from(newConnected) };
                }
                if (f.id === eventB.friendId) {
                  const newConnected = new Set([
                    ...(f.connectedFriends || []),
                    eventA.friendId,
                  ]);
                  return { ...f, connectedFriends: Array.from(newConnected) };
                }
                return f;
              }),
            );
          }}
          onUpdateConnections={handleUpdateConnections}
        />
        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-3 sm:p-6 max-h-[95vh] overflow-y-auto rounded-2xl">
            <DialogHeader className="mb-2 sm:mb-4">
              <DialogTitle className="text-xl font-bold">
                Log Event for {selectedFriend.name}
              </DialogTitle>
            </DialogHeader>
            <AddEventForm
              friendId={selectedFriend.id}
              friends={friends}
              onSubmit={handleAddEvent}
              onCancel={() => setIsAddEventOpen(false)}
            />
          </DialogContent>
        </Dialog>
        <Dialog
          open={!!editingFriend}
          onOpenChange={() => setEditingFriend(null)}
        >
          <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-3 sm:p-6 max-h-[95vh] overflow-y-auto rounded-2xl">
            <DialogHeader className="mb-2 sm:mb-4">
              <DialogTitle className="text-xl font-bold">
                Edit Connection
              </DialogTitle>
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

        {globalDialogs}
      </div>
    );
  }
const FriendListRow: React.FC<any> = () => null;
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
              <div className="flex items-center gap-1 sm:gap-4 group cursor-default shrink-0">
                <div className="relative shrink-0">
                  <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 transform group-hover:rotate-6 transition-transform">
                    <LoomLogo className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-5 sm:h-5 bg-white dark:bg-slate-900 rounded-[5px] sm:rounded-lg flex items-center justify-center shadow-md">
                    <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-amber-500 animate-pulse" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                    Loom
                  <div className="hidden md:flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Relationship Intelligence
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Desktop & Tablet Controls */}
                <div className="hidden sm:flex items-center gap-0 sm:gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-0.5 sm:p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
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
                  <HeaderUserProfile
                    userProfile={userProfile}
                    onOpenProfile={() => setIsUserProfileOpen(true)}
                    onLogout={handleLogout}
                    isGuest={isGuest}
                  />
                </div>

                {/* Mobile-only Menu */}
                <div className="sm:hidden">
                  <MobileMenu
                    isMuted={isMuted}
                    onToggleMute={() => {
                      const muted = audioService.toggleMute();
                      setIsMuted(muted);
                      if (!muted) audioService.playClick();
                    }}
                    onBackupRestore={() => setIsExportOpen(true)}
                    onAddFriend={() => setIsAddFriendOpen(true)}
                    onCompareFriends={() => setIsCompareOpen(true)}
                    onOpenProfile={() => setIsUserProfileOpen(true)}
                    onOpenSecuritySettings={() => setIsSecurityOpen(true)}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                </div>

                {/* Desktop-only secondary actions */}
                <div className="hidden md:flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExportOpen(true)}
                    className="h-10 w-10 rounded-xl"
                    title="Backup & Restore"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCompareOpen(true)}
                    className="h-10 w-10 rounded-xl"
                    title="Compare Friends"
                  >
                    <GitCompare className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSecurityOpen(true)}
                    className={useStore.getState().isAuthenticated ? "text-green-600" : "text-slate-400"}
                    title="Security Settings"
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </Button>
                </div>

                <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

                {/* Desktop-only Add Friend Button */}
                <div className="hidden sm:block">
                  <Button 
                    onClick={() => setIsAddFriendOpen(true)}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 h-11 px-6 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Connection
                  </Button>
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
                onDismiss={(id) =>
                  setReminders((prev) =>
                    prev.map((r) =>
                      r.id === id ? { ...r, dismissed: true } : r,
                    ),
                  )
                }
                onSelectFriend={(f: Friend) => {
                  setSelectedFriend(f);
                  setShowReminders(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="hidden sm:flex justify-start sm:justify-center w-full overflow-x-auto no-scrollbar bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 gap-1">
              <TabsTrigger
                value="dashboard"
                className="flex-1 min-w-[75px] flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2"
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span className="text-sm">Home</span>
              </TabsTrigger>
              <TabsTrigger
                value="connections"
                className="flex-1 min-w-[75px] flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2"
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="text-sm">People</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai_hub"
                className="flex-1 min-w-[75px] flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2"
              >
                <BrainCircuit className="w-4 h-4 shrink-0" />
                <span className="text-sm">AI Hub</span>
              </TabsTrigger>
              <TabsTrigger
                value="quests"
                className="flex-1 min-w-[75px] flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-sm">Quests</span>
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="flex-1 min-w-[75px] flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2"
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="text-sm">Calendar</span>
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="flex-1 min-w-[75px] flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2"
              >
                <Activity className="w-4 h-4 shrink-0" />
                <span className="text-sm">Timeline</span>
              </TabsTrigger>
              <TabsTrigger
                value="groups"
                className="flex-1 min-w-[75px] flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2"
              >
                <Users2 className="w-4 h-4 shrink-0" />
                <span className="text-sm">Groups</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
               <Dashboard 
                 onOpenWrapped={() => setIsWrappedOpen(true)}
                 onSelectFriend={setSelectedFriend}
               />
            </TabsContent>

            <TabsContent value="connections" className="space-y-6">
              {/* Pinned Friends Drop Zone */}
              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("bg-amber-50", "dark:bg-amber-900/20", "border-amber-300");
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("bg-amber-50", "dark:bg-amber-900/20", "border-amber-300");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("bg-amber-50", "dark:bg-amber-900/20", "border-amber-300");
                  const friendId = e.dataTransfer.getData("friendId");
                  if (friendId) handlePinFriend(friendId);
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl transition-all text-slate-400 dark:text-slate-500 text-sm"
              >
                <Pin className="w-4 h-4" />
                <span>Drop connection here to {pinnedFriendIds.length > 0 ? 'unpin' : 'pin'}</span>
              </div>

              {/* Search and Stats */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search connections or traits..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                    aria-label="Search connections or traits"
                  />
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {friends.length} connections
                  </span>
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {events.length} events logged
                  </span>
                </div>
              </div>

              {/* Connection List Controls */}
              <div className="flex flex-col gap-4 bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
                <div className="flex flex-col xs:flex-row items-center gap-3 w-full">
                  <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg self-start xs:self-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setViewMode("grid")}
                      className={`rounded-md transition-all ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm text-violet-600" : "text-slate-500 hover:text-slate-700 hover:bg-transparent"}`}
                      aria-label="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setViewMode("list")}
                      className={`rounded-md transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-violet-600" : "text-slate-500 hover:text-slate-700 hover:bg-transparent"}`}
                      aria-label="List View"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex-1 flex items-center gap-2 w-full">
                    <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-slate-100/50 dark:bg-slate-900/30">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        Sort
                      </span>
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
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        Group
                      </span>
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

              <div className="flex items-center space-x-2 pb-2">
                <Switch
                  id="semantic-mode"
                  checked={isSemanticSearch}
                  onCheckedChange={setIsSemanticSearch}
                />
                <Label
                  htmlFor="semantic-mode"
                  className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400"
                >
                  <BrainCircuit className="w-4 h-4 text-violet-500" />
                  AI Semantic Search{" "}
                  {isSearching && (
                    <span className="text-xs animate-pulse text-violet-500">
                      (Searching...)
                    </span>
                  )}
                </Label>
              </div>

              {friends.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <Users className="w-10 h-10 text-violet-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    No connections yet
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                    Start tracking your connections' habits and behaviors to better
                    understand them
                  </p>
                  <Button
                    onClick={() => setIsAddFriendOpen(true)}
                    className="bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Connection
                  </Button>
                </div>
              ) : sortedFriends.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 dark:text-slate-400">
                    No connections match your search
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedFriends).map(
                    ([groupName, groupFriends]) => (
                      <div key={groupName} className="space-y-4">
                        {groupBy !== "none" && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                              {groupName} ({groupFriends.length})
                            </span>
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                          </div>
                        )}

                        {viewMode === "grid" ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {groupFriends
                              .slice(0, visibleCount)
                              .map((friend) => (
                                <FriendCard
                                  key={friend.id}
                                  friend={friend}
                                  eventCount={
                                    events.filter(
                                      (e) => e.friendId === friend.id,
                                    ).length
                                  }
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
                            {groupFriends
                              .slice(0, visibleCount)
                              .map((friend) => {
                                const friendEvents = events.filter(
                                  (e) => e.friendId === friend.id,
                                );
                                const lastEvent = friendEvents.sort(
                                  (a, b) =>
                                    new Date(b.date).getTime() -
                                    new Date(a.date).getTime(),
                                )[0];

                                return (
                                  <FriendListRow
                                    key={friend.id}
                                    friend={friend}
                                    eventCount={friendEvents.length}
                                    lastEventDate={lastEvent?.date}
                                    isPinned={pinnedFriendIds.includes(
                                      friend.id,
                                    )}
                                    onPin={() => handlePinFriend(friend.id)}
                                    onClick={() => setSelectedFriend(friend)}
                                    onDelete={() =>
                                      handleDeleteFriend(friend.id)
                                    }
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
                              onClick={() =>
                                setVisibleCount((prev) => prev + 20)
                              }
                              className="text-slate-500"
                            >
                              Load more connections...
                            </Button>
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}

              <div className="space-y-6">
                <BirthdayWidget
                  friends={friends}
                  onSelectFriend={(f) => {
                    setSelectedFriend(f);
                    audioService.playClick();
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="ai_hub" className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <DeepInsightsCard />
                  <Suspense fallback={<LoadingFallback />}>
                    <PredictiveAnalytics
                      friends={friends}
                      events={events}
                      memories={memories}
                    />
                  </Suspense>
                  <Suspense fallback={<LoadingFallback />}>
                    <Insights
                      friends={friends}
                      events={events}
                      onSelectFriend={setSelectedFriend}
                    />
                  </Suspense>
                </div>
                <div>
                  <Suspense fallback={<LoadingFallback />}>
                    <ChatAssistant />
                  </Suspense>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quests" className="space-y-6">
               <QuestBoard
                quests={quests}
                onRefresh={() => {}}
                onClaim={(id) => {
                  audioService.playSuccess();
                  setQuests((prev) =>
                    prev.map((q) =>
                      q.id === id ? { ...q, completed: true } : q,
                    ),
                  );
                  toast.success("Quests refreshed!");
                }}
              />
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
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Filter:
                  </span>
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORIES).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm"
                >
                  <option value="all">All Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
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
                <GroupDynamics friends={friends} events={events} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg pb-safe">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 h-16 w-full bg-transparent p-0">
            <TabsTrigger
              value="dashboard"
              className="flex flex-col gap-1 h-full data-[state=active]:bg-violet-50 dark:data-[state=active]:bg-violet-900/20 data-[state=active]:text-violet-600"
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="text-[10px] font-medium">Home</span>
            </TabsTrigger>
            <TabsTrigger
              value="connections"
              className="flex flex-col gap-1 h-full data-[state=active]:bg-violet-50 dark:data-[state=active]:bg-violet-900/20 data-[state=active]:text-violet-600"
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-medium">People</span>
            </TabsTrigger>
            <TabsTrigger
              value="ai_hub"
              className="flex flex-col gap-1 h-full data-[state=active]:bg-violet-50 dark:data-[state=active]:bg-violet-900/20 data-[state=active]:text-violet-600"
            >
              <BrainCircuit className="w-5 h-5" />
              <span className="text-[10px] font-medium">AI Hub</span>
            </TabsTrigger>
            <TabsTrigger
              value="quests"
              className="flex flex-col gap-1 h-full data-[state=active]:bg-violet-50 dark:data-[state=active]:bg-violet-900/20 data-[state=active]:text-violet-600"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-[10px] font-medium">Quests</span>
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="flex flex-col gap-1 h-full data-[state=active]:bg-violet-50 dark:data-[state=active]:bg-violet-900/20 data-[state=active]:text-violet-600"
            >
              <Activity className="w-5 h-5" />
              <span className="text-[10px] font-medium">Activity</span>
            </TabsTrigger>
            </TabsList>
          </Tabs>
        </nav>
         {/* Floating Action Button for Mobile */}
        <div className="sm:hidden fixed bottom-20 right-4 z-50">
          <Button 
            onClick={() => setIsAddFriendOpen(true)}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30 h-14 w-14 rounded-full font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
          >
            <UserPlus className="w-6 h-6" />
          </Button>
        </div>


        {globalDialogs}
      </ErrorBoundary>
    </div>
  );
}

export default App;
