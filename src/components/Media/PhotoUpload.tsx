import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, Loader2 } from 'lucide-react';
import { mediaStorage } from '@/lib/mediaStorage';
import { audioService } from '@/lib/audio';
import { toast } from 'sonner';

interface PhotoUploadProps {
  onSave: (mediaId: string) => void;
  relatedId?: string;
}

export function PhotoUpload({ onSave, relatedId }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (optional but good practice)
    if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit check (though IDB can handle more)
        toast.error('Image is too large (max 5MB)');
        return;
    }

    setIsUploading(true);
    try {
      const id = await mediaStorage.saveMedia(file, 'image', relatedId);
      onSave(id);
      audioService.playSuccess();
      toast.success('Photo attached!');
    } catch (error) {
      console.error('Failed to save photo:', error);
      toast.error('Failed to save photo');
    }
    setIsUploading(false);
    
    // Reset input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-2" />}
        Attach Photo
      </Button>
    </>
  );
}
