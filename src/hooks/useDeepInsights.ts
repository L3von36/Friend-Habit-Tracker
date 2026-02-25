import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { requestDeepAnalysis, type DeepInsight } from '@/lib/intelligence';
import { useStorage } from './useStorage';

export function useDeepInsights() {
  const { friends, events } = useStore();

  const [insight, setInsight] =
    useStorage<DeepInsight | null>('deep-insight-data', null);

  const [lastAnalysisDate, setLastAnalysisDate] =
    useStorage<string | null>('last-deep-analysis', null);

  const [isLoading, setIsLoading] = useState(false);

  const performAnalysis = useCallback(async () => {
    if (!friends || friends.length === 0) return;

    setIsLoading(true);
    try {
      const newInsight = await requestDeepAnalysis(friends, events);

      // ✅ Accept Loom JSON directly (no invalid field checks)
      if (newInsight) {
        setInsight(newInsight);
        setLastAnalysisDate(new Date().toISOString());
      }
    } catch (err) {
      console.error('Deep insight error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [friends, events, setInsight, setLastAnalysisDate]);

  // Background sync support
  useEffect(() => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((registration: any) => {
        registration.sync.register('sync-intelligence').catch(() => {});
      });
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SYNC_INTELLIGENCE') performAnalysis();
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () =>
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
  }, [performAnalysis]);

  // Auto-trigger (initial + stale)
  useEffect(() => {
    if (!insight && friends.length > 0 && !isLoading) {
      performAnalysis();
      return;
    }

    if (lastAnalysisDate) {
      const diffDays =
        (Date.now() - new Date(lastAnalysisDate).getTime()) /
        (1000 * 60 * 60 * 24);

      if (diffDays >= 7) performAnalysis();
    }
  }, [insight, friends.length, isLoading, lastAnalysisDate, performAnalysis]);

  return {
    insight,
    isLoading,
    lastAnalysisDate,
    refreshInsight: performAnalysis,
  };
}