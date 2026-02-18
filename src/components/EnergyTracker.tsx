import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Event } from '@/types';
import { Zap, Battery, Minus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { analyzeEnergyPatterns } from '@/lib/aiHelpers';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface EnergyTrackerProps {
  events: Event[];
}

export function EnergyTracker({ events }: EnergyTrackerProps) {
  const patterns = useMemo(() => analyzeEnergyPatterns(events), [events]);
  
  const pieData = useMemo(() => [
    { name: 'Energizing', value: patterns.energizing, color: '#22c55e' },
    { name: 'Neutral', value: patterns.neutral, color: '#94a3b8' },
    { name: 'Draining', value: patterns.draining, color: '#ef4444' },
  ], [patterns]);

  const total = events.length || 1;
  const energizingPercent = Math.round((patterns.energizing / total) * 100);
  const drainingPercent = Math.round((patterns.draining / total) * 100);

  const getEnergyIcon = () => {
    if (energizingPercent > 60) return <Zap className="w-6 h-6 text-green-500" />;
    if (drainingPercent > 40) return <Battery className="w-6 h-6 text-red-500" />;
    return <Minus className="w-6 h-6 text-gray-500" />;
  };

  const getEnergyLabel = () => {
    if (energizingPercent > 60) return 'Energy Giver';
    if (drainingPercent > 40) return 'Energy Taker';
    return 'Energy Neutral';
  };

  const getEnergyColor = () => {
    if (energizingPercent > 60) return 'text-green-600';
    if (drainingPercent > 40) return 'text-red-600';
    return 'text-gray-600';
  };

  if (events.length === 0) {
    return (
      <Card className="p-8 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <Zap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 dark:text-slate-400">Log events with energy ratings to see patterns</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Energy Status */}
      <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getEnergyIcon()}
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Energy Impact</h3>
              <p className={`text-sm font-medium ${getEnergyColor()}`}>{getEnergyLabel()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {energizingPercent - drainingPercent > 0 ? '+' : ''}{energizingPercent - drainingPercent}%
            </p>
            <p className="text-xs text-slate-500">Net Energy</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Energizing
              </span>
              <span className="font-medium">{patterns.energizing} events ({energizingPercent}%)</span>
            </div>
            <Progress value={energizingPercent} className="h-2 bg-slate-100">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${energizingPercent}%` }} />
            </Progress>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-red-600 flex items-center gap-1">
                <TrendingDown className="w-4 h-4" /> Draining
              </span>
              <span className="font-medium">{patterns.draining} events ({drainingPercent}%)</span>
            </div>
            <Progress value={drainingPercent} className="h-2 bg-slate-100">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${drainingPercent}%` }} />
            </Progress>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 flex items-center gap-1">
                <Minus className="w-4 h-4" /> Neutral
              </span>
              <span className="font-medium">{patterns.neutral} events ({Math.round((patterns.neutral/total)*100)}%)</span>
            </div>
            <Progress value={(patterns.neutral/total)*100} className="h-2 bg-slate-100">
              <div className="h-full bg-gray-400 rounded-full" style={{ width: `${(patterns.neutral/total)*100}%` }} />
            </Progress>
          </div>
        </div>
      </Card>

      {/* Pie Chart */}
      <Card className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-4">Energy Distribution</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-slate-600">{item.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Insights */}
      {drainingPercent > 40 && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-300">Energy Drain Alert</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                This relationship tends to be draining. Consider setting boundaries or having an honest conversation about your needs.
              </p>
            </div>
          </div>
        </Card>
      )}

      {energizingPercent > 60 && (
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-300">Energy Booster!</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                This person energizes you! Spend more time with them when you need a boost.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
