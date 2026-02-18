import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { Friend, Event } from '@/types';
import { calculateHealthScore } from '@/lib/healthScore';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface CompareFriendsProps {
  friends: Friend[];
  events: Event[];
  isOpen: boolean;
  onClose: () => void;
}

export function CompareFriends({ friends, events, isOpen, onClose }: CompareFriendsProps) {
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : prev.length < 3 ? [...prev, friendId] : prev
    );
  };

  const comparisonData = useMemo(() => {
    return selectedFriends.map(friendId => {
      const friend = friends.find(f => f.id === friendId);
      if (!friend) return null;

      const friendEvents = events.filter(e => e.friendId === friendId);
      const healthScore = calculateHealthScore(friend, friendEvents);

      return {
        friend,
        events: friendEvents,
        healthScore,
        positiveEvents: friendEvents.filter(e => e.sentiment === 'positive').length,
        negativeEvents: friendEvents.filter(e => e.sentiment === 'negative').length,
        totalEvents: friendEvents.length,
        topTags: getTopTags(friendEvents),
      };
    }).filter(Boolean);
  }, [selectedFriends, friends, events]);

  const radarData = useMemo(() => {
    if (comparisonData.length === 0) return [];
    
    const metrics = ['Sentiment', 'Frequency', 'Reciprocity', 'Depth'];
    return metrics.map(metric => {
      const dataPoint: Record<string, number | string> = { metric };
      comparisonData.forEach((data, i) => {
        if (data) {
          dataPoint[`friend${i}`] = data.healthScore[metric.toLowerCase() as keyof typeof data.healthScore] as number;
        }
      });
      return dataPoint;
    });
  }, [comparisonData]);

  const colors = ['#8b5cf6', '#ec4899', '#3b82f6'];

  function getTopTags(events: Event[]) {
    const tagCounts = events.flatMap(e => e.tags).reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Compare Friends
          </DialogTitle>
        </DialogHeader>

        {/* Friend Selection */}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-3">Select up to 3 friends to compare</p>
          <div className="flex flex-wrap gap-2">
            {friends.map(friend => {
              const isSelected = selectedFriends.includes(friend.id);
              return (
                <button
                  key={friend.id}
                  onClick={() => toggleFriend(friend.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
                  }`}
                >
                  <Checkbox checked={isSelected} />
                  <div className={`w-6 h-6 rounded-full ${friend.color} flex items-center justify-center text-white text-xs`}>
                    {friend.name[0]}
                  </div>
                  <span className="text-sm font-medium">{friend.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparison Results */}
        {comparisonData.length > 0 && (
          <div className="space-y-6">
            {/* Radar Chart */}
            {comparisonData.length >= 2 && (
              <Card className="p-5">
                <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-4">Health Score Comparison</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                      {comparisonData.map((data, i) => (
                        data && (
                          <Radar
                            key={data.friend.id}
                            name={data.friend.name}
                            dataKey={`friend${i}`}
                            stroke={colors[i]}
                            fill={colors[i]}
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                        )
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-3">
                  {comparisonData.map((data, i) => (
                    data && (
                      <div key={data.friend.id} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i] }} />
                        <span className="text-sm text-slate-600 dark:text-slate-400">{data.friend.name}</span>
                      </div>
                    )
                  ))}
                </div>
              </Card>
            )}

            {/* Individual Cards */}
            <div className={`grid gap-4 ${comparisonData.length === 1 ? 'grid-cols-1' : comparisonData.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {comparisonData.map((data, i) => data && (
                <Card key={data.friend.id} className="p-4" style={{ borderTop: `3px solid ${colors[i]}` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full ${data.friend.color} flex items-center justify-center text-white font-bold`}>
                      {data.friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200">{data.friend.name}</h4>
                      <p className="text-xs text-slate-500">{data.friend.relationship}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Health Score</span>
                      <span className="text-lg font-bold" style={{ color: colors[i] }}>
                        {data.healthScore.overall}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Events</span>
                      <span className="font-medium">{data.totalEvents}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Positive</span>
                      <div className="flex items-center gap-1 text-green-500">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium">{data.positiveEvents}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Negative</span>
                      <div className="flex items-center gap-1 text-red-500">
                        <TrendingDown className="w-4 h-4" />
                        <span className="font-medium">{data.negativeEvents}</span>
                      </div>
                    </div>

                    {data.topTags.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 mb-2">Top Traits</p>
                        <div className="flex flex-wrap gap-1">
                          {data.topTags.map((tag, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Summary */}
            {comparisonData.length >= 2 && (
              <Card className="p-5 bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <h4 className="font-semibold mb-3">Quick Insights</h4>
                <div className="space-y-2 text-sm">
                  {comparisonData.length === 2 && comparisonData[0] && comparisonData[1] && (
                    <>
                      <p>
                        <strong>{comparisonData[0].healthScore.overall > comparisonData[1].healthScore.overall ? comparisonData[0].friend.name : comparisonData[1].friend.name}</strong> has the healthier relationship based on your logged interactions.
                      </p>
                      <p>
                        {comparisonData[0].positiveEvents + comparisonData[1].positiveEvents > comparisonData[0].negativeEvents + comparisonData[1].negativeEvents
                          ? 'Overall, these relationships bring more positivity than negativity to your life.'
                          : 'Consider having open conversations to improve the dynamics with these friends.'
                        }
                      </p>
                    </>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {comparisonData.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Select friends above to start comparing</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
