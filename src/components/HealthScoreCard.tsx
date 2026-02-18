import { Card } from '@/components/ui/card';
import type { HealthScore } from '@/types';
import { getHealthColor, getHealthBgColor, getHealthLabel } from '@/lib/healthScore';
import { TrendingUp, TrendingDown, Minus, Heart, MessageCircle, Clock, Scale, Layers, Zap } from 'lucide-react';

interface HealthScoreCardProps {
  score: HealthScore;
  friendName: string;
}

export function HealthScoreCard({ score, friendName }: HealthScoreCardProps) {
  const getTrendIcon = () => {
    switch (score.trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const scoreMetrics = [
    { 
      label: 'Sentiment', 
      value: score.sentiment, 
      icon: Heart,
      description: 'Balance of positive vs negative interactions'
    },
    { 
      label: 'Frequency', 
      value: score.frequency, 
      icon: Clock,
      description: 'How often you interact'
    },
    { 
      label: 'Reciprocity', 
      value: score.reciprocity, 
      icon: Scale,
      description: 'Balance in the relationship'
    },
    { 
      label: 'Depth', 
      value: score.depth, 
      icon: Layers,
      description: 'Quality and importance of interactions'
    },
    { 
      label: 'Energy', 
      value: score.energy, 
      icon: Zap,
      description: 'How they affect your energy levels'
    },
  ];

  return (
    <Card className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
      {/* Overall Score */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Relationship Health
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            How things are going with {friendName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`text-4xl font-bold ${getHealthColor(score.overall)}`}>
            {score.overall}
          </div>
          <div className="flex flex-col items-center">
            {getTrendIcon()}
            <span className="text-xs text-slate-500 mt-1">{score.trend}</span>
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600 dark:text-slate-400">Overall Score</span>
          <span className={`font-medium ${getHealthColor(score.overall)}`}>
            {getHealthLabel(score.overall)}
          </span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getHealthBgColor(score.overall)} transition-all duration-500 rounded-full`}
            style={{ width: `${score.overall}%` }}
          />
        </div>
      </div>

      {/* Individual Metrics */}
      <div className="space-y-4">
        {scoreMetrics.map((metric) => (
          <div key={metric.label} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <metric.icon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">{metric.label}</span>
              </div>
              <span className={`text-sm font-medium ${getHealthColor(metric.value)}`}>
                {metric.value}
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getHealthBgColor(metric.value)} transition-all duration-500 rounded-full`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {metric.description}
            </p>
          </div>
        ))}
      </div>

      {/* Interpretation */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <div className="flex items-start gap-3">
          <MessageCircle className="w-5 h-5 text-violet-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              What this means
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {score.overall >= 80 
                ? `Your relationship with ${friendName} is thriving! Keep nurturing this connection.`
                : score.overall >= 60
                ? `Things are going well with ${friendName}. There's room for growth in some areas.`
                : score.overall >= 40
                ? `Your relationship with ${friendName} could use some attention. Consider reaching out more often.`
                : `This relationship needs care. Try having an open conversation with ${friendName}.`
              }
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
