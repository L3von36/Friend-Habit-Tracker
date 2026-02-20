import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users2, ArrowRight, Check } from 'lucide-react';
import type { Friend, Event } from '@/types';
import { toast } from 'sonner';
import { audioService } from '@/lib/audio';

interface IntroduceFriendsProps {
  sourceFriend: Friend;
  allFriends: Friend[];
  isOpen: boolean;
  onClose: () => void;
  onIntroduce: (eventA: Omit<Event, 'id'>, eventB: Omit<Event, 'id'>) => void;
}

export function IntroduceFriends({ sourceFriend, allFriends, isOpen, onClose, onIntroduce }: IntroduceFriendsProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Friend | null>(null);
  const [done, setDone] = useState(false);

  const otherFriends = allFriends.filter(f => f.id !== sourceFriend.id);
  const filtered = otherFriends.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.relationship.toLowerCase().includes(search.toLowerCase())
  );

  const handleIntroduce = () => {
    if (!selected) return;
    const now = new Date().toISOString().split('T')[0];
    const baseEvent = {
      category: 'social' as const,
      sentiment: 'positive' as const,
      date: now,
    };
    onIntroduce(
      { ...baseEvent, friendId: sourceFriend.id, title: 'Friend Introduction', description: `I introduced ${sourceFriend.name} to ${selected.name}! 🤝`, tags: [], importance: 3 as const, energyImpact: 'gives' as const } as unknown as Omit<Event, 'id'>,
      { ...baseEvent, friendId: selected.id,     title: 'Friend Introduction', description: `I introduced ${selected.name} to ${sourceFriend.name}! 🤝`, tags: [], importance: 3 as const, energyImpact: 'gives' as const } as unknown as Omit<Event, 'id'>
    );
    audioService.playSuccess();
    toast.success(`${sourceFriend.name} and ${selected.name} are now connected! 🎉`);
    setDone(true);
    setTimeout(() => { setDone(false); setSelected(null); setSearch(''); onClose(); }, 1800);
  };

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const colorMap: Record<string, string> = {
    'bg-violet-500': 'bg-violet-500', 'bg-blue-500': 'bg-blue-500',
    'bg-emerald-500': 'bg-emerald-500', 'bg-rose-500': 'bg-rose-500',
    'bg-amber-500': 'bg-amber-500', 'bg-cyan-500': 'bg-cyan-500',
    'bg-pink-500': 'bg-pink-500', 'bg-indigo-500': 'bg-indigo-500',
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { setSelected(null); setSearch(''); onClose(); }}>
      <DialogContent className="max-w-sm rounded-3xl border-0 bg-white dark:bg-slate-900 shadow-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Users2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg font-bold">Introduce a Friend</DialogTitle>
              <p className="text-white/70 text-sm">Connect {sourceFriend.name} with someone</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {done ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center animate-bounce">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-center">Introduction made! 🎉</p>
              <p className="text-sm text-slate-500 text-center">Events logged for both {sourceFriend.name} and {selected?.name}.</p>
            </div>
          ) : (
            <>
              {/* Connection preview */}
              <div className="flex items-center justify-center gap-3 py-3">
                <div className={`w-12 h-12 rounded-xl ${colorMap[sourceFriend.color] || 'bg-violet-500'} flex items-center justify-center text-white font-bold shadow`}>
                  {initials(sourceFriend.name)}
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
                {selected ? (
                  <div className={`w-12 h-12 rounded-xl ${colorMap[selected.color] || 'bg-blue-500'} flex items-center justify-center text-white font-bold shadow`}>
                    {initials(selected.name)}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600">
                    ?
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search friends..."
                  className="pl-9 rounded-xl border-slate-200 dark:border-slate-700"
                />
              </div>

              {/* Friend list */}
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-4">No other friends found.</p>
                ) : filtered.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelected(f.id === selected?.id ? null : f)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left border ${
                      selected?.id === f.id
                        ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg ${colorMap[f.color] || 'bg-blue-500'} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {initials(f.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{f.name}</p>
                      <p className="text-xs text-slate-500 truncate">{f.relationship}</p>
                    </div>
                    {selected?.id === f.id && <Check className="w-4 h-4 text-violet-500 flex-shrink-0" />}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleIntroduce}
                disabled={!selected}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl disabled:opacity-40"
              >
                <Users2 className="w-4 h-4 mr-2" />
                Make Introduction
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
