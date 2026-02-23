import { CATEGORIES } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Activity, TrendingUp, TrendingDown, Calendar, Tag, Sparkles } from 'lucide-react';
import { NetworkGraph } from './Social/NetworkGraph';

import { useStats } from '@/hooks/useStats';

interface DashboardProps {
  onOpenWrapped: () => void;
}

export function Dashboard({ onOpenWrapped }: DashboardProps) {
  const { aggregateStats: stats, tagStats: sortedTags, recentEvents, friends } = useStats();

  const categoryStats = stats.categoryCounts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
         <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
           Dashboard Overview
         </h2>
         <Button 
            onClick={() => onOpenWrapped()}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 border-0 rounded-xl text-sm"
         >
            <Sparkles className="w-4 h-4 mr-2 text-yellow-300" />
            Your Yearly Wrapped
         </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="p-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200">{stats.totalFriends}</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Connections</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200">{stats.totalEvents}</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Events Logged</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.positiveEvents}</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Positive</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.negativeEvents}</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Negative</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="p-4 sm:p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
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
        <Card className="p-4 sm:p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
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
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Recent Activity</h3>
        </div>
        <div className="p-4 sm:p-6">
          {recentEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 dark:text-slate-400">No events logged yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className={`w-10 h-10 rounded-lg ${CATEGORIES[event.category as keyof typeof CATEGORIES]?.color || 'bg-slate-500'} flex items-center justify-center text-white flex-shrink-0`}>
                    <span className="text-lg">{CATEGORIES[event.category as keyof typeof CATEGORIES]?.icon || '📝'}</span>
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

      <div className="h-[500px] w-full mt-6">
        <NetworkGraph friends={friends} />
      </div>
    </div>
  );
}
