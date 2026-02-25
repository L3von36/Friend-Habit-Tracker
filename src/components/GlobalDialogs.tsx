import React, { Suspense } from 'react';
import { Dialog as UIDialog, DialogContent as UIDialogContent, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle } from "@/components/ui/dialog";
import { DataExport } from "@/components/DataExport";
import { AddFriendForm } from "@/components/AddFriendForm";
import { SecuritySettings } from "@/components/Security/SecuritySettings";
import { RelationshipWrapped } from "@/components/Gamification/RelationshipWrapped";
import type { Friend, Event, Reminder, RelationshipGoal, Memory, GratitudeEntry } from "@/types";

// Lazy load CompareFriends
const CompareFriends = React.lazy(() =>
  import("@/components/CompareFriends").then((m) => ({
    default: m.CompareFriends,
  })),
);

interface GlobalDialogsProps {
  friends: Friend[];
  events: Event[];
  reminders: Reminder[];
  goals: RelationshipGoal[];
  memories: Memory[];
  gratitudeEntries: GratitudeEntry[];
  isExportOpen: boolean;
  setIsExportOpen: (open: boolean) => void;
  isAddFriendOpen: boolean;
  setIsAddFriendOpen: (open: boolean) => void;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;
  isSecurityOpen: boolean;
  setIsSecurityOpen: (open: boolean) => void;
  isWrappedOpen: boolean;
  setIsWrappedOpen: (open: boolean) => void;
  userName: string;
  onAddFriend: (friend: any) => void;
  onImportAllData: (data: any) => Promise<boolean>;
}

export function GlobalDialogs({
  friends,
  events,
  reminders,
  goals,
  memories,
  gratitudeEntries,
  isExportOpen,
  setIsExportOpen,
  isAddFriendOpen,
  setIsAddFriendOpen,
  isCompareOpen,
  setIsCompareOpen,
  isSecurityOpen,
  setIsSecurityOpen,
  isWrappedOpen,
  setIsWrappedOpen,
  userName,
  onAddFriend,
  onImportAllData,
}: GlobalDialogsProps) {
  return (
    <>
      <DataExport
        friends={friends}
        events={events}
        reminders={reminders}
        goals={goals}
        memories={memories}
        gratitudeEntries={gratitudeEntries}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onImport={onImportAllData}
      />

      <UIDialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen}>
        <UIDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg p-3 sm:p-6 max-h-[95vh] overflow-y-auto rounded-2xl">
          <UIDialogHeader className="mb-2 sm:mb-4">
            <UIDialogTitle className="text-xl font-bold">
              Add New Connection
            </UIDialogTitle>
          </UIDialogHeader>
          <AddFriendForm
            onSubmit={onAddFriend}
            onCancel={() => setIsAddFriendOpen(false)}
          />
        </UIDialogContent>
      </UIDialog>

      <Suspense fallback={null}>
        <CompareFriends
          friends={friends}
          events={events}
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
        />
      </Suspense>

      <SecuritySettings
        open={isSecurityOpen}
        onOpenChange={setIsSecurityOpen}
      />

      <RelationshipWrapped
        friends={friends}
        events={events}
        isOpen={isWrappedOpen}
        onClose={() => setIsWrappedOpen(false)}
        userName={userName}
      />
    </>
  );
}
