import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { Friend, Event } from '@/types';

interface CalendarViewProps {
  friends: Friend[];
  events: Event[];
  onSelectFriend: (f: Friend) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function sentimentColor(events: Event[]) {
  if (!events.length) return '';
  const pos = events.filter(e => e.sentiment === 'positive').length;
  const neg = events.filter(e => e.sentiment === 'negative').length;
  if (pos > neg) return 'bg-emerald-400';
  if (neg > pos) return 'bg-rose-400';
  return 'bg-violet-400';
}

export function CalendarView({ friends, events, onSelectFriend }: CalendarViewProps) {
  const today = new Date();
  const [displayDate, setDisplayDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date | null>(null);

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map events by YYYY-MM-DD
  const eventsByDay = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach(e => {
      const key = e.date.split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const selectedDateKey = selected ? `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}` : null;
  const selectedEvents = selectedDateKey ? (eventsByDay[selectedDateKey] || []) : [];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const isSelected = (d: number) =>
    selected && d === selected.getDate() && month === selected.getMonth() && year === selected.getFullYear();

  const dayKey = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-sm">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-5">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setDisplayDate(new Date(year, month - 1, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-500" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {MONTHS[month]} {year}
            </h3>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setDisplayDate(new Date(year, month + 1, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />;
            const key = dayKey(d);
            const dayEvents = eventsByDay[key] || [];
            const dotColor = sentimentColor(dayEvents);
            return (
              <button
                key={d}
                onClick={() => setSelected(new Date(year, month, d))}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold relative transition-all hover:bg-violet-50 dark:hover:bg-violet-900/20 ${
                  isSelected(d) ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' :
                  isToday(d) ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 ring-2 ring-violet-400' :
                  'text-slate-700 dark:text-slate-300'
                }`}
              >
                {d}
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 flex gap-0.5 justify-center">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <span key={idx} className={`w-1 h-1 rounded-full ${isSelected(d) ? 'bg-white/70' : dotColor}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Day Events */}
      {selected && (
        <Card className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3">
            {selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h4>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No events logged this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map(ev => {
                const friend = friends.find(f => f.id === ev.friendId);
                return (
                  <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors cursor-pointer" onClick={() => friend && onSelectFriend(friend)}>
                    {friend && (
                      <div className={`w-8 h-8 rounded-lg ${friend.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {friend.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{ev.title}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          ev.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          ev.sentiment === 'negative' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}>{ev.sentiment}</span>
                      </div>
                      {friend && <p className="text-xs text-slate-500 dark:text-slate-400">with {friend.name}</p>}
                      {ev.description && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">{ev.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-400 justify-center">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Positive</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Negative</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" /> Mixed</span>
      </div>
    </div>
  );
}
