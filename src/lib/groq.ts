
import type { Friend, Event } from '@/types';

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
}

export interface DeepInsight {
    focus: string;
    insight: string;
    tags: string[];
}

const APPWRITE_PROXY_URL = "https://699e12e5000db716c63a.fra.appwrite.run/";

async function callGroq(
  messages: GroqMessage[],
  options: GroqOptions = {}
): Promise<string | null> {
  try {
    const response = await fetch(APPWRITE_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        ...options
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Groq proxy error:", response.status, text);
      return null;
    }

    const result = await response.json();
    
    // Support both the extracted message from proxy and the full choices array
    const content = result.message || result?.choices?.[0]?.message?.content;
    
    if (typeof content === 'string') {
        return content;
    }
    
    console.warn("Could not find content in Groq response. Full response:", result);
    return null;
    
  } catch (error: any) {
    console.error("Network or parsing error in callGroq:", error);
    return null;
  }
}

export async function generateGroqDeepInsight(
    friends: any[], 
    events: any[]
): Promise<DeepInsight | null> {
    const prompt = `
        You are a relationship assistant AI. Analyze the following data about friends and their interactions (events).
        Generate a "deep insight" about the user's social life.
        The response MUST be ONLY a valid JSON object, without any markdown formatting, comments, or other text.
        The JSON object must have the following structure: { "focus": "Relationship Focus Area", "insight": "A 2-3 sentence deep psychological insight.", "tags": ["tag1", "tag2"] }.
        
        DATA:
        - Friends: ${JSON.stringify(friends)}
        - Events: ${JSON.stringify(events)}
    `;

    const messages: GroqMessage[] = [{ role: 'system', content: prompt }];
    
    const insightJsonString = await callGroq(messages, {
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    if (typeof insightJsonString === 'string') {
        try {
            // Clean up possible markdown formatting if the model ignored instructions
            const cleanedJson = insightJsonString.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
            const insight = JSON.parse(cleanedJson);
            return insight as DeepInsight;
        } catch (error) {
            console.error("Failed to parse Groq deep insight JSON:", error, "\nReceived string:", insightJsonString);
            return null;
        }
    }
    
    console.warn("[groq] Did not receive a valid string for deep insight. Received:", insightJsonString);
    return null;
}

export async function generateGroqChatCompletion(
    friends: any[], 
    events: any[], 
    chatHistory: GroqMessage[]
): Promise<string | null> {
    const systemPrompt = `
        You are a helpful and friendly relationship assistant. 
        Your goal is to help the user understand their social life based on the data they provide.
        Use the provided friend and event data to answer the user's questions.
        Keep your answers conversational and concise.

        DATA:
        - Friends: ${JSON.stringify(friends)}
        - Events: ${JSON.stringify(events)}
    `;

    const messages: GroqMessage[] = [
        { role: 'system', content: systemPrompt },
        ...chatHistory
    ];
    
    const responseText = await callGroq(messages);
    return responseText;
}

export { callGroq };
