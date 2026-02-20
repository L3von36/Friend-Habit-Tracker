import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { audioService } from '@/lib/audio';
import { Badge } from '@/components/ui/badge';
import type { Reminder, Friend } from '@/types';
import { Bell, X, Gift, MessageCircle, Calendar } from 'lucide-react';

interface RemindersProps {
  reminders: Reminder[];
  friends: Friend[];
  onDismiss: (reminderId: string) => void;
  onSelectFriend: (friend: Friend) => void;
}

export function Reminders({ reminders, friends, onDismiss, onSelectFriend }: RemindersProps) {
  const activeReminders = useMemo(() => 
    reminders.filter(r => !r.dismissed),
    [reminders]
  );

  const getFriend = (friendId: string) => friends.find(f => f.id === friendId);

  const getReminderIcon = (type: Reminder['type']) => {
    switch (type) {
      case 'birthday':
        return <Gift className="w-5 h-5 text-pink-500" />;
      case 'checkin':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Calendar className="w-5 h-5 text-violet-500" />;
    }
  };

  const getReminderColor = (type: Reminder['type']) => {
    switch (type) {
      case 'birthday':
        return 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800';
      case 'checkin':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800';
    }
  };

  if (activeReminders.length === 0) {
    return (
      <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Bell className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">All Caught Up!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">No pending reminders</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Bell className="w-4 h-4 text-violet-500" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Reminders</h3>
        </div>
        <Badge variant="secondary" className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
          {activeReminders.length}
        </Badge>
      </div>
      
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {activeReminders.map((reminder) => {
          const friend = getFriend(reminder.friendId);
          if (!friend) return null;

          const initials = friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

          return (
            <div 
              key={reminder.id}
              className={`p-4 rounded-lg border-2 ${getReminderColor(reminder.type)} flex items-start gap-3`}
            >
              <div className="flex-shrink-0">
                {getReminderIcon(reminder.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-5 h-5 rounded-full ${friend.color} flex items-center justify-center text-white text-xs`}>
                    {initials[0]}
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{friend.name}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{reminder.message}</p>
                
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    className="bg-violet-500 hover:bg-violet-600 text-white"
                    onClick={() => onSelectFriend(friend)}
                  >
                    View Profile
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      audioService.playDelete();
                      onDismiss(reminder.id);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
