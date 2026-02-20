import type { Friend, Event, Reminder, RelationshipGoal, Memory, GratitudeEntry } from '@/types';
import * as CryptoJS from 'crypto-js';

export interface BackupData {
    version: number;
    timestamp: string;
    data: {
        friends: Friend[];
        events: Event[];
        reminders: Reminder[];
        goals: RelationshipGoal[];
        memories: Memory[];
        gratitudeEntries: GratitudeEntry[];
        media?: {
            id: string;
            type: 'audio' | 'image';
            base64: string;
            createdAt: string;
            relatedId?: string;
        }[];
    };
    checksum: string;
    isEncrypted?: boolean;
}

const CURRENT_VERSION = 1;

async function generateChecksum(data: any): Promise<string> {
    const json = JSON.stringify(data);
    const msgBuffer = new TextEncoder().encode(json);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createBackup(
    friends: Friend[],
    events: Event[],
    reminders: Reminder[],
    goals: RelationshipGoal[],
    memories: Memory[],
    gratitudeEntries: GratitudeEntry[],
    mediaItems: { id: string; type: 'audio' | 'image'; blob: Blob; createdAt: string; relatedId?: string; }[] = [],
    password?: string
): Promise<string> {
    const serializedMedia = await Promise.all(mediaItems.map(async item => {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove data url prefix: "data:*/*;base64,"
                resolve(result.split(',')[1]);
            };
        });
        reader.readAsDataURL(item.blob);
        const base64 = await base64Promise;
        return {
            id: item.id,
            type: item.type,
            base64,
            createdAt: item.createdAt,
            relatedId: item.relatedId
        };
    }));

    const payload = {
        friends,
        events,
        reminders,
        goals,
        memories,
        gratitudeEntries,
        media: serializedMedia,
    };

    const checksum = await generateChecksum(payload);

    let backup: BackupData = {
        version: CURRENT_VERSION,
        timestamp: new Date().toISOString(),
        data: payload,
        checksum,
        isEncrypted: !!password,
    };

    if (password) {
        // Encrypt the entire backup object (excluding the flag that says it's encrypted, 
        // effectively we encrypt the stringified JSON of the backup data)
        // actually, standard practice: keep metadata clear, encrypt 'data'.
        // But to keep it simple and match schema:
        // We will encrypt the *content* of the data field?
        // No, let's encrypt the whole string and wrap it.
        // Wait, validateAndParseBackup expects a JSON string that parses to BackupData.

        // Strategy:
        // 1. Create the backup object as usual.
        // 2. Encrypt the `data` field? No, `data` is an object.
        // 3. Let's encrypt the `data` object into a string ciphertext.
        // 4. Store it in a new field `encryptedData`?

        const dataJson = JSON.stringify(payload);
        const encrypted = CryptoJS.AES.encrypt(dataJson, password).toString();

        // We modify the backup object to hold encrypted data
        // We need to cast or use 'any' if we drastically change structure, 
        // OR we just send the encrypted string as 'data' (but types mismatch).
        // Let's change BackupData type marginally or just cast.

        const secureBackup = {
            version: CURRENT_VERSION,
            timestamp: new Date().toISOString(),
            isEncrypted: true,
            checksum: checksum, // Checksum of the ORIGINAL data
            encryptedData: encrypted
        };

        return JSON.stringify(secureBackup, null, 2);
    }

    return JSON.stringify(backup, null, 2);
}

export async function validateAndParseBackup(jsonString: string, password?: string): Promise<BackupData['data']> {
    let backup: any;
    try {
        backup = JSON.parse(jsonString);
    } catch (e) {
        throw new Error('Invalid JSON format');
    }

    if (backup.isEncrypted) {
        if (!password) {
            throw new Error('PASSWORD_REQUIRED');
        }
        if (!backup.encryptedData) {
            throw new Error('Invalid encrypted backup format');
        }

        try {
            const bytes = CryptoJS.AES.decrypt(backup.encryptedData, password);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedData) {
                throw new Error('Incorrect password');
            }

            backup.data = JSON.parse(decryptedData);
        } catch (e) {
            throw new Error('Incorrect password or corrupted data');
        }
    }

    if (!backup.version || !backup.data || !backup.checksum) {
        throw new Error('Invalid backup format: missing required fields');
    }

    // Validate checksum
    const calculatedChecksum = await generateChecksum(backup.data);
    if (calculatedChecksum !== backup.checksum) {
        throw new Error('Data corruption detected: checksum mismatch');
    }

    if (backup.version > CURRENT_VERSION) {
        throw new Error(`Backup version ${backup.version} is newer than supported version ${CURRENT_VERSION}`);
    }

    return backup.data;
}

export function triggerDownload(content: string, filename: string) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
