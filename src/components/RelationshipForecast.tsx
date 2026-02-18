import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import type { Friend, Event } from '@/types';
import { generateForecast, predictMood } from '@/lib/aiHelpers';
import { TrendingUp, AlertTriangle, CheckCircle, Lightbulb, Calendar, MessageCircle, Heart } from 'lucide-react';

interface RelationshipForecastProps {
  friend: Friend;
  events: Event[];
}

export function RelationshipForecast({ friend, events }: RelationshipForecastProps) {
  const forecast = useMemo(() => generateForecast(friend, events), [friend, events]);
  const moodPrediction = useMemo(() => predictMood(friend, events), [friend, events]);

  const getStatusIcon = () => {
    switch (forecast.status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'at-risk':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      default:
        return <TrendingUp className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (forecast.status) {
      case 'healthy':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'at-risk':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    }
  };

  const getStatusTextColor = () => {
    switch (forecast.status) {
      case 'healthy':
        return 'text-green-700 dark:text-green-300';
      case 'at-risk':
        return 'text-red-700 dark:text-red-300';
      default:
        return 'text-yellow-700 dark:text-yellow-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Relationship Status */}
      <Card className={`p-6 ${getStatusColor()}`}>
        <div className="flex items-start gap-4">
          {getStatusIcon()}
          <div className="flex-1">
            <h3 className={`font-semibold ${getStatusTextColor()}`}>
              Relationship Status: {forecast.status === 'healthy' ? 'Healthy' : forecast.status === 'at-risk' ? 'At Risk' : 'Needs Attention'}
            </h3>
            <p className={`mt-1 ${getStatusTextColor()} opacity-80`}>{forecast.message}</p>
          </div>
        </div>
      </Card>

      {/* Mood Prediction */}
      {moodPrediction.confidence > 0 && (
        <Card className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-violet-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Mood Prediction</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-slate-700 dark:text-slate-300">{moodPrediction.prediction}</p>
              <p className="text-sm text-slate-500 mt-1">{moodPrediction.suggestion}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-violet-600">{moodPrediction.confidence}%</div>
              <div className="text-xs text-slate-500">confidence</div>
            </div>
          </div>
        </Card>
      )}

      {/* Suggested Actions */}
      <Card className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-rose-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Suggested Actions</h3>
        </div>
        <div className="space-y-3">
          {forecast.actions.map((action, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-violet-600">{i + 1}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">{action}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Communication Tips */}
      <Card className="p-5 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-blue-700 dark:text-blue-300">Communication Tips</h3>
        </div>
        <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            Best time to reach them: {friend.bestTimeToReach || 'Not set - observe their patterns'}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            Preferred contact: {friend.preferredContact || 'Not set - try different methods'}
          </li>
          {friend.averageResponseTime && (
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              Average response time: {friend.averageResponseTime} hours
            </li>
          )}
        </ul>
      </Card>

      {/* Last Contact */}
      {friend.lastContactDate && (
        <Card className="p-4 bg-slate-50 dark:bg-slate-700/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Last contact: {new Date(friend.lastContactDate).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
