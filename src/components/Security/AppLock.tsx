import { useState } from 'react';
import { useSecurity } from '@/context/SecurityContext';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function AppLock() {
  const { isAuthenticated, isLockEnabled, login } = useSecurity();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  // If not enabled or already authenticated, strictly don't render
  // But usually this component sits at root and decides what to show.
  // Actually, better pattern: AppLock overlays everything if locked.
  
  if (!isLockEnabled || isAuthenticated) return null;

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (login(pin)) {
      setPin('');
      setError(false);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4">
      <div className={`w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 text-center space-y-6 ${shake ? 'animate-shake' : ''}`}>
        <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">App Locked</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Enter your PIN to access your journal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
             <Input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                className={`text-center text-2xl tracking-[0.5em] h-14 ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                maxLength={6} // Assume 4-6 digit PIN
                placeholder="••••••"
                autoFocus
             />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm flex items-center justify-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Incorrect PIN
            </p>
          )}

          <Button type="submit" className="w-full h-12 text-lg bg-violet-600 hover:bg-violet-700">
            <Unlock className="w-5 h-5 mr-2" />
            Unlock
          </Button>
        </form>
      </div>
      
      {/* CSS for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}
