import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { Event } from '@/types';
import { AlertTriangle, CheckCircle, Clock, MessageSquare, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ConflictTrackerProps {
  events: Event[];
  onUpdateConflict: (eventId: string, status: Event['conflictStatus'], notes: string) => void;
}

export function ConflictTracker({ events, onUpdateConflict }: ConflictTrackerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const conflictEvents = events.filter(e => e.category === 'conflict');

  const getStatusIcon = (status?: Event['conflictStatus']) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'resolving':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status?: Event['conflictStatus']) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'resolving':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    }
  };

  const getStatusLabel = (status?: Event['conflictStatus']) => {
    switch (status) {
      case 'resolved':
        return 'Resolved';
      case 'resolving':
        return 'In Progress';
      default:
        return 'Unresolved';
    }
  };

  const handleStartEdit = (event: Event) => {
    setEditingId(event.id);
    setResolutionNotes(event.resolutionNotes || '');
  };

  const handleSave = (eventId: string, status: Event['conflictStatus']) => {
    onUpdateConflict(eventId, status, resolutionNotes);
    setEditingId(null);
    setResolutionNotes('');
    toast.success('Conflict status updated');
  };

  if (conflictEvents.length === 0) {
    return (
      <Card className="p-8 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0">
        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No Conflicts Logged</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          That's great! Keep nurturing positive communication.
        </p>
      </Card>
    );
  }

  const unresolved = conflictEvents.filter(e => !e.conflictStatus || e.conflictStatus === 'unresolved').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Conflict History</h3>
          <p className="text-sm text-slate-500">
            {conflictEvents.length} total • {unresolved} unresolved
          </p>
        </div>
      </div>

      {/* Conflict List */}
      <div className="space-y-3">
        {conflictEvents.map((event) => (
          <Card 
            key={event.id} 
            className={`p-4 border-l-4 ${
              event.conflictStatus === 'resolved' ? 'border-l-green-500' :
              event.conflictStatus === 'resolving' ? 'border-l-yellow-500' :
              'border-l-red-500'
            } bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getStatusIcon(event.conflictStatus)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{event.title}</span>
                    <Badge className={getStatusColor(event.conflictStatus)}>
                      {getStatusLabel(event.conflictStatus)}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{event.description}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(event.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>

                  {/* Resolution Notes */}
                  {event.resolutionNotes && editingId !== event.id && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Resolution Notes:</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{event.resolutionNotes}</p>
                    </div>
                  )}

                  {/* Edit Form */}
                  {editingId === event.id && (
                    <div className="mt-3 space-y-3">
                      <Textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Add notes about how this was resolved..."
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleSave(event.id, 'resolved')}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Resolved
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSave(event.id, 'resolving')}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          In Progress
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {editingId !== event.id && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleStartEdit(event)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Tips */}
      {unresolved > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-700 dark:text-blue-300">Conflict Resolution Tips</p>
              <ul className="text-sm text-blue-600 dark:text-blue-400 mt-2 space-y-1">
                <li>• Listen to understand, not to respond</li>
                <li>• Use "I" statements instead of "you" statements</li>
                <li>• Focus on the issue, not the person</li>
                <li>• Look for win-win solutions</li>
                <li>• Take breaks if emotions run high</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
