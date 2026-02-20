import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy } from 'lucide-react';
import { getLevelBadge } from '@/lib/gamification';
import { Button } from '@/components/ui/button';
import { Confetti } from './Confetti';

interface LevelUpCelebrationProps {
  friendName: string;
  newLevel: number;
  isOpen: boolean;
  onClose: () => void;
}

export const LevelUpCelebration = ({ friendName, newLevel, isOpen, onClose }: LevelUpCelebrationProps) => {
  const badge = getLevelBadge(newLevel);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <Confetti active={isOpen} />
          
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="card-premium relative max-w-sm w-full bg-white dark:bg-slate-800 p-8 text-center shadow-2xl overflow-hidden"
          >
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-amber-500" />
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />

            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', damping: 10 }}
              className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700/50 shadow-inner"
            >
              <Trophy className="w-12 h-12" />
            </motion.div>

            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Level Up!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Your friendship with <span className="font-bold text-violet-500">{friendName}</span> has reached new heights.
            </p>

            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="text-center">
                <div className="text-4xl font-black text-slate-800 dark:text-slate-100 leading-none">
                  {newLevel}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Level</div>
              </div>
              
              <div className="h-12 w-px bg-slate-200 dark:bg-slate-700" />

              <div className="text-center">
                <div className={`text-4xl leading-none`}>
                  {badge.icon}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${badge.color}`}>
                  {badge.title}
                </div>
              </div>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-violet-500/25 group"
            >
              Celebrate!
              <Sparkles className="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform" />
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
