import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import type { Friend, Event } from '@/types';
import { Users, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface GroupDynamicsProps {
  friends: Friend[];
  events: Event[];
}

export function GroupDynamics({ friends, events }: GroupDynamicsProps) {
  const groupEvents = useMemo(() => 
    events.filter(e => e.participantIds && e.participantIds.length > 1),
    [events]
  );

  const participantStats = useMemo(() => {
    const stats: Record<string, { 
      friend: Friend; 
      events: number; 
      positive: number; 
      negative: number;
      energy: 'positive' | 'neutral' | 'negative';
    }> = {};

    groupEvents.forEach(event => {
      event.participantIds?.forEach(id => {
        const friend = friends.find(f => f.id === id);
        if (!friend) return;

        if (!stats[id]) {
          stats[id] = { friend, events: 0, positive: 0, negative: 0, energy: 'neutral' };
        }
        stats[id].events++;
        if (event.sentiment === 'positive') stats[id].positive++;
        if (event.sentiment === 'negative') stats[id].negative++;
      });
    });

    // Calculate energy type
    Object.values(stats).forEach(stat => {
      const ratio = stat.positive / (stat.events || 1);
      if (ratio > 0.6) stat.energy = 'positive';
      else if (stat.negative / (stat.events || 1) > 0.3) stat.energy = 'negative';
    });

    return Object.values(stats).sort((a, b) => b.events - a.events);
  }, [groupEvents, friends]);

  const getEnergyIcon = (energy: string) => {
    switch (energy) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEnergyLabel = (energy: string) => {
    switch (energy) {
      case 'positive':
        return 'Positive Energy';
      case 'negative':
        return 'Can Be Draining';
      default:
        return 'Neutral';
    }
  };

  if (groupEvents.length === 0) {
    return (
      <Card className="p-8 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 dark:text-slate-400">No group events logged yet</p>
        <p className="text-sm text-slate-400 mt-1">
          When logging events, add multiple participants to see group dynamics
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Group Dynamics</h3>
            <p className="text-sm text-slate-500">{groupEvents.length} group events analyzed</p>
          </div>
        </div>
      </Card>

      {/* Participant Analysis */}
      <div className="space-y-3">
        <h4 className="font-medium text-slate-700 dark:text-slate-300">Energy Contributors</h4>
        {participantStats.map((stat) => (
          <Card key={stat.friend.id} className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${stat.friend.color} flex items-center justify-center text-white font-bold`}>
                  {stat.friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{stat.friend.name}</p>
                  <div className="flex items-center gap-2 text-sm">
                    {getEnergyIcon(stat.energy)}
                    <span className="text-slate-500">{getEnergyLabel(stat.energy)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stat.events}</p>
                <p className="text-xs text-slate-500">group events</p>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-sm">
              <span className="text-green-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {stat.positive} positive
              </span>
              <span className="text-red-600 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> {stat.negative} negative
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Insights */}
      <Card className="p-5 bg-gradient-to-br from-violet-500 to-purple-600 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5" />
          <h4 className="font-semibold">Group Insights</h4>
        </div>
        <ul className="space-y-2 text-sm text-violet-100">
          <li>• {participantStats.filter(s => s.energy === 'positive').length} people bring positive energy</li>
          <li>• {participantStats.filter(s => s.energy === 'negative').length} people can be draining in groups</li>
          <li>• Consider who you invite to different types of gatherings</li>
        </ul>
      </Card>
    </div>
  );
}
