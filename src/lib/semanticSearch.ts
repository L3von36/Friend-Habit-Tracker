import type { Friend } from '@/types';
import { callGroq } from './groq';
import type { GroqMessage } from './groq';

class SemanticSearchService {
  constructor() {
    console.log('[semanticSearch] Service initialized (Groq mode)');
  }

  /**
   * Performs a semantic search for friends using the Groq API.
   * @param query The user's search query.
   * @param friends The list of all friends to search through.
   * @returns A promise that resolves to an array of matching Friend objects.
   */
  async search(query: string, friends: Friend[]): Promise<Friend[]> {
    if (!query.trim() || friends.length === 0) {
      return [];
    }

    const friendDataForPrompt = friends.map(f => ({
        name: f.name,
        traits: f.traits.join(', ')
    }));

    const prompt = `
      You are a smart search engine. Your task is to find the most relevant friends from a provided JSON list based on a user's search query.
      Your response MUST be a JSON array containing the exact names of the matching friends, ordered by relevance.
      Do not include any commentary or introductory text. The output must be only the JSON array of names.
      Example response format: ["John Doe", "Jane Smith"]

      User Query: "${query}"
      Friends List (JSON): ${JSON.stringify(friendDataForPrompt)}
    `;

    try {
      const messages: GroqMessage[] = [{ role: 'system', content: prompt }];
      
      // We expect the Groq API to return an array of strings (friend names)
      const friendNames = await callGroq(messages, { response_format: { type: 'json_object' } });

      if (!Array.isArray(friendNames)) {
        console.warn('[semanticSearch] Groq did not return a valid array of names.', friendNames);
        return [];
      }

      // Map the returned names back to the original Friend objects
      const friendMap = new Map(friends.map(friend => [friend.name, friend]));
      const matchedFriends = (friendNames as string[])
        .map(name => friendMap.get(name))
        .filter((friend): friend is Friend => friend !== undefined);
      
      return matchedFriends;

    } catch (error) {
      console.error('[semanticSearch] An error occurred during the Groq-based search:', error);
      return [];
    }
  }
}

export const semanticSearch = new SemanticSearchService();
