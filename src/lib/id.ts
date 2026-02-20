/**
 * Generates a unique ID (UUID v4 format).
 * Provides a fallback for non-secure contexts where crypto.randomUUID might be undefined.
 */
export function generateId(): string {
    // Try standard crypto.randomUUID first
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    // Fallback for non-secure contexts (e.g. local IP without HTTPS)
    // Robust fallback using Math.random and Date.now
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    }) + '-' + Date.now().toString(16).slice(-4);
}
