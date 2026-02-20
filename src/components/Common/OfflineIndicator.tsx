import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-slate-900/90 text-white backdrop-blur shadow-xl border border-white/10 flex items-center gap-3 pointer-events-none"
        >
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <WifiOff className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-none">Working Offline</span>
            <span className="text-[10px] opacity-70 leading-none mt-1">Changes cached localy</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
