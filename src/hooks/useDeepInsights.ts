import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { requestDeepAnalysis, type DeepInsight } from '@/lib/intelligence';
import { useStorage } from './useStorage';

export function useDeepInsights() {
    const { friends, events } = useStore();
    const [insight, setInsight] = useStorage<DeepInsight | null>('deep-insight-data', null);
    const [lastAnalysisDate, setLastAnalysisDate] = useStorage<string | null>('last-deep-analysis', null);
    const [isLoading, setIsLoading] = useState(false);

    const performAnalysis = useCallback(async () => {
        if (friends.length === 0) return;

        setIsLoading(true);
        try {
            const newInsight = await requestDeepAnalysis(friends, events);
            if (newInsight) {
                setInsight(newInsight);
                setLastAnalysisDate(new Date().toISOString());

                // Show a simple notification if in foreground and not already loaded
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    // Optional: Simple local notification logic
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [friends, events, setInsight, setLastAnalysisDate]);

    // 1. Register Background Sync
    useEffect(() => {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then((registration: any) => {
                registration.sync.register('sync-intelligence').catch((err: any) => {
                    console.warn('Background sync registration failed:', err);
                });
            });
        }
    }, []);

    // 2. Handle SW Messages
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'SYNC_INTELLIGENCE') {
                performAnalysis();
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleMessage);
            return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
        }
    }, [performAnalysis]);

    // 3. Automatic weekly trigger (fallback)
    useEffect(() => {
        if (!lastAnalysisDate) {
            performAnalysis();
            return;
        }

        const lastDate = new Date(lastAnalysisDate);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays >= 7) {
            performAnalysis();
        }
    }, [lastAnalysisDate, performAnalysis]);

    return {
        insight,
        isLoading,
        lastAnalysisDate,
        refreshInsight: performAnalysis
    };
}
