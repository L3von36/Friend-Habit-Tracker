import type { Friend, Event } from '@/types';
import { CATEGORIES } from '@/types';
import { Card } from '@/components/ui/card';
import { Users, Activity, TrendingUp, TrendingDown, Calendar, Tag } from 'lucide-react';

interface DashboardProps {
  friends: Friend[];
  events: Event[];
}

export function Dashboard({ friends, events }: DashboardProps) {
  const stats = {
    totalFriends: friends.length,
    totalEvents: events.length,
    positiveEvents: events.filter(e => e.sentiment === 'positive').length,
    negativeEvents: events.filter(e => e.sentiment === 'negative').length,
    neutralEvents: events.filter(e => e.sentiment === 'neutral').length,
  };

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const topTags = events
    .flatMap(e => e.tags)
    .reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const sortedTags = Object.entries(topTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const categoryStats = events.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-violet-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">{stats.totalFriends}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Friends</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">{stats.totalEvents}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Events Logged</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">{stats.positiveEvents}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Positive</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-red-600">{stats.negativeEvents}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Negative</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Events by Category</h3>
          <div className="space-y-3">
            {Object.entries(CATEGORIES).map(([key, { label, color }]) => {
              const count = categoryStats[key] || 0;
              const percentage = stats.totalEvents > 0 ? (count / stats.totalEvents * 100).toFixed(0) : 0;
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white text-sm`}>
                      {CATEGORIES[key as keyof typeof CATEGORIES].icon}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Tags */}
        <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Most Common Tags</h3>
          {sortedTags.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">No tags yet</p>
          ) : (
            <div className="space-y-3">
              {sortedTags.map(([tag, count]) => {
                const maxCount = sortedTags[0][1];
                const percentage = (count / maxCount * 100).toFixed(0);
                return (
                  <div key={tag} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{tag}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-violet-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Recent Activity</h3>
        </div>
        <div className="p-6">
          {recentEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 dark:text-slate-400">No events logged yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className={`w-10 h-10 rounded-lg ${CATEGORIES[event.category].color} flex items-center justify-center text-white flex-shrink-0`}>
                    <span className="text-lg">{CATEGORIES[event.category].icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{event.title}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-500">
                      <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      {event.tags.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {event.tags.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
