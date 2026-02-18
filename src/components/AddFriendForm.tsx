import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Calendar } from 'lucide-react';
import type { Friend } from '@/types';
import { FRIEND_COLORS, COMMON_TAGS, RELATIONSHIP_TYPES } from '@/types';

interface AddFriendFormProps {
  onSubmit: (friend: Friend | Omit<Friend, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Friend | null;
  isEditing?: boolean;
}

export function AddFriendForm({ onSubmit, onCancel, initialData, isEditing }: AddFriendFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [relationship, setRelationship] = useState(initialData?.relationship || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [traits, setTraits] = useState<string[]>(initialData?.traits || []);
  const [selectedColor, setSelectedColor] = useState(initialData?.color || FRIEND_COLORS[0]);
  const [birthday, setBirthday] = useState(initialData?.birthday || '');
  const [newTrait, setNewTrait] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    if (isEditing && initialData) {
      onSubmit({
        ...initialData,
        name: name.trim(),
        relationship: relationship.trim(),
        notes: notes.trim(),
        traits,
        color: selectedColor,
        birthday: birthday || undefined,
        giftIdeas: initialData.giftIdeas || [],
        interests: initialData.interests || [],
      });
    } else {
      onSubmit({
        name: name.trim(),
        relationship: relationship.trim(),
        notes: notes.trim(),
        traits,
        color: selectedColor,
        birthday: birthday || undefined,
        giftIdeas: [],
        interests: [],
      });
    }
  };

  const addTrait = () => {
    if (newTrait.trim() && !traits.includes(newTrait.trim())) {
      setTraits([...traits, newTrait.trim()]);
      setNewTrait('');
    }
  };

  const removeTrait = (trait: string) => {
    setTraits(traits.filter(t => t !== trait));
  };

  const addCommonTag = (tag: string) => {
    if (!traits.includes(tag)) {
      setTraits([...traits, tag]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter friend's name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="relationship">Relationship</Label>
        <select
          id="relationship"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
        >
          <option value="">Select relationship type</option>
          {RELATIONSHIP_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthday">Birthday</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Profile Color</Label>
        <div className="flex flex-wrap gap-2">
          {FRIEND_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-lg ${color} transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-violet-500 scale-110' : 'hover:scale-105'}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any general notes about this person..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Traits</Label>
        <div className="flex gap-2">
          <Input
            value={newTrait}
            onChange={(e) => setNewTrait(e.target.value)}
            placeholder="Add a trait..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTrait();
              }
            }}
          />
          <Button type="button" onClick={addTrait} variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Common tags */}
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-2">Common traits (click to add):</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_TAGS.filter(tag => !traits.includes(tag)).slice(0, 10).map((tag) => (
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

        {/* Selected traits */}
        {traits.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {traits.map((trait) => (
              <Badge key={trait} variant="secondary" className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                {trait}
                <button
                  type="button"
                  onClick={() => removeTrait(trait)}
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
          disabled={!name.trim()}
        >
          {isEditing ? 'Update Friend' : 'Add Friend'}
        </Button>
      </div>
    </form>
  );
}
