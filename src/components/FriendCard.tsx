import type { Friend } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface FriendCardProps {
  friend: Friend;
  eventCount: number;
  onClick: () => void;
  onDelete: () => void;
}

export function FriendCard({ friend, eventCount, onClick, onDelete }: FriendCardProps) {
  const initials = friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Card 
      className="group relative p-5 cursor-pointer hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-500">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-xl ${friend.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{friend.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{friend.relationship}</p>
        </div>
      </div>

      {friend.traits.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {friend.traits.slice(0, 3).map((trait, i) => (
            <Badge key={i} variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {trait}
            </Badge>
          ))}
          {friend.traits.length > 3 && (
            <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              +{friend.traits.length - 3}
            </Badge>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Activity className="w-4 h-4" />
          <span>{eventCount} events</span>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Since {new Date(friend.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </span>
      </div>
    </Card>
  );
}
