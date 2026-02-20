import { useEffect, useCallback, useRef } from 'react';
import { googleDriveService } from '@/lib/googleDrive';
import { createBackup } from '@/lib/backup';
import { useStorage } from './useStorage';
import type { Friend, Event, Reminder, RelationshipGoal, Memory, GratitudeEntry } from '@/types';

interface AutoSyncProps {
    friends: Friend[];
    events: Event[];
    reminders: Reminder[];
    goals: RelationshipGoal[];
    memories: Memory[];
    gratitudeEntries: GratitudeEntry[];
    enabled: boolean;
}

export function useAutoSync({
    friends,
    events,
    reminders,
    goals,
    memories,
    gratitudeEntries,
    enabled
}: AutoSyncProps) {
    const [lastSync, setLastSync] = useStorage<string | null>('last-gdrive-sync', null);
    const syncTimeoutRef = useRef<any>(null);


    const performSync = useCallback(async () => {
        if (!enabled || !googleDriveService.isAuthenticated()) return;

        try {
            const backupContent = await createBackup(
                friends,
                events,
                reminders,
                goals,
                memories,
                gratitudeEntries
            );

            await googleDriveService.uploadBackup(backupContent);
            setLastSync(new Date().toISOString());
            console.log('Auto-sync successful');
        } catch (error) {
            console.error('Auto-sync failed:', error);
            // We don't toast on every failure to avoid annoying the user, 
            // but maybe we should if it's a persistent auth error.
        }
    }, [friends, events, reminders, goals, memories, gratitudeEntries, enabled, setLastSync]);

    useEffect(() => {
        if (!enabled) return;

        // Debounce sync to every 30 seconds after change
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }

        syncTimeoutRef.current = setTimeout(() => {
            performSync();
        }, 30000);

        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, [friends, events, reminders, goals, memories, gratitudeEntries, enabled, performSync]);

    return { lastSync, performSync };
}
