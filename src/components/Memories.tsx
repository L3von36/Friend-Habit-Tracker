import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { audioService } from '@/lib/audio';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { Memory } from '@/types';
import { Plus, Calendar, Tag, Trash2, Heart, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface MemoriesProps {
  friendId: string;
  memories: Memory[];
  onAddMemory: (memory: Omit<Memory, 'id'>) => void;
  onDeleteMemory: (memoryId: string) => void;
}

export function Memories({ friendId, memories, onAddMemory, onDeleteMemory }: MemoriesProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTags, setNewTags] = useState('');

  const friendMemories = memories.filter(m => m.friendId === friendId);

  const handleAddMemory = () => {
    if (newTitle.trim()) {
      audioService.playSuccess();
      onAddMemory({
        friendId,
        title: newTitle.trim(),
        description: newDescription.trim(),
        date: newDate,
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setNewTitle('');
      setNewDescription('');
      setNewDate(new Date().toISOString().split('T')[0]);
      setNewTags('');
      setShowAddForm(false);
      toast.success('Memory saved!');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-pink-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Memories</h3>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Memory
        </Button>
      </div>

      {/* Add Memory Form */}
      {showAddForm && (
        <Card className="p-4 bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800">
          <div className="space-y-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Memory title..."
            />
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe this special moment..."
              rows={3}
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Date</label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Tags (comma separated)</label>
                <Input
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="vacation, birthday, funny"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddMemory} size="sm" className="flex-1 bg-pink-500 hover:bg-pink-600 text-white">
                <Heart className="w-4 h-4 mr-1" />
                Save Memory
              </Button>
              <Button onClick={() => setShowAddForm(false)} size="sm" variant="ghost">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Memories List */}
      {friendMemories.length === 0 ? (
        <Card className="p-8 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <Camera className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 dark:text-slate-400">No memories saved yet</p>
          <p className="text-sm text-slate-400 mt-1">Capture your favorite moments together!</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {friendMemories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((memory) => (
            <Card key={memory.id} className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-800 dark:text-slate-200">{memory.title}</h4>
                  {memory.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{memory.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(memory.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                    {memory.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {memory.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    audioService.playDelete();
                    onDeleteMemory(memory.id);
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
    </div>
  );
}
