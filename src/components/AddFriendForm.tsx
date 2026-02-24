import { useState } from "react";
import { Button } from "@/components/ui/button";
import { audioService } from "@/lib/audio";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Calendar, Camera } from "lucide-react";
import type { Friend } from "@/types";
import { COMMON_TAGS, RELATIONSHIP_TYPES } from "@/types";

interface AddFriendFormProps {
  onSubmit: (friend: Friend | Omit<Friend, "id" | "createdAt">) => void;
  onCancel: () => void;
  initialData?: Friend | null;
  isEditing?: boolean;
}

export function AddFriendForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing,
}: AddFriendFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [relationship, setRelationship] = useState(
    initialData?.relationship || "",
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [traits, setTraits] = useState<string[]>(initialData?.traits || []);
  const [avatar, setAvatar] = useState<string | undefined>(initialData?.avatar);
  const [metVia, setMetVia] = useState(initialData?.metVia || "");
  const [coreValue, setCoreValue] = useState(initialData?.coreValue || "");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && initialData) {
      onSubmit({
        ...initialData,
        name: name.trim(),
        relationship: relationship.trim(),
        notes: notes.trim(),
        traits,
        birthday: birthday || undefined,
        avatar,
        metVia: metVia.trim(),
        coreValue: coreValue.trim(),
        giftIdeas: initialData.giftIdeas || [],
        interests: initialData.interests || [],
      });
    } else {
      onSubmit({
        name: name.trim(),
        relationship: relationship.trim(),
        notes: notes.trim(),
        traits,
        birthday: birthday || undefined,
        avatar,
        metVia: metVia.trim(),
        coreValue: coreValue.trim(),
        giftIdeas: [],
        interests: [],
        xp: 0,
        level: 1,
        streak: 0,
        color: 'bg-indigo-500', // Default to Loom Indigo
      });
    }
  };

  const addTrait = () => {
    if (newTrait.trim() && !traits.includes(newTrait.trim())) {
      setTraits([...traits, newTrait.trim()]);
      setNewTrait("");
    }
  };

  const removeTrait = (trait: string) => {
    setTraits(traits.filter((t) => t !== trait));
  };

  const addCommonTag = (tag: string) => {
    if (!traits.includes(tag)) {
      setTraits([...traits, tag]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative group shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden transition-all group-hover:border-violet-500">
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-6 h-6 text-slate-400 group-hover:text-violet-500" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              title="Upload photo"
            />
          </div>
          {avatar && (
            <button
              type="button"
              onClick={() => setAvatar(undefined)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:scale-110 transition-transform"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex-1 w-full space-y-1 sm:space-y-2">
          <Label
            htmlFor="name"
            className="text-sm font-semibold text-slate-500 dark:text-slate-400"
          >
            Name *
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            required
            className="h-10 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <Label
            htmlFor="relationship"
            className="text-sm font-semibold text-slate-500 dark:text-slate-400"
          >
            Type
          </Label>
          <select
            id="relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full h-10 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Select</option>
            {RELATIONSHIP_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <Label
            htmlFor="birthday"
            className="text-sm font-semibold text-slate-500 dark:text-slate-400"
          >
            Birthday
          </Label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="pl-8 h-10 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="metVia" className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Met Via / First Impression
          </Label>
          <Input
            id="metVia"
            value={metVia}
            onChange={(e) => setMetVia(e.target.value)}
            placeholder="e.g. Art school, Mutual friend..."
            className="h-10 text-sm"
          />
        </div>
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="coreValue" className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Core Value
          </Label>
          <Input
            id="coreValue"
            value={coreValue}
            onChange={(e) => setCoreValue(e.target.value)}
            placeholder="What you value most..."
            className="h-10 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="notes" className="text-sm">
          Notes
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="General notes..."
          rows={2}
          className="min-h-[80px] text-sm resize-none"
        />
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <Label className="text-sm">Traits</Label>
        <div className="flex gap-2">
          <Input
            value={newTrait}
            onChange={(e) => setNewTrait(e.target.value)}
            placeholder="Add a trait..."
            className="h-10 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTrait();
              }
            }}
          />
          <Button
            type="button"
            onClick={addTrait}
            variant="outline"
            className="h-9 w-9 sm:h-10 sm:w-10 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Common tags */}
        <div className="mt-1.5">
          <p className="text-[10px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">
            Suggested Traits:
          </p>
          <div className="flex flex-wrap gap-1">
            {COMMON_TAGS.filter((tag) => !traits.includes(tag))
              .slice(0, 6)
              .map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    audioService.playClick();
                    addCommonTag(tag);
                  }}
                  className="px-2 py-0.5 text-[10px] rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-300 transition-colors border border-transparent hover:border-violet-200"
                >
                  {tag}
                </button>
              ))}
          </div>
        </div>

        {/* Selected traits */}
        {traits.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {traits.map((trait) => (
              <Badge
                key={trait}
                variant="secondary"
                className="bg-violet-100/50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs py-0 px-2 h-6"
              >
                {trait}
                <button
                  type="button"
                  onClick={() => {
                    audioService.playDelete();
                    removeTrait(trait);
                  }}
                  className="ml-1.5 hover:text-red-500 opacity-60 hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white"
          disabled={!name.trim()}
        >
          {isEditing ? "Update Connection" : "Add Connection"}
        </Button>
      </div>
    </form>
  );
}
