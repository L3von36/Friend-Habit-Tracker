import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Sparkles, Wand2 } from 'lucide-react';
import { audioService } from '@/lib/audio';
import type { Friend, Event } from '@/types';
import { generateSmartDrafts, suggestIntent, type DraftIntent } from '@/lib/smartDrafts';
import { toast } from 'sonner';

interface SmartDraftsProps {
  friend: Friend;
  events: Event[];
}

export function SmartDrafts({ friend, events }: SmartDraftsProps) {
  const suggestedIntent = useMemo(() => suggestIntent(friend, events), [friend, events]);
  const [activeIntent, setActiveIntent] = useState<DraftIntent>(suggestedIntent);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setIsGenerating(true);
    generateSmartDrafts(friend, events, activeIntent).then(result => {
      setDrafts(result);
      setIsGenerating(false);
    });
  }, [friend, events, activeIntent]);

  const handleCopy = (text: string, index: number) => {
    audioService.playSuccess();
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Draft copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const intents: { id: DraftIntent; label: string; icon: string }[] = [
    { id: 'greeting', label: 'Say Hi', icon: '👋' },
    { id: 'check-in', label: 'Check In', icon: '🔍' },
    { id: 'plans', label: 'Make Plans', icon: '📅' },
    { id: 'gratitude', label: 'Thanks', icon: '🙏' },
    { id: 'celebrate', label: 'Celebrate', icon: '🎉' },
    { id: 'support', label: 'Support', icon: '❤️' },
    { id: 'apology', label: 'Apologize', icon: '🕊️' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Wand2 className="w-5 h-5 text-violet-500" />
           <h3 className="font-semibold text-slate-800 dark:text-slate-200">Smart Drafts</h3>
        </div>
        <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
          AI Suggested: {intents.find(i => i.id === suggestedIntent)?.label}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
            {intents.map(intent => (
                <button
                    key={intent.id}
                    onClick={() => {
                        audioService.playClick();
                        setActiveIntent(intent.id);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5
                        ${activeIntent === intent.id 
                            ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-slate-900' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                >
                    <span>{intent.icon}</span>
                    {intent.label}
                </button>
            ))}
        </div>

        <div className="grid gap-3 relative min-h-[160px]">
            {isGenerating && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] rounded-lg">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-violet-100 dark:border-violet-900/50 text-sm font-medium text-violet-600 dark:text-violet-400">
                        <Wand2 className="w-4 h-4 animate-spin text-violet-500" />
                        Generating smart drafts...
                    </div>
                </div>
            )}
            {drafts.map((draft, index) => (
                <Card 
                    key={index}
                    className="p-4 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors border-0 shadow-sm cursor-pointer group relative"
                    onClick={() => handleCopy(draft, index)}
                >
                    <p className="text-slate-700 dark:text-slate-300 pr-8 leading-relaxed">"{draft}"</p>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                         {copiedIndex === index ? (
                            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-medium">
                                <Check className="w-3 h-3" />
                                Copied
                            </div>
                         ) : (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-violet-500">
                                <Copy className="w-4 h-4" />
                            </Button>
                         )}
                    </div>
                </Card>
            ))}
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
        <Sparkles className="w-3 h-3 text-violet-400" />
        <p>Drafts are personalized based on {friend.name}'s communication style and your recent history.</p>
      </div>
    </div>
  );
}
