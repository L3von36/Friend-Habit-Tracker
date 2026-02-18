import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Friend, Event } from '@/types';
import { generateConversationStarters } from '@/lib/aiHelpers';
import { RefreshCw, Copy, Check, Sparkles, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface ConversationStartersProps {
  friend: Friend;
  events: Event[];
}

export function ConversationStarters({ friend, events }: ConversationStartersProps) {
  const [starters, setStarters] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generatedStarters = useMemo(() => {
    return generateConversationStarters(friend, events);
  }, [friend, events]);

  const allStarters = starters.length > 0 ? starters : generatedStarters;

  const handleRegenerate = () => {
    const newStarters = generateConversationStarters(friend, events);
    setStarters(newStarters);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getStarterIcon = (starter: string) => {
    if (starter.includes('birthday')) return '🎂';
    if (starter.includes('work') || starter.includes('job')) return '💼';
    if (starter.includes('family')) return '👨‍👩‍👧‍👦';
    if (starter.includes('feel') || starter.includes('mood')) return '💭';
    if (starter.includes('plan') || starter.includes('travel')) return '✈️';
    if (starter.includes('movie') || starter.includes('show')) return '🎬';
    if (starter.includes('book') || starter.includes('read')) return '📚';
    if (starter.includes('food') || starter.includes('restaurant')) return '🍽️';
    return '💬';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">AI Conversation Starters</h3>
        </div>
        <Button variant="outline" size="sm" onClick={handleRegenerate}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate
        </Button>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Personalized suggestions based on {friend.name}'s interests and recent events
      </p>

      <div className="space-y-3">
        {allStarters.map((starter, index) => (
          <Card 
            key={index} 
            className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getStarterIcon(starter)}</span>
              <div className="flex-1">
                <p className="text-slate-700 dark:text-slate-300">{starter}</p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 text-xs"
                    onClick={() => handleCopy(starter, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3 h-3 mr-1" />
                    ) : (
                      <Copy className="w-3 h-3 mr-1" />
                    )}
                    {copiedIndex === index ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tips */}
      <Card className="p-4 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-violet-500 mt-0.5" />
          <div>
            <p className="font-medium text-violet-700 dark:text-violet-300">Conversation Tips</p>
            <ul className="text-sm text-violet-600 dark:text-violet-400 mt-2 space-y-1">
              <li>• Ask open-ended questions</li>
              <li>• Listen more than you speak</li>
              <li>• Follow up on previous conversations</li>
              <li>• Show genuine interest in their responses</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
