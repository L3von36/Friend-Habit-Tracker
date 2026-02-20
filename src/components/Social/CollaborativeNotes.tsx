import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Trash2, BookOpen } from 'lucide-react';
import type { Friend } from '@/types';
import { toast } from 'sonner';
import { audioService } from '@/lib/audio';
import { generateId } from '@/lib/id';

interface Note {
  id: string;
  text: string;
  createdAt: string;
  author: string; // "me" or friend's name
}

interface CollaborativeNotesProps {
  friend: Friend;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CollaborativeNotes({ friend, userName, isOpen, onClose }: CollaborativeNotesProps) {
  const storageKey = `collab-notes-${friend.id}`;
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setNotes(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [storageKey, isOpen]);

  const save = (updated: Note[]) => {
    setNotes(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!draft.trim()) return;
    const note: Note = {
      id: generateId(),
      text: draft.trim(),
      createdAt: new Date().toISOString(),
      author: 'me',
    };
    save([...notes, note]);
    setDraft('');
    audioService.playSuccess();
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleDelete = (id: string) => {
    save(notes.filter(n => n.id !== id));
    audioService.playDelete();
    toast.success('Note deleted');
  };

  const handleExport = () => {
    const text = notes.map(n => {
      const date = new Date(n.createdAt).toLocaleString();
      return `[${date}] ${n.author === 'me' ? userName : friend.name}\n${n.text}`;
    }).join('\n\n---\n\n');
    const blob = new Blob([`Shared Notes with ${friend.name}\n${'='.repeat(40)}\n\n${text}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_${friend.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Notes exported!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-3xl border-0 bg-white dark:bg-slate-900 shadow-2xl p-0 overflow-hidden flex flex-col h-[600px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg font-bold">Shared Notes</DialogTitle>
              <p className="text-white/70 text-sm">With {friend.name}</p>
            </div>
          </div>
        </div>

        {/* Notes list */}
        <ScrollArea className="flex-1 p-4">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-600">
              <BookOpen className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No notes yet</p>
              <p className="text-xs mt-1">Add a thought, memory, or follow-up item below.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="group relative bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 font-medium uppercase tracking-wide">
                      {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3 flex-shrink-0">
          <Textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); }}}
            placeholder={`Add a note about ${friend.name}... (Enter to save)`}
            className="resize-none rounded-2xl border-slate-200 dark:border-slate-700 text-sm min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={!draft.trim()} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
              <Send className="w-4 h-4 mr-2" />
              Add Note
            </Button>
            {notes.length > 0 && (
              <Button onClick={handleExport} variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700">
                Export
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
