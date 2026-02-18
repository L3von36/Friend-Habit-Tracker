import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Users } from 'lucide-react';
import type { Event, Friend } from '@/types';
import { CATEGORIES, SENTIMENTS, COMMON_TAGS, ENERGY_IMPACTS } from '@/types';

interface AddEventFormProps {
  friendId: string;
  friends: Friend[];
  onSubmit: (event: Omit<Event, 'id'>) => void;
  onCancel: () => void;
}

export function AddEventForm({ friendId, friends, onSubmit, onCancel }: AddEventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Event['category']>('behavior');
  const [sentiment, setSentiment] = useState<Event['sentiment']>('neutral');
  const [importance, setImportance] = useState<Event['importance']>(3);
  const [energyImpact, setEnergyImpact] = useState<Event['energyImpact']>('neutral');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSubmit({
      friendId,
      title: title.trim(),
      description: description.trim(),
      date,
      category,
      sentiment,
      importance,
      energyImpact,
      tags,
      participantIds: participantIds.length > 0 ? [...participantIds, friendId] : undefined,
    });
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addCommonTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const toggleParticipant = (id: string) => {
    setParticipantIds(prev => 
      prev.includes(id) 
        ? prev.filter(pid => pid !== id)
        : [...prev, id]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What happened?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what happened, how they reacted, etc..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="importance">Importance (1-5)</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setImportance(level as Event['importance'])}
                className={`flex-1 h-10 rounded-lg border-2 transition-all ${
                  importance >= level 
                    ? 'border-violet-500 bg-violet-100 dark:bg-violet-900/30 text-violet-700' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(CATEGORIES).map(([key, { label, icon }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key as Event['category'])}
              className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                category === key 
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
              }`}
            >
              <span className="text-lg">{icon}</span>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Sentiment</Label>
        <div className="flex gap-2">
          {Object.entries(SENTIMENTS).map(([key, { label, icon }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSentiment(key as Event['sentiment'])}
              className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                sentiment === key 
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
              }`}
            >
              <span>{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Energy Impact</Label>
        <div className="flex gap-2">
          {Object.entries(ENERGY_IMPACTS).map(([key, { label, icon }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setEnergyImpact(key as Event['energyImpact'])}
              className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                energyImpact === key 
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
              }`}
            >
              <span>{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Group Event Participants */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Other Participants (for group events)</Label>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <Users className="w-4 h-4 mr-1" />
            {showParticipants ? 'Hide' : 'Add'}
          </Button>
        </div>
        
        {showParticipants && (
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-xs text-slate-500 mb-2">Select other friends who were present:</p>
            <div className="flex flex-wrap gap-2">
              {friends.filter(f => f.id !== friendId).map(friend => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => toggleParticipant(friend.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    participantIds.includes(friend.id)
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-2 border-violet-300'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-2 border-transparent hover:border-violet-200'
                  }`}
                >
                  {participantIds.includes(friend.id) && '✓ '}{friend.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" onClick={addTag} variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Common tags */}
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-2">Common tags (click to add):</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_TAGS.filter(tag => !tags.includes(tag)).slice(0, 10).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addCommonTag(tag)}
                className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-300 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Selected tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white"
          disabled={!title.trim()}
        >
          Log Event
        </Button>
      </div>
    </form>
  );
}
