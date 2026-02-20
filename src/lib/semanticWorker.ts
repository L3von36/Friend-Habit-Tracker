import { pipeline, env } from '@xenova/transformers';

// Skip local checks
env.allowLocalModels = false;
env.useBrowserCache = true;

let embedder: any = null;
let documentEmbeddings: { doc: any, embedding: number[] }[] = [];

const cosineSimilarity = (a: number[], b: number[]) => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

self.onmessage = async (event: MessageEvent) => {
    const { type, payload, requestId } = event.data;

    if (type === 'init') {
        try {
            if (!embedder) {
                embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            }
            self.postMessage({ type: 'init_complete' });
        } catch (error) {
            console.error('Model initialization failed:', error);
        }
    }

    if (type === 'index') {
        const { documents } = payload;
        if (!embedder) {
            embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }

        try {
            documentEmbeddings = []; // Clear previous
            // Process in batches to avoid locking up too hard
            for (const doc of documents) {
                const textToEmbed = `${doc.title || ''} ${doc.description || ''} ${doc.tags?.join(' ') || ''} ${doc.content || ''}`;
                if (!textToEmbed.trim()) continue;

                const output = await embedder(textToEmbed, { pooling: 'mean', normalize: true });
                const embedding = Array.from(output.data) as number[];
                documentEmbeddings.push({ doc, embedding });
            }

            self.postMessage({ type: 'index_complete', requestId });
        } catch (error) {
            console.error('Indexing failed:', error);
            self.postMessage({ type: 'error', payload: error, requestId });
        }
    }

    if (type === 'search') {
        const { query, topK } = payload;

        if (!embedder) {
            // Auto-init if needed
            embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }

        try {
            // 1. Embed Query
            const queryEmbeddingOutput = await embedder(query, { pooling: 'mean', normalize: true });
            const queryEmbedding = Array.from(queryEmbeddingOutput.data) as number[];

            // 2. Compare against cached embeddings
            const results = documentEmbeddings.map(({ doc, embedding }) => ({
                doc,
                score: cosineSimilarity(queryEmbedding, embedding)
            }));

            // 3. Sort and Return
            const sorted = results
                .sort((a, b) => b.score - a.score)
                .slice(0, topK)
                .map(r => r.doc);

            self.postMessage({ type: 'search_results', payload: sorted, requestId });
        } catch (error) {
            console.error('Search failed:', error);
            self.postMessage({ type: 'error', payload: error, requestId });
        }
    }
};
