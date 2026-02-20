import { Progress } from '@/components/ui/progress';
import { getLevel, getLevelBadge, getLevelProgress } from '@/lib/gamification';

interface LevelBadgeProps {
  xp: number;
}

export function LevelBadge({ xp }: LevelBadgeProps) {
  const level = getLevel(xp || 0);
  const { percent } = getLevelProgress(xp || 0);
  const badge = getLevelBadge(level);

  return (
    <div className="flex flex-col gap-1 w-full max-w-[130px]">
      <div className="flex items-center justify-between text-[10px] mb-0.5">
        <span className="font-bold text-slate-500 uppercase tracking-tighter">Lvl {level}</span>
        <span className="text-slate-400 font-mono">{percent}%</span>
      </div>
      <Progress value={percent} className="h-1.5" indicatorClassName="bg-gradient-to-r from-violet-500 to-purple-600 shadow-[0_0_8px_rgba(139,92,246,0.3)]" />
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-xs">{badge.icon}</span>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${badge.color} truncate`}>
          {badge.title}
        </span>
      </div>
    </div>
  );
}
