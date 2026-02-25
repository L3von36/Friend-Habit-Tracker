import { useState, useCallback, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { audioService } from '@/lib/audio';
import { generateId } from '@/lib/id';
import { calculateEventXP, checkStreak, updateFriendXP, generateQuests } from '@/lib/gamification';
import type { Friend, Event, RelationshipGoal, Memory, GratitudeEntry } from '@/types';
import { mediaStorage } from '@/lib/mediaStorage';

export function useAppActions() {
  const {
    friends, setFriends,
    events, setEvents,
    reminders, setReminders,
    goals, setGoals,
    memories, setMemories,
    gratitudeEntries, setGratitudeEntries,
    quests, setQuests,
    pinnedFriendIds, setPinnedFriendIds,
    userProfile, setUserProfile,
    logout
  } = useStore();

  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isWrappedOpen, setIsWrappedOpen] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    toast.info("Signed out successfully");
  }, [logout]);

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

      const xpGained = calculateEventXP(newEvent);

      setFriends((prev) =>
        prev.map((f) => {
          if (f.id === event.friendId) {
            let updated = checkStreak(f, new Date(event.date));
            const { friend: leveledFriend, leveledUp } = updateFriendXP(
              updated,
              xpGained,
            );

            if (leveledUp) {
              toast.success(`🎉 ${leveledFriend.name} reached Level ${leveledFriend.level}!`);
              audioService.playSystemChirp();
            }
            return leveledFriend;
          }
          return f;
        }),
      );

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

      setFriends((prev) =>
        prev.map((f) => {
          if (f.id === memory.friendId) {
            const { friend, leveledUp } = updateFriendXP(f, 50);
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

  return {
    friends,
    events,
    reminders,
    goals,
    memories,
    gratitudeEntries,
    quests,
    pinnedFriendIds,
    userProfile,
    selectedFriend,
    isAddFriendOpen,
    isAddEventOpen,
    editingFriend,
    isCompareOpen,
    isExportOpen,
    isSecurityOpen,
    isWrappedOpen,
    showReminders,
    isUserProfileOpen,
    setSelectedFriend,
    setIsAddFriendOpen,
    setIsAddEventOpen,
    setEditingFriend,
    setIsCompareOpen,
    setIsExportOpen,
    setIsSecurityOpen,
    setIsWrappedOpen,
    setShowReminders,
    setIsUserProfileOpen,
    handleLogout,
    handleAddFriend,
    handleEditFriend,
    handleDeleteFriend,
    handlePinFriend,
    handleAddEvent,
    handleDeleteEvent,
    handleAddGoal,
    handleDeleteGoal,
    handleAddMemory,
    handleDeleteMemory,
    handleAddGratitude,
    handleDeleteGratitude,
    handleUpdateGiftIdeas,
    handleUpdateInterests,
    handleUpdateConnections,
    handleImportAllData,
    getFriendEvents,
    getFriendStats,
    setUserProfile,
    setReminders,
    setQuests,
    setEvents,
    setFriends,
    setGoals,
    setMemories,
    setGratitudeEntries
  };
}
