import type { Event, Friend } from '@/types';
import { CATEGORIES, SENTIMENTS } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimelineProps {
  events: Event[];
  friends: Friend[];
  onDelete: (eventId: string) => void;
}

export function Timeline({ events, friends, onDelete }: TimelineProps) {
  const getFriend = (friendId: string) => friends.find(f => f.id === friendId);

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const sortedDates = Object.keys(groupedEvents).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (events.length === 0) {
    return (
      <Card className="p-12 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <Calendar className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
          No events yet
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Start logging events to build a timeline of your friends' behaviors and interactions
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((date) => (
        <div key={date} className="relative">
          {/* Date Header */}
          <div className="sticky top-16 z-10 mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium text-sm">
              <Calendar className="w-4 h-4" />
              {date}
            </div>
          </div>

          {/* Events for this date */}
          <div className="space-y-4 ml-4">
            {groupedEvents[date].map((event) => {
              const friend = getFriend(event.friendId);
              if (!friend) return null;

              const initials = friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

              return (
                <Card 
                  key={event.id} 
                  className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-start gap-4">
                    {/* Category Icon */}
                    <div className={`w-12 h-12 rounded-xl ${CATEGORIES[event.category].color} flex items-center justify-center text-white text-xl flex-shrink-0`}>
                      {CATEGORIES[event.category].icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">{event.title}</h4>
                            <span className={SENTIMENTS[event.sentiment].color} title={`${SENTIMENTS[event.sentiment].label} sentiment`}>
                              {SENTIMENTS[event.sentiment].icon}
                            </span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: event.importance }).map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                              ))}
                            </div>
                          </div>
                          
                          {/* Friend Badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-5 h-5 rounded-full ${friend.color} flex items-center justify-center text-white text-xs`}>
                              {initials[0]}
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">{friend.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {CATEGORIES[event.category].label}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 flex-shrink-0"
                          onClick={() => onDelete(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Description */}
                      {event.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Tags */}
                      {event.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {event.tags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
