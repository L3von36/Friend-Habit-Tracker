import { openDB, type DBSchema } from 'idb';
import { generateId } from './id';

interface LoomDB extends DBSchema {
    media: {
        key: string;
        value: {
            id: string;
            type: 'audio' | 'image';
            blob: Blob;
            createdAt: string;
            relatedId?: string; // ID of the event or memory this is attached to
        };
        indexes: { 'by-date': string; 'by-related': string };
    };
}

const DB_NAME = 'loom-media';
const STORE_NAME = 'media';

async function getDB() {
    return openDB<LoomDB>(DB_NAME, 1, {
        upgrade(db) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('by-date', 'createdAt');
            store.createIndex('by-related', 'relatedId');
        },
    });
}

export interface MediaItem {
    id: string;
    type: 'audio' | 'image';
    blob: Blob;
    createdAt: string;
    relatedId?: string;
    url?: string; // Transient URL for display
}

export const mediaStorage = {
    async saveMedia(blob: Blob, type: 'audio' | 'image', relatedId?: string): Promise<string> {
        const db = await getDB();
        const id = generateId();
        await db.put(STORE_NAME, {
            id,
            type,
            blob,
            createdAt: new Date().toISOString(),
            relatedId,
        });
        return id;
    },

    async getMedia(id: string): Promise<MediaItem | undefined> {
        const db = await getDB();
        const item = await db.get(STORE_NAME, id);
        if (item) {
            return { ...item, url: URL.createObjectURL(item.blob) };
        }
        return undefined;
    },

    async getAllMedia(): Promise<MediaItem[]> {
        const db = await getDB();
        const items = await db.getAllFromIndex(STORE_NAME, 'by-date');
        return items.map(item => ({ ...item, url: URL.createObjectURL(item.blob) })).reverse();
    },

    async getMediaForRelatedId(relatedId: string): Promise<MediaItem[]> {
        const db = await getDB();
        const items = await db.getAllFromIndex(STORE_NAME, 'by-related', relatedId);
        return items.map(item => ({ ...item, url: URL.createObjectURL(item.blob) }));
    },

    async deleteMedia(id: string): Promise<void> {
        const db = await getDB();
        await db.delete(STORE_NAME, id);
    },

    async restoreMedia(id: string, blob: Blob, type: 'audio' | 'image', createdAt: string, relatedId?: string): Promise<void> {
        const db = await getDB();
        await db.put(STORE_NAME, {
            id,
            type,
            blob,
            createdAt,
            relatedId,
        });
    }
};
