import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, User, Bot, Sparkles, History, Search, Mic, MicOff } from 'lucide-react';
import type { Friend, Event, Memory } from '@/types';
import { semanticSearch } from '@/lib/semanticSearch';
import { callGroq, getGroqApiKey } from '@/lib/groq';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatAssistantProps {
  friends: Friend[];
  events: Event[];
  memories: Memory[];
}

export function ChatAssistant({ friends, events, memories }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your Friendship AI. Ask me anything about your history, like 'When did I last see Mark?' or 'What memories do I have with Sarah?'",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(semanticSearch.status);
  const [aiProgress, setAiProgress] = useState(semanticSearch.initializationProgress);
  const [aiMessage, setAiMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const handleSendRef = useRef<() => void>(() => {});

  const { isListening, toggleListening } = useSpeechRecognition({
    onResult: (transcript) => setInput(prev => (prev ? `${prev} ${transcript}` : transcript))
  });

  useEffect(() => {
    const unsubscribe = semanticSearch.addProgressListener((payload: any) => {
      if (payload.status === 'init' || payload.status === 'loading') {
        setAiStatus('loading');
        setAiMessage(`Loading AI model (${payload.file})...`);
      } else if (payload.status === 'progress') {
        setAiStatus('loading');
        setAiProgress(payload.progress);
        setAiMessage(`Downloading: ${payload.progress.toFixed(1)}%`);
      } else if (payload.status === 'done' || payload.status === 'ready') {
        setAiStatus('ready');
        setAiProgress(100);
        setAiMessage('AI is ready');
      } else if (payload.status === 'error') {
        setAiStatus('error');
        setAiMessage('Failed to load AI model');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const processQuery = useCallback(async (query: string) => {
    const q = query.trim();
    const apiKey = getGroqApiKey();

    if (apiKey) {
      try {
        const systemPrompt = `You are a helpful, empathetic "Friendship AI" assistant for a personal relationship tracker app.
You have access to the user's logged friends, events (interactions), and memories.
Answer the user's questions about their social life concisely, warmly, and accurately using ONLY the provided data.
If they ask a general question, be helpful. If you don't know the answer based on the data, say so.`;

        // Minify data to fit context and remove overly verbose/unnecessary fields if any, though Llama 3 handles 8k fine
        const contextData = {
          friends: friends.map(f => ({ id: f.id, name: f.name, level: f.level, streak: f.streak, relationship: f.relationship, birthday: f.birthday })),
          events: events.map(e => ({ friendId: e.friendId, title: e.title, date: e.date, category: e.category, sentiment: e.sentiment })),
          memories: memories.map(m => ({ friendId: m.friendId, description: m.description, date: m.date }))
        };

        const userPrompt = `System Data Context:
${JSON.stringify(contextData, null, 2)}

User Question: ${q}`;

        const response = await callGroq([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ], {
           model: 'llama-3.1-8b-instant',
           temperature: 0.7
        });
        
        if (response) return response;
      } catch (error: any) {
         console.error('Groq Chat Assistant failed', error);
         return "I'm sorry, I'm having trouble connecting to the cloud intelligence right now.";
      }
    }

    return "Please configure your Groq API key in the Security Settings to use the enhanced AI chat assistant.";
  }, [friends, events, memories]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(async () => {
      const response = await processQuery(userMessage.content);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 100);
  }, [input, processQuery]);

  // expose handleSend to event listener via ref
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  // Listen for external requests to start a relationship session
  useEffect(() => {
    const handler = (event: CustomEvent<any>) => {
      try {
        const prompt = event?.detail?.prompt || '';
        if (!prompt) return;
        setInput(prompt);
        // small delay to allow input to update before sending
        setTimeout(() => {
          handleSendRef.current && handleSendRef.current();
          try { inputRef.current?.focus(); } catch { /* ignored */ }
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 200);
      } catch (error: any) {
        console.error('Error handling start-relationship-session event', error);
      }
    };

    window.addEventListener('start-relationship-session', handler as EventListener);
    return () => window.removeEventListener('start-relationship-session', handler as EventListener);
  }, []);

  return (
    <Card className="flex flex-col h-[500px] border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Friendship Assistant</CardTitle>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${aiStatus === 'ready' ? 'bg-emerald-500' : aiStatus === 'error' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  {aiStatus === 'ready' ? 'AI Active' : aiStatus === 'loading' ? 'Initializing...' : aiStatus === 'error' ? 'AI Error' : 'AI Offline'}
                </span>
              </div>
            </div>
          </div>
          <Sparkles className={`w-4 h-4 text-violet-500 ${aiStatus === 'loading' ? 'animate-spin' : 'animate-pulse'}`} />
        </div>
        
        {aiStatus === 'loading' && (
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span className="truncate max-w-[180px]">{aiMessage}</span>
              <span>{aiProgress.toFixed(0)}%</span>
            </div>
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-500 transition-all duration-300 ease-out"
                style={{ width: `${aiProgress}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col min-h-0">
        <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {m.role === 'user' ? <User className="w-3.5 h-3.5 text-violet-600" /> : <Bot className="w-3.5 h-3.5 text-slate-600" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-violet-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none'
                  }`}>
                    {m.content}
                    <div className={`text-[9px] mt-1 opacity-50 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Input 
                placeholder="Ask about Sarah, streaks, recent events..."
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus-visible:ring-violet-500 h-10 text-sm pr-10"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'text-slate-400 hover:text-violet-500'
                }`}
                title={isListening ? 'Stop listening' : 'Voice Search'}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>
            <Button 
              type="submit"
              size="icon"
              className="bg-violet-600 hover:bg-violet-700 text-white shrink-0 h-10 w-10"
              disabled={!input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="flex items-center gap-4 mt-3 overflow-x-auto pb-1 no-scrollbar">
            {[
              { icon: <History className="w-3 h-3" />, text: "Last seen Mark?" },
              { icon: <Sparkles className="w-3 h-3" />, text: "Any Sarah memories?" },
              { icon: <Search className="w-3 h-3" />, text: "Check streaks" }
            ].map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s.text)}
                className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-slate-500 hover:text-violet-600 transition-colors bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700"
              >
                {s.icon}
                {s.text}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
