import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2, Check, Loader2 } from 'lucide-react';
import { mediaStorage } from '@/lib/mediaStorage';
import { audioService } from '@/lib/audio';
import { toast } from 'sonner';

interface AudioRecorderProps {
  onSave: (mediaId: string) => void;
  relatedId?: string; // If we already know the event ID (rare for new events)
}

export function AudioRecorder({ onSave, relatedId }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | 'unknown'>('unknown');

  const [isSupported, setIsSupported] = useState(true);
  const [supportError, setSupportError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        setIsSupported(false);
        const isSecure = window.isSecureContext;
        setSupportError(
          !isSecure 
            ? "Microphone access requires a secure context (HTTPS or localhost). Please access the app securely."
            : "Your browser does not support audio recording."
        );
        return;
      }

      // Check permission state if supported
      if (navigator.permissions && (navigator.permissions as any).query) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionState(result.state);
          result.onchange = () => {
            setPermissionState(result.state);
          };
        } catch (e) {
          console.warn('Permissions API error:', e);
        }
      }
    };
    checkSupport();
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    if (!isSupported) {
      toast.error(supportError || 'Recording not supported');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionState('granted');
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Microphone permission denied. Please allow access in browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error('No microphone found on this device.');
      } else if (!window.isSecureContext) {
        toast.error('Microphone access requires a secure context (HTTPS or localhost).');
      } else {
        toast.error('Could not access microphone');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const discardRecording = () => {
    audioService.playDelete();
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
  };

  const saveRecording = async () => {
    if (!audioBlob) return;
    setIsSaving(true);
    try {
      const id = await mediaStorage.saveMedia(audioBlob, 'audio', relatedId);
      onSave(id);
      audioService.playSuccess();
      discardRecording();
      toast.success('Voice memo saved!');
    } catch (error) {
      console.error('Failed to save audio:', error);
      toast.error('Failed to save recording');
    }
    setIsSaving(false);
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current || !audioUrl) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioBlob) {
    return (
      <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-10 w-10 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-full hover:bg-violet-200"
          onClick={togglePlayback}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </Button>
        
        <audio 
           ref={audioPlayerRef} 
           src={audioUrl!} 
           onEnded={() => setIsPlaying(false)} 
           className="hidden" 
        />
        
        <div className="flex-1">
          <div className="h-4 flex items-center gap-0.5">
             {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-violet-500 rounded-full animate-pulse"
                  style={{ 
                    height: isPlaying ? `${Math.random() * 100}%` : '20%',
                    animationDelay: `${i * 0.1}s`,
                    opacity: isPlaying ? 1 : 0.3
                  }} 
                />
             ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">{formatDuration(duration)}</p>
        </div>

        <div className="flex gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={discardRecording}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            disabled={isSaving}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={saveRecording}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Permission Guidance */}
      {!isRecording && !audioBlob && isSupported && permissionState === 'denied' && (
        <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-start gap-2">
            <Trash2 className="w-3.5 h-3.5 mt-0.5" />
            Microphone access is blocked. Please enable it in your browser settings to record voice memos.
          </p>
        </div>
      )}

      {/* Action Area */}
      <div className="flex items-center gap-3">
        {!isRecording && !audioBlob && isSupported && (permissionState === 'prompt' || permissionState === 'unknown') ? (
          <Button
            type="button"
            variant="outline"
            onClick={startRecording}
            className="border-violet-200 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-violet-600 group"
          >
            <Mic className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            Enable Microphone
          </Button>
        ) : (
          <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isSupported}
            className={`relative transition-all ${isRecording ? 'animate-pulse' : ''} ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 mr-2 fill-current" />
                Stop ({formatDuration(duration)})
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                {audioBlob ? 'Record New Memo' : 'Record Voice Memo'}
              </>
            )}
          </Button>
        )}
        {isRecording && <span className="text-xs text-red-500 animate-pulse">Recording...</span>}
      </div>

      {/* Support Error */}
      {!isSupported && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
          {supportError}
        </p>
      )}
    </div>
  );
}
