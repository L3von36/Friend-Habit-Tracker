import { useMemo } from 'react';
import type { Friend } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cake, Gift, Bell, ArrowRight } from 'lucide-react';

interface BirthdayWidgetProps {
  friends: Friend[];
  onSelectFriend: (f: Friend) => void;
}

interface BirthdayEntry {
  friend: Friend;
  daysUntil: number;
  nextBirthday: Date;
}

function getDaysUntilBirthday(birthday: string): number {
  const today = new Date();
  const bday = new Date(birthday);
  const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function BirthdayWidget({ friends, onSelectFriend }: BirthdayWidgetProps) {
  const upcoming = useMemo<BirthdayEntry[]>(() => {
    return friends
      .filter(f => f.birthday)
      .map(f => {
        const daysUntil = getDaysUntilBirthday(f.birthday!);
        const today = new Date();
        const bday = new Date(f.birthday!);
        const nextBirthday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
        if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
        return { friend: f, daysUntil, nextBirthday };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);
  }, [friends]);

  if (upcoming.length === 0) return null;

  const today = upcoming.filter(e => e.daysUntil === 0);
  const soon = upcoming.filter(e => e.daysUntil > 0 && e.daysUntil <= 30);

  return (
    <Card className="p-5 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-pink-100 dark:border-pink-900/30 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow">
          <Cake className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Upcoming Birthdays</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Next 30 days</p>
        </div>
      </div>

      <div className="space-y-2">
        {today.map(({ friend }) => (
          <div key={friend.id} className="flex items-center gap-3 p-3 bg-pink-100 dark:bg-pink-900/30 rounded-2xl border border-pink-200 dark:border-pink-800">
            <div className="text-2xl">🎂</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-pink-800 dark:text-pink-200 truncate">{friend.name}</p>
              <p className="text-xs text-pink-600 dark:text-pink-400 font-medium">🎉 Today! Happy Birthday!</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-pink-600" onClick={() => onSelectFriend(friend)}>
              <Gift className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {soon.map(({ friend, daysUntil, nextBirthday }) => (
          <div key={friend.id} className="flex items-center gap-3 p-2.5 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-xl transition-colors group cursor-pointer" onClick={() => onSelectFriend(friend)}>
            <div className={`w-9 h-9 rounded-lg ${friend.color} flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0`}>
              {friend.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{friend.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {nextBirthday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                daysUntil <= 7 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              }`}>
                {daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
              </span>
              {daysUntil <= 7 && <Bell className="w-3 h-3 text-orange-500" />}
              <ArrowRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
