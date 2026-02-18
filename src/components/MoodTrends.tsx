import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card } from '@/components/ui/card';
import type { Event, Friend } from '@/types';
import { SENTIMENTS } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MoodTrendsProps {
  friend: Friend;
  events: Event[];
}

export function MoodTrends({ events }: MoodTrendsProps) {
  const moodData = useMemo(() => {
    const moodEvents = events
      .filter(e => e.category === 'mood' || e.sentiment !== 'neutral')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (moodEvents.length === 0) return [];

    return moodEvents.map(event => ({
      date: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: event.date,
      score: event.sentiment === 'positive' ? 1 : event.sentiment === 'negative' ? -1 : 0,
      importance: event.importance,
      title: event.title,
      category: event.category,
    }));
  }, [events]);

  const sentimentOverTime = useMemo(() => {
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningScore = 0;
    return sortedEvents.map((event) => {
      const score = event.sentiment === 'positive' ? 1 : event.sentiment === 'negative' ? -1 : 0;
      runningScore += score;
      return {
        date: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cumulative: runningScore,
        event: event.title,
        sentiment: event.sentiment,
      };
    });
  }, [events]);

  const monthlyStats = useMemo(() => {
    const stats: Record<string, { positive: number; negative: number; neutral: number }> = {};
    
    events.forEach(event => {
      const month = new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!stats[month]) stats[month] = { positive: 0, negative: 0, neutral: 0 };
      stats[month][event.sentiment]++;
    });

    return Object.entries(stats).map(([month, counts]) => ({
      month,
      ...counts,
      total: counts.positive + counts.negative + counts.neutral,
      ratio: counts.positive - counts.negative,
    }));
  }, [events]);

  const trend = useMemo(() => {
    if (sentimentOverTime.length < 3) return 'stable';
    const recent = sentimentOverTime.slice(-3);
    const first = recent[0].cumulative;
    const last = recent[recent.length - 1].cumulative;
    if (last > first + 1) return 'up';
    if (last < first - 1) return 'down';
    return 'stable';
  }, [sentimentOverTime]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  if (events.length === 0) {
    return (
      <Card className="p-8 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <p className="text-slate-500 dark:text-slate-400">No events yet to analyze mood trends</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trend Indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Overall trend: {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
          </span>
        </div>
      </div>

      {/* Cumulative Sentiment Chart */}
      {sentimentOverTime.length > 1 && (
        <Card className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-4">Sentiment Over Time</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentimentOverTime}>
                <defs>
                  <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#sentimentGradient)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Monthly Breakdown */}
      {monthlyStats.length > 1 && (
        <Card className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-4">Monthly Breakdown</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="positive" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 4 }}
                  name="Positive"
                />
                <Line 
                  type="monotone" 
                  dataKey="negative" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                  name="Negative"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Positive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Negative</span>
            </div>
          </div>
        </Card>
      )}

      {/* Mood Events Timeline */}
      {moodData.length > 0 && (
        <Card className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-4">Mood Events</h4>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {moodData.slice(-10).reverse().map((mood, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className={SENTIMENTS[mood.score === 1 ? 'positive' : mood.score === -1 ? 'negative' : 'neutral'].color}>
                  {SENTIMENTS[mood.score === 1 ? 'positive' : mood.score === -1 ? 'negative' : 'neutral'].icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{mood.title}</p>
                  <p className="text-xs text-slate-500">{mood.date}</p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: mood.importance }).map((_, j) => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
