import { useState, useEffect, useRef } from 'react';
import { mediaStorage, type MediaItem } from '@/lib/mediaStorage';
import { Loader2, Play, Pause, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { audioService } from '@/lib/audio';

interface MediaGalleryProps {
  mediaIds: string[];
  onDelete?: (id: string) => void;
  readonly?: boolean;
}

export function MediaGallery({ mediaIds, onDelete, readonly = false }: MediaGalleryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMedia = async () => {
      setLoading(true);
      const loadedItems: MediaItem[] = [];
      for (const id of mediaIds) {
        if (!id) continue;
        const item = await mediaStorage.getMedia(id);
        if (item) loadedItems.push(item);
      }
      setItems(loadedItems);
      setLoading(false);
    };

    if (mediaIds.length > 0) {
      loadMedia();
    } else {
        setItems([]);
        setLoading(false);
    }
  }, [mediaIds]);

  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>;
  }

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
      {items.map(item => (
        <MediaItemCard key={item.id} item={item} onDelete={onDelete && !readonly ? () => onDelete(item.id) : undefined} />
      ))}
    </div>
  );
}

function MediaItemCard({ item, onDelete }: { item: MediaItem; onDelete?: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (item.type === 'image') {
    return (
      <div className="group relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <Dialog>
           <DialogTrigger asChild>
             <img 
               src={item.url} 
               alt="Attachment" 
               className="w-full h-full object-cover cursor-zoom-in transition-transform hover:scale-105" 
             />
           </DialogTrigger>
           <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none flex flex-col items-center justify-center">
             <img src={item.url} alt="Full size" className="w-full h-full max-h-[85vh] object-contain" />
             {onDelete && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="absolute bottom-4 right-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    // Close dialog logic would be needed here, but standard dialog doesn't expose it easily without controlled state to parent.
                    // For now, let's rely on the card delete button which we will make visible on mobile.
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Photo
                </Button>
             )}
           </DialogContent>
        </Dialog>
        
        {onDelete && (
          <button 
             onClick={(e) => { 
                e.stopPropagation(); 
                audioService.playDelete();
                onDelete(); 
             }}
             className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
             <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // Audio item
  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 flex flex-col items-center justify-center p-2">
       <audio 
         ref={audioRef} 
         src={item.url} 
         onEnded={() => setIsPlaying(false)} 
         className="hidden" 
       />
       <Button 
         variant="ghost" 
         size="icon" 
         className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-800 text-violet-600 dark:text-violet-300 hover:scale-110 transition-transform"
         onClick={toggleAudio}
       >
         {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
       </Button>
       
       <span className="text-xs text-violet-500 mt-2 font-medium">Voice Memo</span>

       {onDelete && (
          <button 
             onClick={(e) => { 
                e.stopPropagation(); 
                audioService.playDelete();
                onDelete(); 
             }}
             className="absolute top-1 right-1 p-1 bg-black/10 hover:bg-red-500 hover:text-white text-slate-500 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
             <Trash2 className="w-3 h-3" />
          </button>
        )}
    </div>
  );
}
