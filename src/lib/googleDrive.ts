export interface GoogleDriveFile {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime: string;
}

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILENAME = 'friend-habit-tracker-backup.json';

class GoogleDriveService {
    private accessToken: string | null = null;
    private clientId: string = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

    constructor() {
        this.loadGisScript();
    }

    private loadGisScript() {
        if (typeof window === 'undefined') return;
        if (document.getElementById('google-gis-script')) return;

        const script = document.createElement('script');
        script.id = 'google-gis-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    public async authenticate(): Promise<string> {
        return new Promise((resolve, reject) => {
            const g = (window as any).google;
            if (typeof window === 'undefined' || !g) {
                reject(new Error('Google Identity Services not loaded'));
                return;
            }

            const client = g.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: SCOPES,
                callback: (response: any) => {
                    if (response.error) {
                        reject(response);
                    } else {
                        this.accessToken = response.access_token;
                        resolve(response.access_token);
                    }
                },
            });

            client.requestAccessToken();
        });
    }

    public async findBackupFile(): Promise<GoogleDriveFile | null> {
        if (!this.accessToken) throw new Error('Not authenticated');

        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and trashed=false&fields=files(id, name, mimeType, modifiedTime)`,
            {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }
        );

        const data = await response.json();
        return data.files && data.files.length > 0 ? data.files[0] : null;
    }

    public async listBackups(): Promise<GoogleDriveFile[]> {
        if (!this.accessToken) throw new Error('Not authenticated');

        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=mimeType='application/json' and trashed=false&fields=files(id, name, mimeType, modifiedTime)&orderBy=modifiedTime desc`,
            {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }
        );

        const data = await response.json();
        return data.files || [];
    }

    public async uploadBackup(content: string, filename: string = BACKUP_FILENAME): Promise<void> {
        if (!this.accessToken) throw new Error('Not authenticated');

        // For named backups from DataExport, we usually create NEW files 
        // For the default sync, we PATCH the existing one.
        let existingFile = null;
        if (filename === BACKUP_FILENAME) {
            existingFile = await this.findBackupFile();
        }

        const metadata = {
            name: filename,
            mimeType: 'application/json',
        };

        const form = new FormData();
        form.append(
            'metadata',
            new Blob([JSON.stringify(metadata)], { type: 'application/json' })
        );
        form.append('file', new Blob([content], { type: 'application/json' }));

        let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        let method = 'POST';

        if (existingFile) {
            url = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
            method = 'PATCH';
        }

        const response = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
            body: form,
        });

        if (!response.ok) {
            throw new Error('Failed to upload backup to Google Drive');
        }
    }

    public async downloadBackup(fileId?: string): Promise<string> {
        if (!this.accessToken) throw new Error('Not authenticated');

        let targetId = fileId;
        if (!targetId) {
            const file = await this.findBackupFile();
            if (!file) throw new Error('No backup file found');
            targetId = file.id;
        }

        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${targetId}?alt=media`,
            {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to download backup from Google Drive');
        }

        return await response.text();
    }

    public async syncNow(): Promise<void> {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('friend-tracker-sync'));
        }
    }

    public isAuthenticated(): boolean {
        return !!this.accessToken;
    }
}

export const googleDriveService = new GoogleDriveService();
