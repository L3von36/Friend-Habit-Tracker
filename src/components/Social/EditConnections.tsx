import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Link as LinkIcon, Unlink, Network } from 'lucide-react';
import type { Friend } from '@/types';
import { audioService } from '@/lib/audio';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditConnectionsProps {
  friend: Friend;
  allFriends: Friend[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateConnections: (friendId: string, connectedIds: string[]) => void;
}

export function EditConnections({ friend, allFriends, isOpen, onClose, onUpdateConnections }: EditConnectionsProps) {
  const [search, setSearch] = useState('');
  
  const connectedSet = useMemo(() => new Set(friend.connectedFriends || []), [friend.connectedFriends]);
  
  const otherFriends = useMemo(() => allFriends.filter(f => f.id !== friend.id), [allFriends, friend.id]);
  
  const filtered = useMemo(() => {
    return otherFriends.filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.relationship.toLowerCase().includes(search.toLowerCase())
    );
  }, [otherFriends, search]);

  const toggleConnection = (targetId: string) => {
    const newConnections = new Set(connectedSet);
    if (newConnections.has(targetId)) {
      newConnections.delete(targetId);
      audioService.playClick();
    } else {
      newConnections.add(targetId);
      audioService.playSuccess();
    }
    onUpdateConnections(friend.id, Array.from(newConnections));
  };

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const colorMap: Record<string, string> = {
    'bg-violet-500': 'bg-violet-500', 'bg-blue-500': 'bg-blue-500',
    'bg-emerald-500': 'bg-emerald-500', 'bg-rose-500': 'bg-rose-500',
    'bg-amber-500': 'bg-amber-500', 'bg-cyan-500': 'bg-cyan-500',
    'bg-pink-500': 'bg-pink-500', 'bg-indigo-500': 'bg-indigo-500',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            setSearch('');
            onClose();
        }
    }}>
      <DialogContent className="max-w-md rounded-3xl border-0 bg-white dark:bg-slate-900 shadow-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg font-bold">Edit Connections</DialogTitle>
              <DialogDescription className="text-white/70 text-sm">
                Manage who {friend.name} is connected to
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search friends..."
              className="pl-9 rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-violet-500"
            />
          </div>

          {/* Friend list */}
          <ScrollArea className="h-72 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="p-2 space-y-1">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">No friends found.</p>
              ) : filtered.map(f => {
                const isConnected = connectedSet.has(f.id);
                return (
                  <div
                    key={f.id}
                    className="flexItems-center justify-between p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${colorMap[f.color] || 'bg-blue-500'} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                        {initials(f.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{f.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{f.relationship}</p>
                      </div>
                    </div>
                    <Button
                      variant={isConnected ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => toggleConnection(f.id)}
                      className={`h-8 px-3 rounded-lg ${isConnected ? 'text-violet-600 bg-violet-100 dark:bg-violet-900/40 dark:text-violet-300 hover:bg-violet-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {isConnected ? (
                        <>
                           <Unlink className="w-3.5 h-3.5 mr-1.5" />
                           Unlink
                        </>
                      ) : (
                        <>
                           <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                           Link
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          <div className="flex justify-end pt-2">
            <Button onClick={onClose} className="rounded-xl px-6">Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
