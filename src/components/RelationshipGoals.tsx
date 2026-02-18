import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { RelationshipGoal, Event } from '@/types';
import { Target, Plus, Flame, Calendar, TrendingUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface RelationshipGoalsProps {
  friendId: string;
  goals: RelationshipGoal[];
  events: Event[];
  onAddGoal: (goal: Omit<RelationshipGoal, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak'>) => void;
  onDeleteGoal: (goalId: string) => void;
}

export function RelationshipGoals({ friendId, goals, events, onAddGoal, onDeleteGoal }: RelationshipGoalsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(4);
  const [newGoalPeriod, setNewGoalPeriod] = useState<RelationshipGoal['period']>('monthly');

  const friendGoals = goals.filter(g => g.friendId === friendId);

  const calculateProgress = (goal: RelationshipGoal) => {
    const now = new Date();
    const periodStart = newGoalPeriod === 'weekly'
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    const relevantEvents = events.filter(e => 
      e.friendId === friendId && 
      new Date(e.date) >= periodStart
    );

    return Math.min(goal.target, relevantEvents.length);
  };

  const handleAddGoal = () => {
    if (newGoalTitle.trim()) {
      onAddGoal({
        friendId,
        title: newGoalTitle.trim(),
        target: newGoalTarget,
        period: newGoalPeriod,
      });
      setNewGoalTitle('');
      setNewGoalTarget(4);
      setShowAddForm(false);
      toast.success('Goal created!');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Relationship Goals</h3>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Goal
        </Button>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <Card className="p-4 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
          <div className="space-y-3">
            <Input
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="e.g., Call weekly, Have deep conversations"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Target</label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Period</label>
                <select
                  value={newGoalPeriod}
                  onChange={(e) => setNewGoalPeriod(e.target.value as RelationshipGoal['period'])}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                >
                  <option value="weekly">Per Week</option>
                  <option value="monthly">Per Month</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddGoal} size="sm" className="flex-1 bg-violet-500 hover:bg-violet-600 text-white">
                Create Goal
              </Button>
              <Button onClick={() => setShowAddForm(false)} size="sm" variant="ghost">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Goals List */}
      {friendGoals.length === 0 ? (
        <Card className="p-6 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <Target className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm text-slate-500">No goals set yet</p>
          <p className="text-xs text-slate-400 mt-1">Set goals to strengthen your relationship</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {friendGoals.map((goal) => {
            const progress = calculateProgress(goal);
            const percentage = Math.round((progress / goal.target) * 100);

            return (
              <Card key={goal.id} className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{goal.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {goal.period}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Progress</span>
                        <span className="font-medium">{progress} / {goal.target}</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            percentage >= 100 ? 'bg-green-500' : 'bg-violet-500'
                          }`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        Streak: {goal.currentStreak}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        Best: {goal.longestStreak}
                      </span>
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onDeleteGoal(goal.id)}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
          <div>
            <p className="font-medium text-green-700 dark:text-green-300">Goal Setting Tips</p>
            <ul className="text-sm text-green-600 dark:text-green-400 mt-2 space-y-1">
              <li>• Start small - 1-2 meaningful interactions per week</li>
              <li>• Quality over quantity - deep conversations count more</li>
              <li>• Be consistent - regular check-ins build stronger bonds</li>
              <li>• Celebrate progress - every interaction matters!</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
