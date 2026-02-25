
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
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Users,
  Activity,
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
  Pin,
  Download,
  ShieldCheck,
} from "lucide-react";

import { CATEGORIES } from "@/types";
import { useStorage } from "@/hooks/useStorage";
import { useStore } from "@/store/useStore";
import { useStats } from "@/hooks/useStats";
import { FriendCard } from "@/components/FriendCard";
import { FriendDetail } from "@/components/FriendDetail";
import { AddFriendForm } from "@/components/AddFriendForm";
import { AddEventForm } from "@/components/AddEventForm";
import { Dashboard } from "@/components/Dashboard";
import { LandingPage } from "@/components/Auth/LandingPage";
import { UserProfileView } from "@/components/MyProfile/UserProfileView";
import { QuestBoard } from "@/components/Gamification/QuestBoard";
import { GlobalDialogs } from "@/components/GlobalDialogs";
import { FriendListRow } from "@/components/FriendListRow";
import { DeepInsightsCard } from "@/components/AI/DeepInsightsCard";

import { useAppActions } from "@/hooks/useAppActions";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAutoSync } from "@/hooks/useAutoSync";
import { showNudgesOnce } from "@/lib/nudges";
import { Reminders } from "@/components/Reminders";
import { generateReminders } from "@/lib/reminders";
import { Toaster, toast } from "sonner";
import { semanticSearch } from "@/lib/semanticSearch";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { LoomLogo } from "@/components/Common/LoomLogo";
import { ThemeToggle } from "@/components/Header/ThemeToggle";
import { UserProfile as HeaderUserProfile } from "@/components/Header/UserProfile";
import { MobileMenu } from "@/components/Header/MobileMenu";
import { audioService } from "@/lib/audio";
import { BirthdayWidget } from "@/components/BirthdayWidget";
import { CalendarView } from "@/components/CalendarView";
import { OfflineIndicator } from "@/components/Common/OfflineIndicator";
import { ErrorBoundary } from "@/components/Common/ErrorBoundary";
import {
  requestNotificationPermission,
  checkAndNotifyExpiringStreaks,
} from "@/lib/notifications";
import { AppLock } from "@/components/Security/AppLock";
import { generateQuests } from "@/lib/gamification";

// Lazy load heavy components
const Timeline = lazy(() =>
  import("@/components/Timeline").then((m) => ({ default: m.Timeline })),
);
const Insights = lazy(() =>
  import("@/components/Insights").then((m) => ({ default: m.Insights })),
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

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-in fade-in duration-500">
    <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    <p className="text-sm text-slate-500 font-medium">Loading experience...</p>
  </div>
);

function App() {
  const actions = useAppActions();
  const {
    friends,
    events,
    reminders,
    goals,
    memories,
    gratitudeEntries,
    quests,
    pinnedFriendIds,
    userProfile,
    isAuthenticated,
    isGuest,
    setIsGuest,
    login,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "level" | "recent" | "pinned">(
    "recent",
  );
  const [groupBy, setGroupBy] = useState<"none" | "relationship" | "level">(
    "none",
  );
  const [isMuted, setIsMuted] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isAutoSyncEnabled] = useStorage<boolean>("auto-sync-enabled", false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = useCallback(
    (googleUser: { name: string; email: string; picture: string }) => {
      login({ name: googleUser.name, avatar: googleUser.picture });
      toast.success(`Welcome back, ${googleUser.name}!`);
    },
    [login],
  );

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

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data?.type === "SYNC_GDRIVE") {
          performSync();
        }
      };
      navigator.serviceWorker.addEventListener("message", handleSWMessage);

      const handleManualSyncTrigger = () => {
        performSync();
        navigator.serviceWorker.ready.then((reg) => {
          if ("sync" in reg) {
            (reg as any).sync.register("sync-gdrive").catch(console.error);
          }
        });
      };
      window.addEventListener("loom-sync", handleManualSyncTrigger);

      return () => {
        navigator.serviceWorker.removeEventListener("message", handleSWMessage);
        window.removeEventListener("loom-sync", handleManualSyncTrigger);
      };
    }
  }, [performSync]);

  const { aggregateStats } = useStats();

  useEffect(() => {
    const handleNotificationAction = (e: CustomEvent) => {
      const { action, friendId } = e.detail;
      if (action === "log") {
        const friend = friends.find((f) => f.id === friendId);
        if (friend) {
          actions.setSelectedFriend(friend);
          actions.setIsAddEventOpen(true);
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
  }, [friends, actions]);

  useEffect(() => {
    if (friends.length > 0) {
      const timer = setTimeout(() => {
        showNudgesOnce(friends, events, actions.setSelectedFriend);
        requestNotificationPermission().then((granted) => {
          if (granted) {
            checkAndNotifyExpiringStreaks(friends);
          }
        });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [friends, events, actions.setSelectedFriend]);

  // Initialize Quests
  useEffect(() => {
    const now = new Date();
    const activeQuests = quests.filter((q) => new Date(q.expiresAt) > now);
    if (activeQuests.length < 3) {
      const newQuests = generateQuests();
      actions.setQuests(newQuests);
    }
  }, [quests, actions.setQuests]);

  useEffect(() => {
    const newReminders = generateReminders(friends, events);
    actions.setReminders((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const filteredNew = newReminders.filter((r) => !existingIds.has(r.id));
      return [...prev, ...filteredNew];
    });
  }, [friends, events, actions.setReminders]);

  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const activeReminderCount = useMemo(
    () => reminders.filter((r) => !r.dismissed).length,
    [reminders],
  );

  useKeyboardShortcuts({
    n: () => actions.setIsAddFriendOpen(true),
    e: () => actions.setIsAddEventOpen(true),
    k: () => searchInputRef.current?.focus(),
    "1": () => setActiveTab("connections"),
    "2": () => setActiveTab("timeline"),
    "3": () => setActiveTab("ai_hub"),
    "4": () => setActiveTab("groups"),
    "5": () => setActiveTab("calendar"),
    r: () => actions.setShowReminders(!actions.showReminders),
    escape: () => {
      if (actions.selectedFriend) actions.setSelectedFriend(null);
      if (actions.isAddFriendOpen) actions.setIsAddFriendOpen(false);
      if (actions.isAddEventOpen) actions.setIsAddEventOpen(false);
      if (actions.editingFriend) actions.setEditingFriend(null);
    },
  });

  useEffect(() => {
    const performSearch = async () => {
      if (isSemanticSearch && searchQuery.trim().length > 2) {
        setIsSearching(true);
        const results = await semanticSearch.search(searchQuery, friends);
        setSearchResults(results);
        setIsSearching(false);
      }
    };
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
    const groups: Record<string, any[]> = {};
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

  const globalDialogs = (
    <GlobalDialogs
      friends={friends}
      events={events}
      reminders={reminders}
      goals={goals}
      memories={memories}
      gratitudeEntries={gratitudeEntries}
      isExportOpen={actions.isExportOpen}
      setIsExportOpen={actions.setIsExportOpen}
      isAddFriendOpen={actions.isAddFriendOpen}
      setIsAddFriendOpen={actions.setIsAddFriendOpen}
      isCompareOpen={actions.isCompareOpen}
      setIsCompareOpen={actions.setIsCompareOpen}
      isSecurityOpen={actions.isSecurityOpen}
      setIsSecurityOpen={actions.setIsSecurityOpen}
      isWrappedOpen={actions.isWrappedOpen}
      setIsWrappedOpen={actions.setIsWrappedOpen}
      userName={userProfile.name}
      onAddFriend={actions.handleAddFriend}
      onImportAllData={actions.handleImportAllData}
    />
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

  if (actions.isUserProfileOpen) {
    return (
      <div className="min-h-screen">
        <Toaster position="top-right" />
        <UserProfileView
          profile={userProfile}
          events={events.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )}
          stats={aggregateStats}
          onBack={() => actions.setIsUserProfileOpen(false)}
          onUpdateProfile={actions.setUserProfile}
          onDeleteEvent={actions.handleDeleteEvent}
        />
        {globalDialogs}
      </div>
    );
  }

  if (actions.selectedFriend) {
    return (
      <div className="min-h-screen">
        <Toaster position="top-right" />
        <FriendDetail
          friend={actions.selectedFriend}
          events={actions.getFriendEvents(actions.selectedFriend.id)}
          stats={actions.getFriendStats(actions.selectedFriend.id)}
          goals={goals}
          memories={memories}
          gratitudeEntries={gratitudeEntries}
          allFriends={friends}
          userName={userProfile.name}
          onBack={() => actions.setSelectedFriend(null)}
          onAddEvent={() => actions.setIsAddEventOpen(true)}
          onDeleteEvent={actions.handleDeleteEvent}
          onEditFriend={() => actions.setEditingFriend(actions.selectedFriend)}
          onAddGoal={actions.handleAddGoal}
          onDeleteGoal={actions.handleDeleteGoal}
          onAddMemory={actions.handleAddMemory}
          onDeleteMemory={actions.handleDeleteMemory}
          onAddGratitude={actions.handleAddGratitude}
          onDeleteGratitude={actions.handleDeleteGratitude}
          onUpdateGiftIdeas={actions.handleUpdateGiftIdeas}
          onUpdateInterests={actions.handleUpdateInterests}
          onIntroduce={(eventA, eventB) => {
            actions.handleAddEvent(eventA);
            actions.handleAddEvent(eventB);
            actions.setFriends((prev) =>
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
          onUpdateConnections={actions.handleUpdateConnections}
        />
        <Dialog
          open={actions.isAddEventOpen}
          onOpenChange={actions.setIsAddEventOpen}
        >
          <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-3 sm:p-6 max-h-[95vh] overflow-y-auto rounded-2xl">
            <DialogHeader className="mb-2 sm:mb-4">
              <DialogTitle className="text-xl font-bold">
                Log Event for {actions.selectedFriend.name}
              </DialogTitle>
            </DialogHeader>
            <AddEventForm
              friendId={actions.selectedFriend.id}
              friends={friends}
              onSubmit={actions.handleAddEvent}
              onCancel={() => actions.setIsAddEventOpen(false)}
            />
          </DialogContent>
        </Dialog>
        <Dialog
          open={!!actions.editingFriend}
          onOpenChange={() => actions.setEditingFriend(null)}
        >
          <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-3 sm:p-6 max-h-[95vh] overflow-y-auto rounded-2xl">
            <DialogHeader className="mb-2 sm:mb-4">
              <DialogTitle className="text-xl font-bold">
                Edit Connection
              </DialogTitle>
            </DialogHeader>
            {actions.editingFriend && (
              <AddFriendForm
                initialData={actions.editingFriend}
                onSubmit={actions.handleEditFriend}
                onCancel={() => actions.setEditingFriend(null)}
                isEditing
              />
            )}
          </DialogContent>
        </Dialog>

        {globalDialogs}
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
                <div className="hidden sm:flex items-center gap-0 sm:gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-0.5 sm:p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                  <ThemeToggle />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => actions.setShowReminders(!actions.showReminders)}
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
                    onOpenProfile={() => actions.setIsUserProfileOpen(true)}
                    onLogout={actions.handleLogout}
                    isGuest={isGuest}
                  />
                </div>

                <div className="sm:hidden">
                  <MobileMenu
                    isMuted={isMuted}
                    onToggleMute={() => {
                      const muted = audioService.toggleMute();
                      setIsMuted(muted);
                      if (!muted) audioService.playClick();
                    }}
                    onBackupRestore={() => actions.setIsExportOpen(true)}
                    onAddFriend={() => actions.setIsAddFriendOpen(true)}
                    onCompareFriends={() => actions.setIsCompareOpen(true)}
                    onOpenProfile={() => actions.setIsUserProfileOpen(true)}
                    onOpenSecuritySettings={() => actions.setIsSecurityOpen(true)}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                </div>

                <div className="hidden md:flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => actions.setIsExportOpen(true)}
                    className="h-10 w-10 rounded-xl"
                    title="Backup & Restore"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => actions.setIsCompareOpen(true)}
                    className="h-10 w-10 rounded-xl"
                    title="Compare Friends"
                  >
                    <GitCompare className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => actions.setIsSecurityOpen(true)}
                    className={isAuthenticated ? "text-green-600" : "text-slate-400"}
                    title="Security Settings"
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </Button>
                </div>

                <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

                <div className="hidden sm:block">
                  <Button
                    onClick={() => actions.setIsAddFriendOpen(true)}
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
        {actions.showReminders && (
          <div className="fixed top-16 right-0 sm:right-4 z-50 w-full sm:w-80 max-h-[calc(100vh-5rem)] overflow-auto px-4 sm:px-0">
            <div className="mt-2 sm:mt-0 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
              <Reminders
                reminders={reminders}
                friends={friends}
                onDismiss={(id) =>
                  actions.setReminders((prev) =>
                    prev.map((r) =>
                      r.id === id ? { ...r, dismissed: true } : r,
                    ),
                  )
                }
                onSelectFriend={(f) => {
                  actions.setSelectedFriend(f);
                  actions.setShowReminders(false);
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
                onOpenWrapped={() => actions.setIsWrappedOpen(true)}
                onSelectFriend={actions.setSelectedFriend}
              />
            </TabsContent>

            <TabsContent value="connections" className="space-y-6">
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
                  if (friendId) actions.handlePinFriend(friendId);
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl transition-all text-slate-400 dark:text-slate-500 text-sm"
              >
                <Pin className="w-4 h-4" />
                <span>Drop connection here to {pinnedFriendIds.length > 0 ? 'unpin' : 'pin'}</span>
              </div>

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
                    onClick={() => actions.setIsAddFriendOpen(true)}
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
                                  onPin={() => actions.handlePinFriend(friend.id)}
                                  onClick={() => actions.setSelectedFriend(friend)}
                                  onDelete={() => actions.handleDeleteFriend(friend.id)}
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
                                    onPin={() => actions.handlePinFriend(friend.id)}
                                    onClick={() => actions.setSelectedFriend(friend)}
                                    onDelete={() =>
                                      actions.handleDeleteFriend(friend.id)
                                    }
                                    onLogEvent={() => {
                                      actions.setSelectedFriend(friend);
                                      actions.setIsAddEventOpen(true);
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
                    actions.setSelectedFriend(f);
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
                      onSelectFriend={actions.setSelectedFriend}
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
                onRefresh={() => {
                  const newQuests = generateQuests();
                  actions.setQuests(newQuests);
                  toast.success("Quests refreshed!");
                }}
                onClaim={(id) => {
                  audioService.playSuccess();
                  actions.setQuests((prev) =>
                    prev.map((q) =>
                      q.id === id ? { ...q, completed: true } : q,
                    ),
                  );
                  toast.success("Quest claimed!");
                }}
              />
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarView
                friends={friends}
                events={events}
                onSelectFriend={(f) => {
                  actions.setSelectedFriend(f);
                  audioService.playClick();
                }}
              />
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
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
                  onDelete={actions.handleDeleteEvent}
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
            onClick={() => actions.setIsAddFriendOpen(true)}
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
