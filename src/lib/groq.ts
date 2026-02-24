export const GROQ_API_URL = "/api/groq"; // We'll now point to our own API route.

/**
 * We'll keep the client-side retrieval for display purposes in the UI,
 * but it will no longer be used for making API calls directly.
 */
export function getGroqApiKey(): string | null {
  if (typeof window !== "undefined") {
    const localKey = localStorage.getItem("groq-api-key");
    if (localKey && localKey.trim() !== "") {
      return localKey.trim();
    }
  }
  const envKey = import.meta.env.VITE_GROQ_API_KEY;
  if (envKey && envKey.trim() !== "") {
    return envKey.trim();
  }
  return null;
}

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

/**
 * We'll update this function to call our new server-side API route.
 * This way, the client never directly exposes the API key.
 */
export async function callGroq(messages: GroqMessage[], options: GroqOptions = {}): Promise<string | null> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // We'll send the messages and options in the body to our server.
      body: JSON.stringify({ messages, options }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Route Error:", response.status, errorText);
      throw new Error(`API route returned status ${response.status}`);
    }

    const data = await response.json();

    // We'll now expect the response to be in a "response" property.
    if (data.response) {
      return data.response;
    }

    return null;
  } catch (error) {
    console.error("Failed to call our /api/groq route:", error);
    return null;
  }
}
