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

// Using the official Appwrite API endpoint which is verified to support CORS correctly
const APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1/functions/699e12e4001d8b2c0ac6/executions";
const APPWRITE_PROJECT_ID = "699e11a60026f012f35b";

async function callGroq(
  messages: GroqMessage[],
  options: GroqOptions = {}
): Promise<string | null> {
  try {
    const response = await fetch(APPWRITE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": APPWRITE_PROJECT_ID,
      },
      body: JSON.stringify({
        async: false, // Execute synchronously to get the response immediately
        body: JSON.stringify({
          messages,
          ...options
        })
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Appwrite Function error:", response.status, text);
      return null;
    }

    const execution = await response.json();
    
    // Appwrite returns the function's output in the responseBody field
    if (execution.status === 'failed') {
        console.error("Function execution failed:", execution.errors);
        return null;
    }

    const result = JSON.parse(execution.responseBody || '{}');
    const content = result.message || result?.choices?.[0]?.message?.content;
    
    if (typeof content === 'string') {
        return content;
    }
    
    console.warn("Could not find content in Groq response. Full result:", result);
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
            const cleanedJson = insightJsonString.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
            if (!cleanedJson.startsWith('{')) {
                console.warn("[groq] Received non-JSON response for deep insight. Response:", cleanedJson);
                return null;
            }
            return JSON.parse(cleanedJson);
        } catch (error) {
            console.error("Failed to parse Groq deep insight JSON:", error, "\nReceived string:", insightJsonString);
            return null;
        }
    }
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
    
    return await callGroq(messages);
}

export { callGroq };
