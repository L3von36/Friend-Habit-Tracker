import { env } from '@xenova/transformers';
import { generateId } from './id';
import { getGroqApiKey } from './groq';

// Allow local models if provided by the app and enable browser cache
env.allowLocalModels = true;
env.useBrowserCache = true;

class SemanticSearchService {
  private static instance: SemanticSearchService;
  public worker: Worker | null = null;
  private progressListeners: ((progress: any) => void)[] = [];
  public initializationProgress = 0;
  public status: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  // store latest app data for worker RPC
  private friends: any[] = [];
  private events: any[] = [];
  private memories: any[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker(new URL('./semanticWorker.ts', import.meta.url), {
        type: 'module',
      });

      console.info('[semanticSearch] worker created', this.worker);

      this.worker.onmessage = (event: MessageEvent) => {
        console.debug('[semanticSearch] worker -> main', event.data);
        const { type, payload } = event.data;
        if (type === 'init_progress') {
          if (payload.status === 'progress') {
            this.initializationProgress = payload.progress;
          }
          this.progressListeners.forEach(l => l(payload));
          console.debug('[semanticSearch] init_progress', payload);
        }
        if (type === 'init_complete') {
          this.status = 'ready';
          this.initializationProgress = 100;
          this.progressListeners.forEach(l => l({ status: 'done', progress: 100 }));
          console.info('[semanticSearch] init_complete');
        }
        if (type === 'error') {
          this.status = 'error';
          this.progressListeners.forEach(l => l({ status: 'error', message: payload }));
          console.error('[semanticSearch] worker error', payload);
        }
        // Worker requests app context (RPC)
        if (type === 'request_context') {
          try {
            const { requestId, payload: req } = event.data;
            console.debug('[semanticSearch] request_context', { requestId, req });
            if (!req || !req.action) return;
            // lazy import mcpAdapter to avoid circular deps
            import('./mcpAdapter').then(mod => {
              if (req.action === 'getFriendContext') {
                const friendId = req.friendId;
                const friend = this.friends.find((f: any) => f.id === friendId);
                const friendEvents = this.events.filter((e: any) => e.friendId === friendId);
                const friendMemories = this.memories.filter((m: any) => m.friendId === friendId);
                const context = mod.buildFriendContext(friend, friendEvents, friendMemories);
                this.worker?.postMessage({ type: 'request_context_response', requestId, payload: context });
                return;
              }

              if (req.action === 'listFriends') {
                const out = mod.listFriends(this.friends);
                this.worker?.postMessage({ type: 'request_context_response', requestId, payload: out });
                return;
              }

              if (req.action === 'getFriendById') {
                const friend = mod.getFriendById(this.friends, req.friendId);
                this.worker?.postMessage({ type: 'request_context_response', requestId, payload: friend });
                return;
              }

              if (req.action === 'queryEvents') {
                const out = mod.queryEvents(this.events, req.opts || {});
                this.worker?.postMessage({ type: 'request_context_response', requestId, payload: out });
                return;
              }

              if (req.action === 'queryMemories') {
                const out = mod.queryMemories(this.memories, req.opts || {});
                this.worker?.postMessage({ type: 'request_context_response', requestId, payload: out });
                return;
              }
            }).catch(err => {
              this.worker?.postMessage({ type: 'error', payload: String(err), requestId });
            });
          } catch (err) {
            console.error('[semanticSearch] Failed to handle request_context from worker', err);
          }
        }
      };
    }
  }

  // Optional: set a local model path (folder or model id). When set, `initialize()` will send it to the worker.
  private modelPath: string | null = null;
  public setLocalModelPath(path: string) {
    this.modelPath = path;
    console.info('[semanticSearch] local model path set', path);
  }

  public updateData(data: { friends?: any[]; events?: any[]; memories?: any[] }) {
    if (data.friends) this.friends = data.friends;
    if (data.events) this.events = data.events;
    if (data.memories) this.memories = data.memories;
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
    if (getGroqApiKey() || !this.worker) return;

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

      console.debug('[semanticSearch] main -> worker', { type: 'index', requestId: id, documentsCount: documents.length });
      this.worker?.postMessage({ type: 'index', payload: { documents }, requestId: id });
    });
  }

  public async search(query: string, topK = 5): Promise<any[]> {
    if (getGroqApiKey() || !this.worker) return [];

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

      console.debug('[semanticSearch] main -> worker', { type: 'search', requestId: id, query, topK });
      // Remove 'documents' from payload, assuming pre-indexed
      this.worker?.postMessage({ type: 'search', payload: { query, topK }, requestId: id });
    });
  }

  public initialize() {
    if (this.status === 'ready') {
      console.debug('[semanticSearch] initialize skipped — already ready');
      return;
    }
    if (this.status === 'loading') {
      console.debug('[semanticSearch] initialize skipped — already loading');
      return;
    }
    this.status = 'loading';

    // Bypass local model loading entirely if Groq cloud AI is configured
    if (getGroqApiKey()) {
      console.info('[semanticSearch] Groq API enabled, bypassing local MiniLM models.');
      this.status = 'ready';
      this.initializationProgress = 100;
      this.progressListeners.forEach(l => l({ status: 'done', progress: 100 }));
      return;
    }

    console.debug('[semanticSearch] main -> worker', { type: 'init', modelPath: this.modelPath });
    this.worker?.postMessage({ type: 'init', payload: { modelPath: this.modelPath } });
  }

  public enableLogging() {
    console.info('[semanticSearch] logging enabled');
  }

  public disableLogging() {
    console.info('[semanticSearch] logging disabled');
  }
}

export const semanticSearch = SemanticSearchService.getInstance();
