import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, CheckCircle2, RotateCw } from 'lucide-react';
import { audioService } from '@/lib/audio';
import type { Quest } from '@/types';

interface QuestBoardProps {
  quests: Quest[];
  onClaim: (questId: string) => void;
  onRefresh: () => void;
}

export function QuestBoard({ quests, onClaim, onRefresh }: QuestBoardProps) {
  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
            <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardTitle className="text-lg">Weekly Quests</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onRefresh} className="h-8 w-8">
           <RotateCw className="w-4 h-4 text-slate-400" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {quests.map(quest => (
          <div 
            key={quest.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
              quest.completed 
                ? 'bg-green-50/50 border-green-200 opacity-75' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
            }`}
          >
            <div className="flex-1">
               <div className="flex items-center gap-2 mb-1">
                 <h4 className={`text-sm font-medium ${quest.completed ? 'text-green-800 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                   {quest.title}
                 </h4>
                 <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-indigo-100 text-indigo-600">
                   +{quest.rewardXP} XP
                 </Badge>
               </div>
               <p className="text-xs text-slate-500">{quest.description}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">
                {quest.currentCount}/{quest.targetCount}
              </span>
              <Button
                size="sm"
                variant={quest.completed ? "ghost" : "outline"}
                className={quest.completed ? "text-green-600 hover:text-green-700" : ""}
                onClick={() => {
                  if (!quest.completed) {
                    audioService.playSuccess();
                    onClaim(quest.id);
                  }
                }}
                disabled={quest.completed || quest.currentCount < quest.targetCount}
              >
                {quest.completed ? <CheckCircle2 className="w-4 h-4" /> : 'Claim'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
