import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Friend } from '@/types';
import { GIFT_CATEGORIES, INTERESTS } from '@/types';
import { Gift, Plus, X, Sparkles, Heart, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

interface GiftSuggestionsProps {
  friend: Friend;
  onUpdateGiftIdeas: (ideas: string[]) => void;
  onUpdateInterests: (interests: string[]) => void;
}

export function GiftSuggestions({ friend, onUpdateGiftIdeas, onUpdateInterests }: GiftSuggestionsProps) {
  const [newGift, setNewGift] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddGift = () => {
    if (newGift.trim() && !friend.giftIdeas.includes(newGift.trim())) {
      onUpdateGiftIdeas([...friend.giftIdeas, newGift.trim()]);
      setNewGift('');
      setShowAddForm(false);
      toast.success('Gift idea saved!');
    }
  };

  const handleRemoveGift = (gift: string) => {
    onUpdateGiftIdeas(friend.giftIdeas.filter(g => g !== gift));
  };

  const handleToggleInterest = (interest: string) => {
    if (friend.interests.includes(interest)) {
      onUpdateInterests(friend.interests.filter(i => i !== interest));
    } else {
      onUpdateInterests([...friend.interests, interest]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Interests */}
      <Card className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-pink-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Their Interests</h3>
        </div>
        <p className="text-sm text-slate-500 mb-3">Select interests to get better gift suggestions</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(interest => (
            <button
              key={interest}
              onClick={() => handleToggleInterest(interest)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                friend.interests.includes(interest)
                  ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-2 border-pink-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-2 border-transparent hover:border-pink-200'
              }`}
            >
              {friend.interests.includes(interest) && '✓ '}{interest}
            </button>
          ))}
        </div>
      </Card>

      {/* Saved Gift Ideas */}
      <Card className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-violet-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Saved Gift Ideas</h3>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {showAddForm && (
          <div className="flex gap-2 mb-4">
            <Input
              value={newGift}
              onChange={(e) => setNewGift(e.target.value)}
              placeholder="Enter gift idea..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddGift();
                }
              }}
            />
            <Button onClick={handleAddGift} size="sm">
              Save
            </Button>
          </div>
        )}

        {friend.giftIdeas.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No gift ideas saved yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {friend.giftIdeas.map((gift, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 pl-3"
              >
                {gift}
                <button
                  onClick={() => handleRemoveGift(gift)}
                  className="ml-2 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* AI Suggestions */}
      <Card className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-amber-800 dark:text-amber-200">AI Gift Suggestions</h3>
        </div>
        
        <div className="space-y-2">
          {friend.interests.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                Based on their interests in {friend.interests.slice(0, 3).join(', ')}:
              </p>
              {friend.interests.slice(0, 3).map((interest, i) => {
                const suggestions: Record<string, string[]> = {
                  'Sports': ['Tickets to a game', 'Team merchandise', 'Sports equipment'],
                  'Music': ['Concert tickets', 'Vinyl records', 'Music streaming gift card'],
                  'Movies': ['Movie theater gift card', 'Streaming subscription', 'Movie night kit'],
                  'Books': ['Bestseller book', 'Bookstore gift card', 'E-reader accessories'],
                  'Travel': ['Travel accessories', 'Weekend getaway', 'Luggage tags'],
                  'Food': ['Restaurant gift card', 'Cooking class', 'Gourmet food basket'],
                  'Gaming': ['New game release', 'Gaming accessories', 'Gift card to game store'],
                  'Art': ['Art supplies', 'Museum membership', 'Art print'],
                  'Fitness': ['Gym gear', 'Fitness tracker', 'Workout clothes'],
                  'Technology': ['Gadget accessories', 'Tech subscription', 'Smart home device'],
                  'Fashion': ['Clothing gift card', 'Accessory', 'Styling session'],
                  'Photography': ['Camera accessories', 'Photo book', 'Photography class'],
                  'Cooking': ['Cookbook', 'Kitchen gadget', 'Cooking class'],
                  'Outdoors': ['Camping gear', 'Hiking equipment', 'National park pass'],
                  'Pets': ['Pet accessories', 'Pet photo session', 'Pet treat basket'],
                };
                const giftList = suggestions[interest] || ['Something related to ' + interest];
                return (
                  <div key={i} className="flex items-start gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-500 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">{interest}:</span>
                      <span className="text-sm text-amber-700 dark:text-amber-300 ml-1">
                        {giftList.join(', ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Add their interests above to get personalized gift suggestions!
            </p>
          )}
        </div>

        {/* Gift Categories */}
        <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">Gift Categories to Consider:</p>
          <div className="flex flex-wrap gap-1.5">
            {GIFT_CATEGORIES.map(cat => (
              <span 
                key={cat} 
                className="px-2 py-1 text-xs rounded-full bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
