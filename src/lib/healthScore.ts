import type { Friend, Event, HealthScore } from '@/types';

export function calculateHealthScore(_friend: Friend, events: Event[]): HealthScore {
  if (events.length === 0) {
    return {
      overall: 50,
      sentiment: 50,
      frequency: 50,
      reciprocity: 50,
      depth: 50,
      energy: 50,
      trend: 'stable',
    };
  }

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Sentiment Score (0-100)
  const positiveCount = events.filter(e => e.sentiment === 'positive').length;
  const negativeCount = events.filter(e => e.sentiment === 'negative').length;
  const sentimentScore = Math.round(
    ((positiveCount - negativeCount * 0.5) / events.length) * 100 + 50
  );

  // Frequency Score (0-100) - based on events per month
  const firstEvent = new Date(sortedEvents[0].date);
  const lastEvent = new Date(sortedEvents[sortedEvents.length - 1].date);
  const monthsDiff = Math.max(1, 
    (lastEvent.getFullYear() - firstEvent.getFullYear()) * 12 + 
    (lastEvent.getMonth() - firstEvent.getMonth())
  );
  const eventsPerMonth = events.length / monthsDiff;
  const frequencyScore = Math.min(100, Math.round(eventsPerMonth * 20)); // 5 events/month = 100

  // Reciprocity Score (0-100) - based on interaction balance
  const interactionEvents = events.filter(e => e.category === 'interaction');
  const reciprocityScore = interactionEvents.length > 0
    ? Math.round((interactionEvents.filter(e => e.sentiment === 'positive').length / interactionEvents.length) * 100)
    : 50;

  // Depth Score (0-100) - based on importance and description length
  const avgImportance = events.reduce((sum, e) => sum + e.importance, 0) / events.length;
  const depthScore = Math.round((avgImportance / 5) * 100);

  // Energy Score (0-100) - based on energy impact
  const energizingCount = events.filter(e => e.energyImpact === 'gives').length;
  const drainingCount = events.filter(e => e.energyImpact === 'takes').length;
  const energyScore = Math.round(
    ((energizingCount - drainingCount * 0.5) / events.length) * 100 + 50
  );

  // Overall Score (weighted average)
  const overall = Math.round(
    sentimentScore * 0.30 +
    frequencyScore * 0.20 +
    reciprocityScore * 0.15 +
    depthScore * 0.15 +
    energyScore * 0.20
  );

  // Trend calculation
  const recentEvents = sortedEvents.slice(-5);
  const olderEvents = sortedEvents.slice(0, Math.max(1, sortedEvents.length - 5));
  
  const recentSentiment = recentEvents.filter(e => e.sentiment === 'positive').length / recentEvents.length;
  const olderSentiment = olderEvents.filter(e => e.sentiment === 'positive').length / olderEvents.length;
  
  let trend: HealthScore['trend'] = 'stable';
  if (recentSentiment > olderSentiment + 0.1) trend = 'up';
  else if (recentSentiment < olderSentiment - 0.1) trend = 'down';

  return {
    overall: Math.max(0, Math.min(100, overall)),
    sentiment: Math.max(0, Math.min(100, sentimentScore)),
    frequency: Math.max(0, Math.min(100, frequencyScore)),
    reciprocity: Math.max(0, Math.min(100, reciprocityScore)),
    depth: Math.max(0, Math.min(100, depthScore)),
    energy: Math.max(0, Math.min(100, energyScore)),
    trend,
  };
}

export function getHealthColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

export function getHealthBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getHealthLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Attention';
}
