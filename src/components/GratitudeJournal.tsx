import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { audioService } from '@/lib/audio';
import { Textarea } from '@/components/ui/textarea';
import type { GratitudeEntry } from '@/types';
import { Heart, Plus, Calendar, Quote, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface GratitudeJournalProps {
  friendId: string;
  entries: GratitudeEntry[];
  friendName: string;
  onAddEntry: (entry: Omit<GratitudeEntry, 'id'>) => void;
  onDeleteEntry: (entryId: string) => void;
}

const GRATITUDE_PROMPTS = [
  "What do you appreciate most about this person?",
  "What's a kind thing they did recently?",
  "What makes them special to you?",
  "How have they helped you grow?",
  "What's your favorite memory with them?",
  "What quality of theirs do you admire?",
  "How do they make your life better?",
];

export function GratitudeJournal({ friendId, entries, friendName, onAddEntry, onDeleteEntry }: GratitudeJournalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);

  const friendEntries = entries.filter(e => e.friendId === friendId);

  const handleNewPrompt = () => {
    audioService.playClick();
    setPromptIndex(Math.floor(Math.random() * GRATITUDE_PROMPTS.length));
  };

  const handleAddEntry = () => {
    if (newEntry.trim()) {
      audioService.playSuccess();
      onAddEntry({
        friendId,
        content: newEntry.trim(),
        date: new Date().toISOString(),
      });
      setNewEntry('');
      setShowAddForm(false);
      toast.success('Gratitude entry saved!');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Gratitude Journal</h3>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Entry
        </Button>
      </div>

      {/* Add Entry Form */}
      {showAddForm && (
        <Card className="p-4 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4 text-rose-500" />
              <p className="text-sm text-rose-700 dark:text-rose-300 italic">
                {GRATITUDE_PROMPTS[promptIndex]}
              </p>
              <Button size="sm" variant="ghost" onClick={handleNewPrompt} className="h-6 px-2">
                <Sparkles className="w-3 h-3" />
              </Button>
            </div>
            <Textarea
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder={`What are you grateful for about ${friendName}?`}
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddEntry} size="sm" className="flex-1 bg-rose-500 hover:bg-rose-600 text-white">
                <Heart className="w-4 h-4 mr-1" />
                Save Gratitude
              </Button>
              <Button onClick={() => setShowAddForm(false)} size="sm" variant="ghost">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      {friendEntries.length > 0 && (
        <Card className="p-4 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <span className="font-medium text-rose-800 dark:text-rose-200">
                {friendEntries.length} gratitude entries
              </span>
            </div>
            <span className="text-sm text-rose-600 dark:text-rose-400">
              Keep the positivity flowing!
            </span>
          </div>
        </Card>
      )}

      {/* Entries List */}
      {friendEntries.length === 0 ? (
        <Card className="p-8 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <Heart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 dark:text-slate-400">No gratitude entries yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Writing down what you appreciate strengthens relationships!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {friendEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((entry) => (
            <Card key={entry.id} className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span className="text-xs text-slate-500">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {new Date(entry.date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 italic">
                    "{entry.content}"
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    audioService.playDelete();
                    onDeleteEntry(entry.id);
                  }}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Benefits */}
      <Card className="p-4 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-violet-500 mt-0.5" />
          <div>
            <p className="font-medium text-violet-700 dark:text-violet-300">Benefits of Gratitude</p>
            <ul className="text-sm text-violet-600 dark:text-violet-400 mt-2 space-y-1">
              <li>• Strengthens relationships</li>
              <li>• Increases happiness and life satisfaction</li>
              <li>• Helps you focus on the positive</li>
              <li>• Creates a record of good times</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
