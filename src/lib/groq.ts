
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
    title: string;
    summary: string;
    suggestions: string[];
}

const APPWRITE_PROXY_URL = "https://699e12e5000db716c63a.fra.appwrite.run/";

async function callGroq(
  messages: GroqMessage[],
  _options: GroqOptions = {}
): Promise<string | null> {
  try {
    const response = await fetch(APPWRITE_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // The Appwrite function expects the raw payload, not a named JSON key.
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Groq proxy error:", response.status, text);
      return null;
    }

    const result = await response.json();
    
    const content = result?.choices?.[0]?.message?.content;
    
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
        The JSON object must have the following structure: { "title": "Insight Title", "summary": "A 2-3 sentence summary.", "suggestions": ["suggestion 1", "suggestion 2"] }.
        
        DATA:
        - Friends: ${JSON.stringify(friends)}
        - Events: ${JSON.stringify(events)}
    `;

    const messages: GroqMessage[] = [{ role: 'system', content: prompt }];
    
    const insightJsonString = await callGroq(messages, { temperature: 0.2 });

    if (typeof insightJsonString === 'string' && insightJsonString.trim().startsWith('{')) {
        try {
            const insight = JSON.parse(insightJsonString);
            return insight as DeepInsight;
        } catch (error) {
            console.error("Failed to parse Groq deep insight JSON:", error, "\nReceived string:", insightJsonString);
            return null;
        }
    }
    
    console.warn("[groq] Did not receive a valid JSON string for deep insight. Received:", insightJsonString);
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
