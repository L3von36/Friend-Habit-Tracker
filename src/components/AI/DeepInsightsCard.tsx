
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, RefreshCw, ChevronRight, MessageSquare, Target } from 'lucide-react';
import { useDeepInsights } from '@/hooks/useDeepInsights';
import { motion, AnimatePresence } from 'framer-motion';

export function DeepInsightsCard() {
  const { insight, isLoading, refreshInsight } = useDeepInsights();

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-600/10 to-blue-600/10 dark:from-violet-900/20 dark:to-blue-900/20 backdrop-blur-xl shadow-2xl p-6">
      {/* Background Sparkle Gradients */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Friendship Focus</h3>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">Powered by Gemma</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={refreshInsight}
            disabled={isLoading}
            className="hover:bg-white/20 dark:hover:bg-slate-800/20 text-slate-600 dark:text-slate-400"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-violet-500 rounded-full blur-xl opacity-20 animate-pulse" />
                <Sparkles className="w-12 h-12 text-violet-600 relative animate-bounce" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Gemma is gathering insights...</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Reviewing your recent connections</p>
              </div>
            </motion.div>
          ) : insight ? (
            <motion.div 
              key="content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-white/20 dark:border-slate-800/20">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{insight.focus}</h4>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {insight.insight}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {insight.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-[10px] font-bold text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50">
                    #{tag}
                  </span>
                ))}
              </div>

              <Button
                className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20 rounded-xl py-6 h-auto flex justify-between items-center group"
                onClick={() => {
                  try {
                    const prompt = `Start a relationship session focused on ${insight.focus}: ${insight.insight}`;
                    const evt = new CustomEvent('start-relationship-session', { detail: { prompt } });
                    window.dispatchEvent(evt);
                  } catch (e) {
                    console.error('Failed to start relationship session', e);
                  }
                }}
                aria-label="Start Relationship Session"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-sm font-bold">Start Relationship Session</span>
                </div>
                <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <p className="text-sm text-slate-500 dark:text-slate-400">Log some interactions to see deep insights!</p>
              <Button 
                variant="outline" 
                className="mt-4 border-violet-200 dark:border-violet-800 text-violet-600"
                onClick={refreshInsight}
              >
                Analyze Now
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
