import { useState } from "react";
import { Button } from "@/components/ui/button";
import { audioService } from "@/lib/audio";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Users, Wand2, Mic } from "lucide-react";
import { AudioRecorder } from "./Media/AudioRecorder";
import { PhotoUpload } from "./Media/PhotoUpload";
import { MediaGallery } from "./Media/MediaGallery";
import type { Event, Friend } from "@/types";
import { CATEGORIES, SENTIMENTS, COMMON_TAGS, ENERGY_IMPACTS } from "@/types";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { parseEventDictation } from "@/lib/intelligence";
import { getGroqApiKey } from "@/lib/groq";
import { toast } from "sonner";

interface AddEventFormProps {
  friendId: string;
  friends: Friend[];
  onSubmit: (event: Omit<Event, "id">) => void;
  onCancel: () => void;
}

export function AddEventForm({
  friendId,
  friends,
  onSubmit,
  onCancel,
}: AddEventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<Event["category"]>("behavior");
  const [sentiment, setSentiment] = useState<Event["sentiment"]>("neutral");
  const [importance, setImportance] = useState<Event["importance"]>(3);
  const [energyImpact, setEnergyImpact] =
    useState<Event["energyImpact"]>("neutral");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);

  const { isListening, toggleListening, stopListening } = useSpeechRecognition({
    onResult: async (transcript) => {
      stopListening();
      if (!getGroqApiKey()) {
        toast.error(
          "Groq API Key required for AI Voice Parsing. Please add it in settings.",
        );
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
        return;
      }

      setIsAnalyzingVoice(true);
      toast.info("AI is analyzing your dictation...");

      const parsed = await parseEventDictation(transcript);
      setIsAnalyzingVoice(false);

      if (parsed) {
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.category && CATEGORIES[parsed.category])
          setCategory(parsed.category);
        if (parsed.sentiment && SENTIMENTS[parsed.sentiment])
          setSentiment(parsed.sentiment);
        if (parsed.tags && Array.isArray(parsed.tags)) {
          setTags((prev) => {
            const newTags = new Set([...prev, ...parsed.tags!]);
            return Array.from(newTags);
          });
        }
        toast.success("Event auto-filled by AI!");
      } else {
        toast.error("Failed to parse dictation into an event.");
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    },
  });

  const handleMediaSaved = (mediaId: string) => {
    setAttachments((prev) => [...prev, mediaId]);
  };

  const handleMediaDeleted = (mediaId: string) => {
    setAttachments((prev) => prev.filter((id) => id !== mediaId));
    // Ideally we should also delete from IndexedDB here, or mark for deletion
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      friendId,
      title: title.trim(),
      description: description.trim(),
      date,
      category,
      sentiment,
      importance,
      energyImpact,
      tags,
      participantIds:
        participantIds.length > 0 ? [...participantIds, friendId] : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const addCommonTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Voice Dictation Banner */}
    </form>
  );
}
