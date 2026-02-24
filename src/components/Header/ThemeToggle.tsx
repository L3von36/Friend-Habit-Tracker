import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sun, Moon, Zap, Minus, Rocket, 
  ChevronDown, Check 
} from 'lucide-react';
import { LoomLogo } from '../Common/LoomLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = 'light' | 'dark' | 'vibrant' | 'minimalist' | 'retro' | 'loom';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme;
      if (stored) return stored;
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all theme-related classes and attributes
    root.classList.remove('dark');
    root.removeAttribute('data-theme');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme !== 'light') {
      // For multi-themes, use data-theme attribute
      root.setAttribute('data-theme', theme);
      // Optional: some shadcn components might still rely on .dark class
      // for some styles, but we want to be clean. 
      // Retro also likely needs .dark background logic
      if (theme === 'retro') root.classList.add('dark');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const themes: { id: Theme; label: string; icon: any; color: string }[] = [
    { id: 'light', label: 'Light', icon: Sun, color: 'text-amber-500' },
    { id: 'dark', label: 'Dark', icon: Moon, color: 'text-indigo-400' },
    { id: 'vibrant', label: 'Vibrant', icon: Zap, color: 'text-violet-500' },
    { id: 'minimalist', label: 'Minimalist', icon: Minus, color: 'text-slate-500' },
    { id: 'retro', label: 'Retro', icon: Rocket, color: 'text-pink-500' },
    { id: 'loom', label: 'Loom', icon: LoomLogo, color: 'text-indigo-600' },
  ];

  const activeTheme = themes.find(t => t.id === theme) || themes[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 px-3 gap-2 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          <activeTheme.icon className={`h-4 w-4 ${activeTheme.color}`} />
          <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">{activeTheme.label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-2xl">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
              theme === t.id 
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <t.icon className={`h-4 w-4 ${t.color}`} />
              <span className="text-sm font-medium">{t.label}</span>
            </div>
            {theme === t.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
