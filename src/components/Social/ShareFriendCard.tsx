import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Download, Share2, ExternalLink } from 'lucide-react';
import type { Friend, Event } from '@/types';
import { toast } from 'sonner';
import { audioService } from '@/lib/audio';

interface ShareFriendCardProps {
  friend: Friend;
  events: Event[];
  isOpen: boolean;
  onClose: () => void;
}

function generateShareHTML(friend: Friend, events: Event[]): string {
  const positiveEvents = events.filter(e => e.sentiment === 'positive').length;
  const totalEvents = events.length;
  const initials = friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colorMap: Record<string, string> = {
    'bg-violet-500': '#8b5cf6', 'bg-blue-500': '#3b82f6',
    'bg-emerald-500': '#10b981', 'bg-rose-500': '#f43f5e',
    'bg-amber-500': '#f59e0b', 'bg-cyan-500': '#06b6d4',
    'bg-pink-500': '#ec4899', 'bg-indigo-500': '#6366f1',
  };
  const color = colorMap[friend.color] || '#8b5cf6';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${friend.name} – Relationship Profile</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg,#1e1b4b,#312e81); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; }
    .card { background: rgba(255,255,255,0.08); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.15); border-radius: 24px; padding: 40px; max-width: 480px; width: 100%; color: white; }
    .avatar { width: 72px; height: 72px; border-radius: 18px; background: ${color}; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; margin-bottom: 16px; }
    h1 { margin: 0 0 4px; font-size: 28px; font-weight: 800; }
    .sub { color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 24px; }
    .stats { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 16px; flex: 1; }
    .stat-v { font-size: 22px; font-weight: 800; }
    .stat-l { font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: .08em; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 10px; }
    .badges { display: flex; flex-wrap: wrap; gap: 8px; }
    .badge { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 4px 12px; font-size: 13px; }
    .footer { margin-top: 28px; text-align: center; font-size: 11px; color: rgba(255,255,255,0.3); }
  </style>
</head>
<body>
  <div class="card">
    <div class="avatar">${initials}</div>
    <h1>${friend.name}</h1>
    <p class="sub">${friend.relationship}${friend.birthday ? ' · 🎂 ' + new Date(friend.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : ''}</p>
    <div class="stats">
      <div class="stat"><div class="stat-v">${totalEvents}</div><div class="stat-l">Memories</div></div>
      <div class="stat"><div class="stat-v">${positiveEvents}</div><div class="stat-l">Positive</div></div>
      <div class="stat"><div class="stat-v">${friend.streak || 0}w</div><div class="stat-l">Streak</div></div>
    </div>
    ${friend.traits.length ? `<div class="section"><div class="section-title">Traits</div><div class="badges">${friend.traits.map(t => `<span class="badge">${t}</span>`).join('')}</div></div>` : ''}
    ${friend.interests.length ? `<div class="section"><div class="section-title">Interests</div><div class="badges">${friend.interests.map(t => `<span class="badge">${t}</span>`).join('')}</div></div>` : ''}
    <div class="footer">Generated with FriendTracker</div>
  </div>
</body>
</html>`;
}

export function ShareFriendCard({ friend, events, isOpen, onClose }: ShareFriendCardProps) {
  const [copied, setCopied] = useState(false);
  const friendEvents = events.filter(e => e.friendId === friend.id);
  const html = generateShareHTML(friend, friendEvents);
  const initials = friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleCopyLink = async () => {
    try {
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
      await navigator.clipboard.writeText(dataUrl);
      setCopied(true);
      audioService.playSuccess();
      toast.success('Profile link copied! Paste into a browser to share.');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Copy failed – try Download instead.');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${friend.name.replace(/\s+/g, '_')}_profile.html`;
    a.click();
    URL.revokeObjectURL(url);
    audioService.playSuccess();
    toast.success('Profile card downloaded!');
  };

  const handlePreview = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const colorMap: Record<string, string> = {
    'bg-violet-500': 'from-violet-600 to-purple-700',
    'bg-blue-500': 'from-blue-600 to-indigo-700',
    'bg-emerald-500': 'from-emerald-600 to-teal-700',
    'bg-rose-500': 'from-rose-600 to-pink-700',
    'bg-amber-500': 'from-amber-500 to-orange-600',
    'bg-cyan-500': 'from-cyan-500 to-blue-600',
    'bg-pink-500': 'from-pink-500 to-rose-600',
    'bg-indigo-500': 'from-indigo-500 to-violet-600',
  };
  const gradient = colorMap[friend.color] || 'from-violet-600 to-purple-700';
  const positiveCount = friendEvents.filter(e => e.sentiment === 'positive').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl border-0 bg-white dark:bg-slate-900 shadow-2xl p-0 overflow-hidden">
        {/* Preview card */}
        <div className={`bg-gradient-to-br ${gradient} p-8 text-white`}>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-black shadow-lg flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black">{friend.name}</h2>
              <p className="text-white/70 text-sm mt-0.5">{friend.relationship}</p>
              <div className="flex gap-3 mt-3">
                <div className="text-center"><div className="text-xl font-bold">{friendEvents.length}</div><div className="text-[10px] text-white/50 uppercase tracking-wide">Memories</div></div>
                <div className="text-center"><div className="text-xl font-bold">{positiveCount}</div><div className="text-[10px] text-white/50 uppercase tracking-wide">Positive</div></div>
                <div className="text-center"><div className="text-xl font-bold">{friend.streak || 0}w</div><div className="text-[10px] text-white/50 uppercase tracking-wide">Streak</div></div>
              </div>
            </div>
          </div>
          {friend.traits.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {friend.traits.slice(0, 5).map((t, i) => (
                <span key={i} className="bg-white/15 border border-white/20 rounded-full px-3 py-0.5 text-xs font-medium">{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100">Share Profile Card</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Share a beautiful read-only snapshot of {friend.name}'s profile — no account needed to view it.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={handleCopyLink} variant="outline" className="flex-col h-auto py-3 rounded-2xl gap-1 border-slate-200 dark:border-slate-700">
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              <span className="text-xs">{copied ? 'Copied!' : 'Copy Link'}</span>
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex-col h-auto py-3 rounded-2xl gap-1 border-slate-200 dark:border-slate-700">
              <Download className="w-5 h-5" />
              <span className="text-xs">Download</span>
            </Button>
            <Button onClick={handlePreview} variant="outline" className="flex-col h-auto py-3 rounded-2xl gap-1 border-slate-200 dark:border-slate-700">
              <ExternalLink className="w-5 h-5" />
              <span className="text-xs">Preview</span>
            </Button>
          </div>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button onClick={async () => {
              try {
                await (navigator as any).share({ title: `${friend.name}'s Profile`, text: `Check out ${friend.name}'s friendship profile!` });
              } catch { /* user cancelled */ }
            }} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl">
              <Share2 className="w-4 h-4 mr-2" />
              Share via System Dialog
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
