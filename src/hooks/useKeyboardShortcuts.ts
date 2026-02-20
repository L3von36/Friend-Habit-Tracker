import { useEffect, useCallback } from 'react';

interface ShortcutMap {
    [key: string]: () => void;
}

/**
 * useKeyboardShortcuts - Global keyboard shortcut handler
 * Keys: n=new friend, e=log event, k=search, esc=close/back, 1-4=tabs, ?=help
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
    const handler = useCallback((e: KeyboardEvent) => {
        // Don't trigger when typing in inputs, textareas, selects
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
        if (target.isContentEditable) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;

        const key = e.key.toLowerCase();
        if (shortcuts[key]) {
            e.preventDefault();
            shortcuts[key]();
        }
    }, [shortcuts]);

    useEffect(() => {
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handler]);
}

export const SHORTCUT_LABELS: Record<string, string> = {
    n: 'New Friend',
    e: 'Log Event',
    k: 'Focus Search',
    '1': 'Friends Tab',
    '2': 'Timeline Tab',
    '3': 'Insights Tab',
    '4': 'Groups Tab',
    '5': 'Calendar Tab',
    r: 'Toggle Reminders',
    '?': 'Show Shortcuts',
    Escape: 'Close / Go Back',
};
