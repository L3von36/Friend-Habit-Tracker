export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Retrieves the Groq API Key.
 * Checks localStorage first (user-provided), then falls back to the environment variable.
 */
export function getGroqApiKey(): string | null {
    if (typeof window !== 'undefined') {
        const localKey = localStorage.getItem('groq-api-key');
        if (localKey && localKey.trim() !== '') {
            return localKey.trim();
        }
    }
    const envKey = import.meta.env.VITE_GROQ_API_KEY;
    if (envKey && envKey.trim() !== '') {
        return envKey.trim();
    }
    return null;
}

export interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface GroqOptions {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: 'json_object' | 'text' };
}

/**
 * Calls the Groq Chat Completions API.
 * 
 * @param messages Array of messages (system instruction, user prompt, etc.)
 * @param options Configuration for the model (defaults to llama-3.1-8b-instant)
 * @returns The response text or JSON string from the AI, or null if it fails.
 */
export async function callGroq(
    messages: GroqMessage[],
    options: GroqOptions = {}
): Promise<string | null> {
    const apiKey = getGroqApiKey();
    if (!apiKey) {
        console.warn('Groq API Key not found. Please add it to your settings or .env file.');
        return null;
    }

    const {
        model = 'llama-3.1-8b-instant',
        temperature = 0.5,
        max_tokens = 1024,
        response_format
    } = options;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens,
                response_format,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API Error:', response.status, errorText);
            throw new Error(`Groq API returned status ${response.status}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        }

        return null;
    } catch (error) {
        console.error('Failed to call Groq API:', error);
        return null;
    }
}
