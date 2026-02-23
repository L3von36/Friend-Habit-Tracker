import { pipeline, env } from '@xenova/transformers';

// Allow loading models from local paths when provided
env.allowLocalModels = true;
env.useBrowserCache = true;

let embedder: any = null;
let documentEmbeddings: { doc: any, embedding: number[] }[] = [];
let pendingRequests: Record<string, (payload: any) => void> = {};
let requestCounter = 0;

function generateRequestId() {
    requestCounter += 1;
    return `${Date.now()}-${requestCounter}`;
}

// --- Cosine Similarity ---
const cosineSimilarity = (a: number[], b: number[]) => {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// --- Get/init embedder ---
async function getEmbedder(): Promise<any> {
    if (!embedder) {
        const modelIdOrPath = (self as any).__LOCAL_MODEL_PATH || 'Xenova/all-MiniLM-L6-v2';

        // Instrument fetch to log model file requests (helps debug JSON/HTML responses)
        try {
            const originalFetch = (self as any).fetch.bind(self);
            (self as any).fetch = async (input: RequestInfo, init?: RequestInit) => {
                try {
                    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
                    console.info('[semanticWorker] fetch ->', url);
                    const res = await originalFetch(input, init);
                    const ct = res.headers ? res.headers.get('content-type') : '';

                    // Clone and inspect body safely to detect malformed JSON or HTML served as JSON.
                    try {
                        const cloned = res.clone();
                        const text = await cloned.text();
                        const head = text.trim().slice(0, 1000).replace(/\s+/g, ' ');

                        // If content-type suggests JSON or the body looks like HTML, attempt a JSON parse to detect errors
                        if ((ct && ct.includes('application/json')) || head.startsWith('<') || head.toLowerCase().includes('<!doctype')) {
                            try {
                                JSON.parse(text);
                            } catch (jsonErr) {
                                console.error('[semanticWorker] JSON.parse failed for', url, 'status', res.status, 'content-type', ct, 'bodyPreview:', head.slice(0, 1000));
                            }
                        }
                    } catch (e) {
                        // If clone/text fails, just log and continue
                        console.warn('[semanticWorker] failed to inspect response body for', url, String(e));
                    }

                    console.info('[semanticWorker] fetch status', res.status, 'content-type:', ct, '->', url);
                    return res;
                } catch (err) {
                    console.error('[semanticWorker] fetch error', err, input);
                    throw err;
                }
            };
        } catch (e) {
            // ignore if we cannot wrap fetch
        }

        // If the model path looks like a local URL (starts with '/'), perform preflight checks
        if (String(modelIdOrPath).startsWith('/')) {
            // Broaden the set of candidate files that tokenizers or the loader might request.
            const candidateFiles = [
                'config.json',
                'tokenizer.json',
                'tokenizer_config.json',
                'special_tokens_map.json',
                'vocab.txt',
                'merges.txt',
                'model.safetensors',
                'modules.json',
                'generation_config.json',
                'sentencepiece.bpe.model'
            ];

            for (const f of candidateFiles) {
                const url = `${modelIdOrPath.replace(/\/+$/, '')}/${f}`;
                try {
                    const res = await (self as any).fetch(url, { method: 'GET' });
                    const ct = res.headers ? res.headers.get('content-type') : '';
                    let bodyPreview = '';
                    try {
                        const cloned = res.clone();
                        const text = await cloned.text();
                        bodyPreview = text.trim().slice(0, 1200).replace(/\s+/g, ' ');
                    } catch (e) {
                        bodyPreview = `<unable to read body: ${String(e)}>`;
                    }

                    console.info('[semanticWorker] preflight', { url, status: res.status, contentType: ct, bodyPreview: bodyPreview.slice(0, 300) });

                    // If the response is HTML it's likely the dev server returned index.html
                    if (res.status === 200 && (ct && ct.includes('text/html') || bodyPreview.startsWith('<') || bodyPreview.toLowerCase().includes('<!doctype'))) {
                        console.error('[semanticWorker] preflight failure: expected model file but got HTML or HTML-like content', { url, status: res.status, contentType: ct, bodyPreview: bodyPreview.slice(0, 300) });
                        throw new Error(`Preflight failed for ${url}: returned HTML-like content`);
                    }
                    if (!res.ok) {
                        console.warn('[semanticWorker] preflight warning: non-OK response', { url, status: res.status, contentType: ct });
                    }
                } catch (err) {
                    console.error('[semanticWorker] preflight fetch error', { url, err: String(err) });
                    throw err;
                }
            }
        }

        embedder = await pipeline('feature-extraction', modelIdOrPath, {
            progress_callback: (progress: any) => {
                self.postMessage({ type: 'init_progress', payload: progress });
            }
        });
    }
    return embedder;
}

async function embed(text: string): Promise<number[]> {
    const model = await getEmbedder();
    const output = await model(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data) as number[];
}

self.onmessage = async (event: MessageEvent) => {
    const { type, payload, requestId } = event.data;

    // --- Init ---
    if (type === 'init') {
        try {
            // If main thread passed a modelPath, expose it to worker global and prefer it
            try {
                if (payload && payload.modelPath) {
                    (self as any).__LOCAL_MODEL_PATH = payload.modelPath;
                    console.info('[semanticWorker] using local model path', payload.modelPath);
                }
            } catch (e) { }
            await getEmbedder();
            self.postMessage({ type: 'init_complete' });
        } catch (error) {
            console.error('Model initialization failed:', error);
            self.postMessage({ type: 'error', payload: 'Model initialization failed' });
        }
    }

    // --- Index documents (for chat search) ---
    if (type === 'index') {
        const { documents } = payload;
        await getEmbedder();
        try {
            documentEmbeddings = [];
            for (const doc of documents) {
                const textToEmbed = `${doc.title || ''} ${doc.description || ''} ${doc.tags?.join(' ') || ''} ${doc.content || ''}`;
                if (!textToEmbed.trim()) continue;
                const embedding = await embed(textToEmbed);
                documentEmbeddings.push({ doc, embedding });
            }
            self.postMessage({ type: 'index_complete', requestId });
        } catch (error) {
            self.postMessage({ type: 'error', payload: error, requestId });
        }
    }

    // --- Semantic search (for chat) ---
    if (type === 'search') {
        const { query, topK } = payload;
        await getEmbedder();
        try {
            const queryEmbedding = await embed(query);
            const results = documentEmbeddings
                .map(({ doc, embedding }) => ({ doc, score: cosineSimilarity(queryEmbedding, embedding) }))
                .sort((a, b) => b.score - a.score)
                .slice(0, topK)
                .map(r => r.doc);
            self.postMessage({ type: 'search_results', payload: results, requestId });
        } catch (error) {
            self.postMessage({ type: 'error', payload: error, requestId });
        }
    }

    // --- Deep Insights Analysis (replaces server) ---
    if (type === 'analyze') {
        const { friends } = payload;
        try {
            await getEmbedder();

            if (!friends || friends.length === 0) {
                self.postMessage({
                    type: 'analyze_complete',
                    requestId,
                    payload: {
                        focus: 'Add Your First Friend',
                        insight: 'Start building your relationship graph by adding friends and logging interactions.',
                        tags: ['onboarding'],
                        category: 'actionable'
                    }
                });
                return;
            }

            // Embed an "ideal active friendship" concept vector
            const idealEmbedding = await embed(
                'frequent meaningful interactions regular meetups shared experiences consistent communication strong emotional bond'
            );

            // Build text summary for each friend based on MCP-provided context
            const scoredFriends = await Promise.all(
                friends.map(async (friend: any) => {
                    // Request friend context from main thread (MCP)
                    const reqId = generateRequestId();
                    const contextPromise = new Promise<any>((resolve) => {
                        pendingRequests[reqId] = resolve;
                    });
                    self.postMessage({ type: 'request_context', requestId: reqId, payload: { action: 'getFriendContext', friendId: friend.id } });
                    const context = await contextPromise;

                    const summary = context?.summary || `category ${friend.category || 'general'} streak ${friend.streak || 0} level ${friend.level || 1}`;
                    const embedding = await embed(summary);
                    const similarity = cosineSimilarity(idealEmbedding, embedding);
                    return { friend, similarity, eventCount: context?.eventsCount || 0 };
                })
            );

            scoredFriends.sort((a, b) => a.similarity - b.similarity);
            const needsAttention = scoredFriends[0];
            const mostActive = scoredFriends[scoredFriends.length - 1];

            let result;
            if (needsAttention.similarity < 0.45 || needsAttention.eventCount < 2) {
                result = {
                    focus: `Reconnect with Friend #${needsAttention.friend.id.slice(-4)}`,
                    insight: `Semantic analysis shows this friend has your lowest engagement score (${(needsAttention.similarity * 100).toFixed(0)}% match with an active friendship pattern). They haven't appeared in recent interactions — a small gesture could go a long way.`,
                    tags: ['outreach', 'consistency'],
                    category: 'actionable' as const
                };
            } else {
                result = {
                    focus: 'Maintain Momentum',
                    insight: `Your entire social circle is engaged! Your most active connection scores ${(mostActive.similarity * 100).toFixed(0)}% alignment with healthy friendship patterns. Keep up the consistent interactions across all ${friends.length} connections.`,
                    tags: ['momentum', 'stability'],
                    category: 'positive' as const
                };
            }

            self.postMessage({ type: 'analyze_complete', requestId, payload: result });
        } catch (error) {
            self.postMessage({ type: 'error', payload: String(error), requestId });
        }
    }
    // Handle responses from main thread for pending requests
    if (type === 'request_context_response') {
        const handler = pendingRequests[requestId];
        if (handler) {
            handler(payload);
            delete pendingRequests[requestId];
        }
    }
};
