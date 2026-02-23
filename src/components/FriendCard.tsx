import { useState } from "react";
import type { Friend } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  MoreHorizontal,
  Trash2,
  Flame,
  Share2,
  Pin,
} from "lucide-react";
import { LevelBadge } from "./Gamification/LevelBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { audioService } from "@/lib/audio";
import { generatePsychologicalProfile } from "@/lib/profiling";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo } from "react";
import type { Event, Memory } from "@/types";

interface FriendCardProps {
  friend: Friend;
  eventCount: number;
  onClick: () => void;
  onDelete: () => void;
  onShare?: () => void;
  isPinned?: boolean;
  onPin?: () => void;
  index?: number;
  events?: Event[];
  memories?: Memory[];
}

export function FriendCard({
  friend,
  eventCount,
  onClick,
  onDelete,
  onShare,
  isPinned,
  onPin,
  index = 0,
  events = [],
  memories = [],
}: FriendCardProps) {
  const initials = friend.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = ((e.clientX - cx) / rect.width) * 10;
    const y = ((e.clientY - cy) / rect.height) * -10;
    setTilt({ x, y });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  const profile = useMemo(
    () => generatePsychologicalProfile(friend, events, memories),
    [friend, events, memories],
  );

  return (
    <Card
      className="card-premium item-enter group relative p-4 sm:p-5 cursor-pointer hover:shadow-2xl hover:shadow-violet-500/15 transition-all duration-300 border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm"
      style={{
        transform: `perspective(600px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(${tilt.x || tilt.y ? 1.02 : 1})`,
        transition:
          tilt.x || tilt.y
            ? "transform 0.05s linear"
            : "transform 0.35s cubic-bezier(.22,1,.36,1)",
        animationDelay: `${Math.min(index * 0.04, 0.36)}s`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("friendId", friend.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => {
        audioService.playClick();
        onClick();
      }}
    >
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
        {onPin && (
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full ${isPinned ? "text-amber-500 bg-amber-50 dark:bg-amber-900/30" : "text-slate-400"}`}
            onClick={(e) => {
              e.stopPropagation();
              audioService.playClick();
              onPin();
            }}
          >
            <Pin className={`w-4 h-4 ${isPinned ? "fill-amber-500" : ""}`} />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onShare && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  audioService.playClick();
                  onShare();
                }}
              >
                <Share2 className="w-4 h-4 mr-2 text-violet-500" />
                Share Profile
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                audioService.playDelete();
                onDelete();
              }}
              className="text-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-start gap-4 mb-3">
        <div className="relative flex-shrink-0">
          <div
            className={`w-14 h-14 rounded-xl ${friend.color} flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform group-hover:scale-110 duration-300`}
          >
            {initials}
          </div>
          {(friend.streak || 0) > 0 && (
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm border border-orange-100 dark:border-slate-700">
              <div
                className="flex items-center justify-center min-w-[20px] h-5 px-1 bg-orange-100 dark:bg-orange-900/50 rounded-full gap-0.5"
                title={`${friend.streak} week streak!`}
              >
                <Flame className="w-2.5 h-2.5 text-orange-500 fill-orange-500 animate-pulse" />
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                  {friend.streak}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div>
            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 truncate leading-none">
              {friend.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {friend.relationship}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full">
            <LevelBadge xp={friend.xp} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 cursor-help transform group-hover:scale-110 transition-transform`}
                  >
                    <span className="text-xs">{profile.archetypeIcon}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  <p className="font-bold">{profile.archetype}</p>
                  <p className="opacity-80">{profile.archetypeDescription}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {friend.traits.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {friend.traits.slice(0, 3).map((trait, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors group-hover:bg-violet-50 group-hover:text-violet-700 dark:group-hover:bg-violet-900/20 dark:group-hover:text-violet-300"
            >
              {trait}
            </Badge>
          ))}
          {friend.traits.length > 3 && (
            <Badge
              variant="secondary"
              className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              +{friend.traits.length - 3}
            </Badge>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Activity className="w-4 h-4" />
          <span>{eventCount} events</span>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Since{" "}
          {new Date(friend.createdAt).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </Card>
  );
}
