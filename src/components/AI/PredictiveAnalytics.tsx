import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  Zap, 
  Heart, 
  MessageSquare, 
  BrainCircuit,
  Calendar,
  Sparkles,
  Loader2
} from 'lucide-react';
import type { Friend, Event } from '@/types';
import { callGroq } from '@/lib/groq';

interface PredictiveAnalyticsProps {
  friends: Friend[];
  events: Event[];
  memories: any[];
}

interface Prediction {
  friendId: string;
  friendName: string;
  forecast: string;
  interactionPattern: string;
  conflictRisk: 'low' | 'medium' | 'high';
  churnRisk: boolean;
  optimalFrequency: string;
  lifeEventForecast?: string;
  communicationStyle: string;
  lifecyclePhase: string;
  healthScore: number; // 0-100
}

export function PredictiveAnalytics({ friends, events, memories }: PredictiveAnalyticsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const friendsWithEvents = useMemo(() => {
    return friends.filter(f => events.some(e => e.friendId === f.id));
  }, [friends, events]);

  const generatePredictions = async () => {
    if (friendsWithEvents.length === 0) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const dataToAnalyze = friendsWithEvents.map(f => ({
        name: f.name,
        id: f.id,
        relationship: f.relationship,
        events: events.filter(e => e.friendId === f.id).map(e => ({
          date: e.date,
          category: e.category,
          sentiment: e.sentiment,
          title: e.title,
          tags: e.tags
        })).slice(-10) // Only last 10 events for context
      }));

      const prompt = `
        Analyze the following relationship data and provide predictive analytics for EACH friend.
        Return the result as a JSON array of objects with the following schema:
        [
          {
            "friendId": "string",
            "friendName": "string",
            "forecast": "Relationship health forecast (e.g. trending up/down)",
            "interactionPattern": "Typical hanging out pattern based on event dates",
            "conflictRisk": "low" | "medium" | "high",
            "churnRisk": boolean,
            "optimalFrequency": "Recommended contact frequency",
            "lifeEventForecast": "Brief insight on potential life events based on notes",
            "communicationStyle": "Best communication channel based on patterns",
            "lifecyclePhase": "Acquaintance | Building | Maintenance | Drifting",
            "healthScore": number (0-100)
          }
        ]

        Data to analyze: ${JSON.stringify(dataToAnalyze)}
      `;

      const response = await callGroq([
        { role: 'system', content: 'You are an advanced AI relationship counselor and behavioral analyst. Analyze proximity, frequency, and sentiment to forecast relationship outcomes.' },
        { role: 'user', content: prompt }
      ], { response_format: { type: 'json_object' } });

      if (response) {
        const parsed = JSON.parse(response);
        // Handle different possible JSON structures from AI
        const predictionsArray = Array.isArray(parsed) ? parsed : (parsed.predictions || Object.values(parsed)[0]);
        if (Array.isArray(predictionsArray)) {
          setPredictions(predictionsArray);
        } else {
          throw new Error('Invalid AI response format');
        }
      }
    } catch (err) {
      console.error('Prediction Generation Error:', err);
      setError('Failed to generate forecasts. Check your AI settings.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (friendsWithEvents.length > 0 && predictions.length === 0) {
      generatePredictions();
    }
  }, [friendsWithEvents]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-blue-500';
    if (score >= 30) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getConflictBadge = (risk: string) => {
    switch (risk) {
      case 'high': return <Badge variant="destructive">High Potential Conflict</Badge>;
      case 'medium': return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Moderate Risk</Badge>;
      default: return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Stable</Badge>;
    }
  };

  if (friendsWithEvents.length === 0) {
    return (
      <Card className="p-12 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <BrainCircuit className="w-10 h-10 text-violet-500" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Insufficient Data</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Add connections and log historical data to unlock advanced predictive relationship forecasting.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-violet-500" />
            Advanced Predictive Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">AI-powered forecasts of your relationship trajectories</p>
        </div>
        <Button 
          onClick={generatePredictions} 
          disabled={isGenerating}
          variant="outline"
          className="rounded-xl border-violet-200 hover:bg-violet-50"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2 text-violet-500" />
          )}
          Refresh Forecasts
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-rose-50 border-rose-100 text-rose-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <p className="text-sm font-medium">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isGenerating && predictions.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse bg-slate-100/50 h-64 border-0" />
          ))
        ) : (
          predictions.map((p) => (
            <Card key={p.friendId} className="flex flex-col border-0 bg-white shadow-xl shadow-slate-200/50 dark:bg-slate-800 dark:shadow-none overflow-hidden hover:ring-2 hover:ring-violet-500/20 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">{p.friendName}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 mt-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      {p.lifecyclePhase} Phase
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-black ${getHealthColor(p.healthScore)}`}>
                      {p.healthScore}%
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Health</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium italic">
                    "{p.forecast}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                      <Clock className="w-3 h-3" /> Pattern
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.interactionPattern}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                      <Heart className="w-3 h-3" /> Ideal Logic
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.optimalFrequency}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                      <MessageSquare className="w-3 h-3" /> Communication
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.communicationStyle}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                      <Calendar className="w-3 h-3" /> Check-in
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.lifeEventForecast || 'Stable for now'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  {getConflictBadge(p.conflictRisk)}
                  {p.churnRisk && (
                    <Badge variant="destructive" className="animate-pulse">Churn Warning</Badge>
                  )}
                  {p.healthScore > 90 && (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600">Unbreakable Bond</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
