import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pipeline, env } from '@xenova/transformers';

dotenv.config();

// Use browser cache dir for model caching
env.allowLocalModels = false;
env.useBrowserCache = false;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- MiniLM Model Singleton ---
let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    console.log('Loading MiniLM-L6-v2 model (first run only)...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('MiniLM model ready.');
  }
  return embedder;
}

// --- Embedding Helpers ---
async function embed(text) {
  const model = await getEmbedder();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- Real AI Analysis using MiniLM ---
async function generateDeepInsight(data) {
  const { friends, events } = data;

  if (!friends || friends.length === 0) {
    return {
      focus: 'Add Your First Friend',
      insight: 'Start building your relationship graph by adding your first friend and logging an interaction.',
      tags: ['onboarding'],
      category: 'neutral'
    };
  }

  // Build a text summary for each friend based on their events
  const friendSummaries = friends.map(friend => {
    const friendEvents = events.filter(e => e.friendId === friend.id);
    const eventTexts = friendEvents.map(e => `${e.type || ''} ${e.description || ''} ${e.notes || ''}`).join('. ');
    const summary = `Friend: ${friend.name}. Category: ${friend.category || 'general'}. Recent interactions: ${eventTexts || 'none'}. Close friend: ${friend.closeFriend ? 'yes' : 'no'}.`;
    return { friend, summary, eventCount: friendEvents.length };
  });

  // Embed the "ideal active friendship" concept and all friend summaries
  const idealText = 'frequent meaningful interactions, regular meetups, shared experiences, consistent communication, strong emotional bond';
  const idealEmbedding = await embed(idealText);

  const scoredFriends = await Promise.all(
    friendSummaries.map(async ({ friend, summary, eventCount }) => {
      const embedding = await embed(summary);
      const similarity = cosineSimilarity(idealEmbedding, embedding);
      return { friend, similarity, eventCount };
    })
  );

  // Sort: lowest similarity = needs most attention
  scoredFriends.sort((a, b) => a.similarity - b.similarity);

  const needsAttention = scoredFriends[0];
  const mostActive = scoredFriends[scoredFriends.length - 1];

  // Generate insight based on who needs the most reconnection
  if (needsAttention.similarity < 0.4 || needsAttention.eventCount < 2) {
    return {
      focus: `Reconnect with ${needsAttention.friend.name}`,
      insight: `Your semantic analysis shows ${needsAttention.friend.name} has the lowest recent engagement score (${(needsAttention.similarity * 100).toFixed(0)}%). A quick check-in message could go a long way in maintaining this connection.`,
      tags: ['outreach', 'consistency'],
      category: 'actionable',
      meta: {
        engagementScore: needsAttention.similarity,
        topFriend: mostActive.friend.name,
        analysedFriends: friends.length
      }
    };
  }

  return {
    focus: `Keep it up with ${mostActive.friend.name}`,
    insight: `Your entire social circle is engaged! ${mostActive.friend.name} has your highest interaction score (${(mostActive.similarity * 100).toFixed(0)}%). Keep maintaining momentum across all your connections.`,
    tags: ['momentum', 'consistency'],
    category: 'positive',
    meta: {
      engagementScore: mostActive.similarity,
      analysedFriends: friends.length
    }
  };
}

// --- Routes ---
app.post('/api/analyze', async (req, res) => {
  const { payload } = req.body;

  if (!payload || !payload.friends) {
    return res.status(400).json({ success: false, error: 'Invalid payload' });
  }

  console.log('Running MiniLM analysis for', payload.friends.length, 'friends...');

  try {
    const insight = await generateDeepInsight(payload);
    res.json({
      success: true,
      insight,
      timestamp: new Date().toISOString(),
      model: 'Xenova/all-MiniLM-L6-v2'
    });
  } catch (error) {
    console.error('Analysis failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    model: 'Xenova/all-MiniLM-L6-v2 (real)',
    embedderReady: embedder !== null
  });
});

// Pre-warm the model on server start
app.listen(PORT, async () => {
  console.log(`Intelligence Server running on http://localhost:${PORT}`);
  console.log('Pre-warming MiniLM model...');
  try {
    await getEmbedder();
    console.log('Server ready with real MiniLM embeddings!');
  } catch (e) {
    console.error('Model pre-warm failed:', e.message);
  }
});
