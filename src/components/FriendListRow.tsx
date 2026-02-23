import type { Friend } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Trash2,
  Activity,
  Calendar,
  Zap,
  Pin,
  Flame,
} from "lucide-react";
import { audioService } from "@/lib/audio";
import { LevelBadge } from "./Gamification/LevelBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FriendListRowProps {
  friend: Friend;
  eventCount: number;
  lastEventDate?: string;
  onClick: () => void;
  onDelete: () => void;
  onLogEvent: () => void;
  isPinned?: boolean;
  onPin?: () => void;
}

export function FriendListRow({
  friend,
  eventCount,
  lastEventDate,
  onClick,
  onDelete,
  onLogEvent,
  isPinned,
  onPin,
}: FriendListRowProps) {
  const initials = friend.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      onClick={() => {
        audioService.playClick();
        onClick();
      }}
      className="group flex items-center gap-3 p-3 sm:p-3 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors cursor-pointer"
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full ${friend.color} flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0`}
      >
        {initials}
      </div>

      {/* Name & Role */}
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-y-1 sm:gap-2 items-center">
        <div className="col-span-1 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base text-slate-800 dark:text-slate-200 truncate">
              {friend.name}
            </h4>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500 truncate">
                {friend.relationship}
              </p>
              {(friend.streak || 0) > 0 && (
                <div
                  className="flex items-center gap-0.5 px-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500 text-[10px] font-bold"
                  title={`${friend.streak} week streak!`}
                >
                  <Flame className="w-2.5 h-2.5 fill-orange-500 animate-pulse" />
                  <span>{friend.streak}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Level & XP (visible on mobile, adjust positioning) */}
        <div className="col-span-1 flex justify-start sm:justify-start">
          <LevelBadge xp={friend.xp} />
        </div>

        {/* Recent Activity (hidden on mobile, shown on md screens) */}
        <div className="col-span-1 hidden md:block text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-slate-400" />
            <div className="flex flex-col">
              <span>
                {lastEventDate
                  ? new Date(lastEventDate).toLocaleDateString()
                  : "No events"}
              </span>
              {eventCount > 0 && (
                <span className="text-[10px] text-slate-400">
                  {eventCount} events total
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats/Tags (hidden on mobile, shown on lg screens) */}
        <div className="col-span-1 hidden lg:flex gap-1 flex-wrap">
          {friend.traits.slice(0, 2).map((trait, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-[10px] h-5 px-1.5 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500"
            >
              {trait}
            </Badge>
          ))}
          {friend.traits.length > 2 && (
            <span className="text-[10px] text-slate-400">
              +{friend.traits.length - 2}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {onPin && (
          <Button
            variant="ghost"
            size="icon-sm"
            className={`h-7 w-7 rounded-full ${isPinned ? "text-amber-500 bg-amber-50 dark:bg-amber-900/30" : "text-slate-400"}`}
            onClick={(e) => {
              e.stopPropagation();
              audioService.playClick();
              onPin();
            }}
          >
            <Pin className={`w-3 h-3 ${isPinned ? "fill-amber-500" : ""}`} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7 sm:h-8 sm:px-2 sm:w-auto sm:flex text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20"
          onClick={(e) => {
            e.stopPropagation();
            onLogEvent();
          }}
        >
          <Zap className="w-3 h-3 sm:mr-1.5" />
          <span className="hidden sm:inline">Log</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-slate-400 hover:text-slate-600"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onLogEvent();
              }}
            >
              <Activity className="w-4 h-4 mr-2" />
              Log Event
            </DropdownMenuItem>
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
    </div>
  );
}
