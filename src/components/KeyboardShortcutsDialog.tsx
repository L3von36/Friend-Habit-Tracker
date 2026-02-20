import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';
import { SHORTCUT_LABELS } from '@/hooks/useKeyboardShortcuts';

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        title="Keyboard Shortcuts (?)"
        className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
        onClick={() => setOpen(true)}
      >
        <Keyboard className="w-5 h-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-0 bg-white dark:bg-slate-900 shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6">
            <div className="flex items-center gap-3">
              <Keyboard className="w-5 h-5 text-white" />
              <DialogTitle className="text-white text-lg font-bold">Keyboard Shortcuts</DialogTitle>
            </div>
          </div>
          <div className="p-5 space-y-2">
            {Object.entries(SHORTCUT_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm min-w-[2rem] text-center">
                  {key === 'Escape' ? 'Esc' : key}
                </kbd>
              </div>
            ))}
            <p className="text-xs text-slate-400 text-center pt-2">Shortcuts are disabled when typing in inputs.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
