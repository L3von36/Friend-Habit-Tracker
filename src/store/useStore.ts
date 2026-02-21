import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Friend, Event, Reminder, RelationshipGoal, Memory, GratitudeEntry, UserProfile, Quest } from '@/types';

interface AppState {
    // Data
    friends: Friend[];
    events: Event[];
    reminders: Reminder[];
    goals: RelationshipGoal[];
    memories: Memory[];
    gratitudeEntries: GratitudeEntry[];
    quests: Quest[];
    pinnedFriendIds: string[];
    userProfile: UserProfile;

    // Auth
    isAuthenticated: boolean;
    isGuest: boolean;

    // Actions
    setFriends: (friends: Friend[] | ((prev: Friend[]) => Friend[])) => void;
    setEvents: (events: Event[] | ((prev: Event[]) => Event[])) => void;
    setReminders: (reminders: Reminder[] | ((prev: Reminder[]) => Reminder[])) => void;
    setGoals: (goals: RelationshipGoal[] | ((prev: RelationshipGoal[]) => RelationshipGoal[])) => void;
    setMemories: (memories: Memory[] | ((prev: Memory[]) => Memory[])) => void;
    setGratitudeEntries: (entries: GratitudeEntry[] | ((prev: GratitudeEntry[]) => GratitudeEntry[])) => void;
    setQuests: (quests: Quest[] | ((prev: Quest[]) => Quest[])) => void;
    setPinnedFriendIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    setUserProfile: (profile: UserProfile | ((prev: UserProfile) => UserProfile)) => void;

    setIsAuthenticated: (val: boolean) => void;
    setIsGuest: (val: boolean) => void;

    login: (googleUser: { name: string; avatar?: string }) => void;
    logout: () => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            // Initial state
            friends: [],
            events: [],
            reminders: [],
            goals: [],
            memories: [],
            gratitudeEntries: [],
            quests: [],
            pinnedFriendIds: [],
            userProfile: {
                name: 'Hero',
                color: 'bg-violet-500',
                traits: ['Growth Mindset', 'Empathetic'],
                interests: ['Psychology', 'Personal Growth'],
                notes: 'I create meaningful connections and track my personal relationship growth.'
            },
            isAuthenticated: false,
            isGuest: false,

            // Actions
            setFriends: (friends) => set((state) => ({
                friends: typeof friends === 'function' ? friends(state.friends) : friends
            })),
            setEvents: (events) => set((state) => ({
                events: typeof events === 'function' ? events(state.events) : events
            })),
            setReminders: (reminders) => set((state) => ({
                reminders: typeof reminders === 'function' ? reminders(state.reminders) : reminders
            })),
            setGoals: (goals) => set((state) => ({
                goals: typeof goals === 'function' ? goals(state.goals) : goals
            })),
            setMemories: (memories) => set((state) => ({
                memories: typeof memories === 'function' ? memories(state.memories) : memories
            })),
            setGratitudeEntries: (entries) => set((state) => ({
                gratitudeEntries: typeof entries === 'function' ? entries(state.gratitudeEntries) : entries
            })),
            setQuests: (quests) => set((state) => ({
                quests: typeof quests === 'function' ? quests(state.quests) : quests
            })),
            setPinnedFriendIds: (ids) => set((state) => ({
                pinnedFriendIds: typeof ids === 'function' ? ids(state.pinnedFriendIds) : ids
            })),
            setUserProfile: (profile) => set((state) => ({
                userProfile: typeof profile === 'function' ? profile(state.userProfile) : profile
            })),

            setIsAuthenticated: (val) => set({ isAuthenticated: val }),
            setIsGuest: (val) => set({ isGuest: val }),

            login: (googleUser) => set((state) => ({
                userProfile: {
                    ...state.userProfile,
                    name: googleUser.name,
                    avatar: googleUser.avatar,
                },
                isAuthenticated: true,
                isGuest: false
            })),

            logout: () => set({
                isAuthenticated: false,
                isGuest: false
            })
        }),
        {
            name: 'friend-tracker-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
