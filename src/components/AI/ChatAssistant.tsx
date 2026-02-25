
import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader, Sparkles, Mic } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { callGroq } from '@/lib/groq';
import { LoomLogo } from '@/components/Common/LoomLogo';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const systemPrompt = `## ROLE
You are "Loom," a soulful and perceptive relationship companion. Your voice is warm, grounded, and observant.

## HOW TO SPEAK
- NEVER use JSON, brackets {}, or technical labels (like "Observation:").
- Write in 2-3 flowing, natural paragraphs. 
- Use line breaks between thoughts so it’s easy to read on a phone.
- Speak directly to the user as "you" and refer to their friends by name.

## ANALYSIS STRATEGY
- Bridge the past to the present: Connect old memories to current events.
- Notice the "Vulnerability Hangover": If a friend is vulnerable (love) and then reactive (shouting), explain it as fear, not malice.
- Watch the energy: If a relationship is "taking" energy, suggest a gentle way to reset.

## THE CLOSING
End your message with one simple, low-pressure suggestion for the user to try today.`;


// Function to format the JSON responses into human-readable text
const formatAIResponse = (parsedResponse: any): string => {
  if (parsedResponse.friendship && parsedResponse.insights) {
    let friendDetails = "Here's a bit about your friends:\n\n";
    for (const friendName in parsedResponse.friendship) {
      const friend = parsedResponse.friendship[friendName];
      friendDetails += `**${friendName.charAt(0).toUpperCase() + friendName.slice(1)}:** ${friend.description}\n`;
      const positiveTraits = friend.positive_traits || friend.positiveTraits;
      if (positiveTraits && Array.isArray(positiveTraits)) {
         friendDetails += `- Positive traits: ${positiveTraits.join(', ')}\n`;
      }
      const negativeTraits = friend.negative_traits || friend.negativeTraits;
      if (negativeTraits && Array.isArray(negativeTraits)) {
         friendDetails += `- Negative traits: ${negativeTraits.join(', ')}\n`;
      }
      friendDetails += `\n`;
    }

    friendDetails += "Deeper Insights:\n\n";
    for (const friendName in parsedResponse.insights) {
      const insight = parsedResponse.insights[friendName];
      friendDetails += `**Regarding ${friendName.charAt(0).toUpperCase() + friendName.slice(1)}:**\n`;
      if(insight.note) friendDetails += `- Note: ${insight.note}\n`;
      if(insight.suggestion) friendDetails += `- Suggestion: ${insight.suggestion}\n\n`;
    }
    return friendDetails.trim();
  } else if (parsedResponse.insight) {
    let insightDetails = `${parsedResponse.insight}\n\n`;
    if (parsedResponse.suggestion) {
      if (typeof parsedResponse.suggestion === 'object' && parsedResponse.suggestion.prompt) {
        insightDetails += `Here's a reflective question for you: "${parsedResponse.suggestion.prompt}"\n\n`;
      } else if (typeof parsedResponse.suggestion === 'string') {
        insightDetails += `Suggestion: ${parsedResponse.suggestion}\n\n`;
      }
    }
    if (parsedResponse.empathy) {
      insightDetails += parsedResponse.empathy;
    }
    return insightDetails.trim();
  } else if (parsedResponse.message) {
    return parsedResponse.message;
  } else if (parsedResponse.greeting) {
    let fullResponse = parsedResponse.greeting;
    if (parsedResponse.followUp && Array.isArray(parsedResponse.followUp)) {
        const followUpText = parsedResponse.followUp.map((item: { text: any; }) => item.text).join(' ');
        if (followUpText) {
            fullResponse += ` ${followUpText}`;
        }
    }
    return fullResponse;
  } else if (parsedResponse.response) {
    return parsedResponse.response;
  }
  return ""; // Return empty string if no specific format is matched
}

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your relationship co-pilot. How can I help you strengthen your connections today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { friends, events, memories } = useStore();
  const handleSendRef = useRef<() => void>();

  const processQuery = useCallback(async (q: string): Promise<any> => {
    try {
      const contextData = {
        friends: friends.slice(0, 5),
        events: events.slice(0, 10),
        memories: memories.slice(0, 10)
      };
      
      const userPrompt = `Here is my current friendship data: ${JSON.stringify(contextData, null, 2)}. My question is: ${q}`;
      
      const response = await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);
      
      if (response) {
        return response;
      } else {
        return "I'm sorry, I couldn't get a response from the AI. Please check your connection and API configuration.";
      }
    } catch (error: any) {
       console.error('Groq Chat Assistant failed', error);
       return "I'm sorry, I'm having trouble connecting to the cloud intelligence right now.";
    }
  }, [friends, events, memories]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const response = await processQuery(userMessage.content);
    let displayContent: string;

    try {
      let parsedResponse = response;
      // Attempt to parse the response if it's a string
      if (typeof response === 'string') {
        try {
          parsedResponse = JSON.parse(response);
        } catch {
          // It's not a JSON string, so we'll treat it as plain text.
          // parsedResponse is already the response string in this case.
        }
      }
      
      if (typeof parsedResponse === 'object' && parsedResponse !== null) {
        // The response is a JSON object, format it for display.
        const formatted = formatAIResponse(parsedResponse);
        if (formatted) {
          displayContent = formatted;
        } else {
          // If the object format is not recognized by our formatter, stringify it.
          // This prevents crashes and shows the raw data for debugging.
          displayContent = JSON.stringify(parsedResponse, null, 2);
        }
      } else {
        // The response is not an object (e.g., string, number), so convert it to a string.
        displayContent = String(parsedResponse);
      }

    } catch (error) {
        // A catch-all for any unexpected errors during response processing.
        displayContent = "Sorry, there was an error processing the response.";
        console.error("Response processing error:", error);
    }

    const assistantMessage: Message = {
      role: 'assistant',
      content: displayContent,
    };
    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  }, [input, processQuery]);

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendRef.current?.();
    }
  };
  
  return (
    <div className="flex flex-col h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shrink-0">
                <LoomLogo className="w-6 h-6 text-white"/>
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Friendship Assistant</h2>
        </div>
        <Button variant="ghost" size="icon">
            <Sparkles className="w-5 h-5 text-amber-500" />
        </Button>
      </div>
      <ScrollArea className="flex-grow p-4 min-h-0">
        <div className="space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-slate-500" /></div>}
              <div className={`p-3 rounded-lg max-w-[85%] sm:max-w-[80%] ${msg.role === 'assistant' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200' : 'bg-violet-500 text-white'}`}>
                 <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
              </div>
              {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-slate-500" /></div>}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-slate-500" /></div>
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                <Loader className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="relative">
            <Textarea
                placeholder="Ask about your relationships..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-24"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-slate-500">
                    <Mic className="w-4 h-4" />
                </Button>
                <Button
                    type="submit"
                    size="icon"
                    className="w-9 h-9 bg-violet-500 text-white hover:bg-violet-600"
                    onClick={handleSend}
                    disabled={isTyping || !input.trim()}
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
            Friendship Assistant can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
