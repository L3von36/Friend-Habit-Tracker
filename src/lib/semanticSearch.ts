import { env } from '@xenova/transformers';
import { generateId } from './id';

// Skip local model checks since we're in browser
env.allowLocalModels = false;
env.useBrowserCache = true;

class SemanticSearchService {
  private static instance: SemanticSearchService;
  public worker: Worker | null = null;
  private progressListeners: ((progress: any) => void)[] = [];
  public initializationProgress = 0;
  public status: 'idle' | 'loading' | 'ready' | 'error' = 'idle';

  private constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker(new URL('./semanticWorker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        if (type === 'init_progress') {
          if (payload.status === 'progress') {
            this.initializationProgress = payload.progress;
          }
          this.progressListeners.forEach(l => l(payload));
        }
        if (type === 'init_complete') {
          this.status = 'ready';
          this.initializationProgress = 100;
          this.progressListeners.forEach(l => l({ status: 'done', progress: 100 }));
          console.log('Semantic Search Model Initialized');
        }
        if (type === 'error') {
          this.status = 'error';
          this.progressListeners.forEach(l => l({ status: 'error', message: payload }));
        }
      };
    }
  }

  public addProgressListener(listener: (progress: any) => void) {
    this.progressListeners.push(listener);
    return () => {
      this.progressListeners = this.progressListeners.filter(l => l !== listener);
    };
  }

  public static getInstance(): SemanticSearchService {
    if (!SemanticSearchService.instance) {
      SemanticSearchService.instance = new SemanticSearchService();
    }
    return SemanticSearchService.instance;
  }

  public async indexData(documents: any[]): Promise<void> {
    if (!this.worker) return;

    return new Promise((resolve) => {
      const id = generateId();

      const handler = (event: MessageEvent) => {
        const { type, requestId } = event.data;
        if (type === 'index_complete' && requestId === id) {
          this.worker?.removeEventListener('message', handler);
          resolve();
        }
      };

      this.worker?.addEventListener('message', handler);

      this.worker?.postMessage({
        type: 'index',
        payload: { documents },
        requestId: id
      });
    });
  }

  public async search(query: string, topK = 5): Promise<any[]> {
    if (!this.worker) return [];

    return new Promise((resolve) => {
      const id = generateId();

      const handler = (event: MessageEvent) => {
        const { type, payload, requestId } = event.data;
        if (type === 'search_results' && requestId === id) {
          this.worker?.removeEventListener('message', handler);
          resolve(payload);
        }
      };

      this.worker?.addEventListener('message', handler);
      // Remove 'documents' from payload, assuming pre-indexed
      this.worker?.postMessage({
        type: 'search',
        payload: { query, topK },
        requestId: id
      });
    });
  }

  public initialize() {
    this.worker?.postMessage({ type: 'init' });
  }
}

export const semanticSearch = SemanticSearchService.getInstance();
