import { useState, useEffect } from 'react';
import type { UserProfile as UserProfileType } from '@/types';
import { User, Sparkles, LogOut, LogIn } from 'lucide-react';
import { audioService } from '@/lib/audio';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserProfileProps {
  userProfile: UserProfileType;
  onOpenProfile: () => void;
  onLogout: () => void;
  isGuest?: boolean;
}

export function UserProfile({ userProfile, onOpenProfile, onLogout, isGuest }: UserProfileProps) {
  const [greeting, setGreeting] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-4 sm:border-l border-slate-200 dark:border-slate-700 ml-0.5 sm:ml-2">
      <div className="hidden md:block text-right">
        <p className="text-[10px] uppercase tracking-tighter font-bold text-slate-400 dark:text-slate-500">
          {isGuest ? 'Browse Mode' : greeting}
        </p>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {userProfile.name}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            className="relative group focus:outline-none"
            title="User Settings"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-[2px] shadow-lg transition-transform hover:scale-105 active:scale-95">
              <div className="w-full h-full rounded-[10px] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                {userProfile.avatar && !imageError ? (
                  <img 
                    src={userProfile.avatar} 
                    alt={userProfile.name} 
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <User className="w-5 h-5 text-violet-500" />
                )}
              </div>
            </div>
            {!isGuest && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-white" />
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl border-slate-200 dark:border-slate-800 p-2 shadow-2xl">
          <DropdownMenuLabel className="font-bold text-slate-800 dark:text-slate-100 px-3 py-2">
            My Account
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
          <DropdownMenuItem 
            onClick={() => {
              audioService.playClick();
              onOpenProfile();
            }}
            className="rounded-xl focus:bg-violet-50 dark:focus:bg-violet-900/20 focus:text-violet-600 dark:focus:text-violet-400 cursor-pointer px-3 py-2.5"
          >
            <User className="w-4 h-4 mr-2" />
            Profile Dashboard
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
          {isGuest ? (
            <DropdownMenuItem 
              onClick={() => {
                audioService.playClick();
                window.location.reload(); // Simplest way to go back to landing page to sign in
              }}
              className="rounded-xl focus:bg-violet-50 dark:focus:bg-violet-900/20 focus:text-violet-600 dark:focus:text-violet-400 cursor-pointer px-3 py-2.5 font-bold"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In with Google
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              onClick={() => {
                audioService.playDelete();
                onLogout();
              }}
              className="rounded-xl focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-600 dark:focus:text-red-400 cursor-pointer px-3 py-2.5"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
