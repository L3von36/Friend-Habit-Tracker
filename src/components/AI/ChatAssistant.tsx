import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, User, Bot, Sparkles, History, Search, Mic, MicOff } from 'lucide-react';
import type { Friend, Event, Memory } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { semanticSearch } from '@/lib/semanticSearch';
import { toast } from 'sonner';

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
  const [isListening, setIsListening] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(semanticSearch.status);
  const [aiProgress, setAiProgress] = useState(semanticSearch.initializationProgress);
  const [aiMessage, setAiMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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

  // Handle Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          toast.error(`Voice error: ${event.error}`);
        }
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        toast.error("Speech recognition is not supported in this browser.");
        return;
      }
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition', e);
      }
    }
  }, [isListening]);

  const processQuery = (query: string) => {
    const q = query.toLowerCase().trim();

    // --- 0. Intent Detection: Conversational inputs ---
    const greetings = ['hi', 'hello', 'hey', 'sup', 'hiya', 'howdy', 'yo', 'good morning', 'good evening', 'good afternoon'];
    if (greetings.some(g => q === g || q.startsWith(g + ' ') || q.startsWith(g + '!'))) {
      const hour = new Date().getHours();
      const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      return `${timeGreeting}! 👋 I'm your Friendship AI. I know all about your ${friends.length} friend${friends.length !== 1 ? 's' : ''} and ${events.length} logged interaction${events.length !== 1 ? 's' : ''}. Try asking me:\n• "When did I last see [name]?"\n• "What memories do I have with [name]?"\n• "Who has the highest streak?"\n• "What's my most recent event?"`;
    }

    const thankYou = ['thanks', 'thank you', 'thx', 'ty', 'great', 'awesome', 'perfect', 'cool', 'nice'];
    if (thankYou.some(t => q === t || q.startsWith(t + '!'))) {
      return "Happy to help! 😊 Feel free to ask me anything else about your friends and interactions.";
    }

    const helpPatterns = ['help', 'what can you do', 'what do you know', 'commands', 'how do i', 'what should i ask'];
    if (helpPatterns.some(h => q.includes(h))) {
      return `Here's what I can help you with:\n\n🔍 **Friend Lookup** — "Tell me about [name]", "Last time I saw [name]"\n💬 **Memories** — "What memories do I have with [name]?"\n📊 **Stats** — "Who has the highest streak?", "Most recent event"\n🏆 **Insights** — "Most frequent activity?", "How many friends do I have?"`;
    }

    if (q.includes('how many friends') || q === 'friends count' || q.includes('total friends')) {
      return `You have ${friends.length} friend${friends.length !== 1 ? 's' : ''} tracked! You've logged ${events.length} total interactions and ${memories.length} memories across your social circle.`;
    }

    if (q.includes('who') && (q.includes('birthday') || q.includes('born'))) {
      const withBirthday = friends.filter(f => f.birthday);
      if (withBirthday.length > 0) {
        const upcoming = withBirthday
          .map(f => ({ f, date: new Date(f.birthday!) }))
          .sort((a, b) => a.date.getMonth() - b.date.getMonth() || a.date.getDate() - b.date.getDate());
        return `${upcoming.length} friend${upcoming.length !== 1 ? 's have' : ' has'} birthdays saved. Next up: ${upcoming[0].f.name} 🎂`;
      }
      return "No birthdays have been saved yet. You can add them in the friend detail view!";
    }

    // 1. Find the mentioned friend
    const mentionedFriend = friends.find(f => q.includes(f.name.toLowerCase()));
    
    if (mentionedFriend) {
      const friendEvents = events
        .filter(e => e.friendId === mentionedFriend.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const friendMemories = memories.filter(m => m.friendId === mentionedFriend.id);

      if (q.includes('last seen') || q.includes('last saw') || q.includes('recent') || q.includes('last contact')) {
        const lastEvent = friendEvents[0];
        if (lastEvent) {
          return `You last saw ${mentionedFriend.name} on ${new Date(lastEvent.date).toLocaleDateString()} (${formatDistanceToNow(new Date(lastEvent.date))} ago). It was a ${lastEvent.category} event: "${lastEvent.title}".`;
        }
        return `I couldn't find any recorded interactions with ${mentionedFriend.name} yet.`;
      }

      if (q.includes('memory') || q.includes('memories') || q.includes('remember')) {
        if (friendMemories.length > 0) {
          const m = friendMemories[0];
          return `You have ${friendMemories.length} memories with ${mentionedFriend.name}. One highlight is: "${m.description}" from ${new Date(m.date).toLocaleDateString()}.`;
        }
        return `You haven't added any specific memories with ${mentionedFriend.name} yet. Would you like to add one?`;
      }

      if (q.includes('how are we') || q.includes('status') || q.includes('level')) {
        return `Your friendship with ${mentionedFriend.name} is at Level ${mentionedFriend.level || 1}. You've logged ${friendEvents.length} events together total.`;
      }

      return `I found ${mentionedFriend.name} in your list! You've had ${friendEvents.length} interactions and ${friendMemories.length} shared memories. What specific details are you looking for?`;
    }

    // 2. General queries
    if (q.includes('most recent') || q.includes('last event')) {
      const lastEvent = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (lastEvent) {
        const f = friends.find(friend => friend.id === lastEvent.friendId);
        return `Your most recent event was with ${f?.name || 'someone'} on ${new Date(lastEvent.date).toLocaleDateString()}: "${lastEvent.title}".`;
      }
    }

    if (q.includes('streak')) {
      const highestStreak = [...friends].sort((a, b) => (b.streak || 0) - (a.streak || 0))[0];
      if (highestStreak && (highestStreak.streak || 0) > 0) {
        return `Your longest current streak is with ${highestStreak.name} at ${highestStreak.streak} weeks! 🔥`;
      }
      return "You don't have any active streaks yet. Log weekly interactions to start one!";
    }

    if (q.includes('popular') || q.includes('frequent')) {
      const counts: Record<string, number> = {};
      events.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
      const topCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (topCategory) {
        return `Your most frequent interaction category is "${topCategory[0]}" with ${topCategory[1]} logs.`;
      }
    }

    return `I'm not sure I understood that. 🤔 Try mentioning a friend's name, or ask things like:\n• "Last time I saw [friend name]"\n• "Who has the longest streak?"\n• "How many friends do I have?"\n• Type "help" to see everything I can do!`;
  };


  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = processQuery(userMessage.content);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800);
  };

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

      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {m.role === 'user' ? <User className="w-3.5 h-3.5 text-violet-600" /> : <Bot className="w-3.5 h-3.5 text-slate-600" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs sm:text-sm lg:text-base leading-relaxed ${
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
                className="flex items-center gap-1.5 whitespace-nowrap text-[10px] sm:text-xs font-medium text-slate-500 hover:text-violet-600 transition-colors bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700"
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
