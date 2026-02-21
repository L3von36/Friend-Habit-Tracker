import { pipeline, env } from '@xenova/transformers';

// Skip local checks - use browser cache
env.allowLocalModels = false;
env.useBrowserCache = true;

let embedder: any = null;
let documentEmbeddings: { doc: any, embedding: number[] }[] = [];

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
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
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
        const { friends, events } = payload;
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

            // Build text summary for each friend based on their events
            const scoredFriends = await Promise.all(
                friends.map(async (friend: any) => {
                    const friendEvents = events.filter((e: any) => e.friendId === friend.id);
                    const eventText = friendEvents
                        .map((e: any) => `${e.category || ''} ${e.sentiment || ''} ${(e.tags || []).join(' ')}`)
                        .join('. ');
                    const summary = `category ${friend.category || 'general'} streak ${friend.streak || 0} level ${friend.level || 1} events: ${eventText || 'none logged'}`;
                    const embedding = await embed(summary);
                    const similarity = cosineSimilarity(idealEmbedding, embedding);
                    return { friend, similarity, eventCount: friendEvents.length };
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
};
