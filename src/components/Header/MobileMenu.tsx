// src/components/Header/MobileMenu.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Users,
  VolumeX,
  Volume2,
  Download,
  UserPlus,
  GitCompare,
  User,
  Settings,
  LayoutGrid,
  BrainCircuit,
  Sparkles,
  Activity,
  Calendar,
  Users2,
} from "lucide-react";
import { LoomLogo } from "@/components/Common/LoomLogo";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";

type MobileMenuProps = {
  isMuted: boolean;
  onToggleMute: () => void;
  onBackupRestore: () => void;
  onAddFriend: () => void;
  onCompareFriends: () => void;
  onOpenProfile: () => void;
  onOpenSecuritySettings: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function MobileMenu({
  isMuted,
  onToggleMute,
  onBackupRestore,
  onAddFriend,
  onCompareFriends,
  onOpenProfile,
  onOpenSecuritySettings,
  activeTab,
  onTabChange,
}: MobileMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[90%] max-w-[340px] p-0 border-l border-slate-200 dark:border-slate-800"
      >
        <SheetHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <LoomLogo className="w-6 h-6 text-white" />
            </div>
            <div>
              <SheetTitle className="text-xl font-black tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Loom
              </SheetTitle>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Menu
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
          <div>
            <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Navigation
            </h3>
            <div className="grid grid-cols-1 gap-1">
              {[
                { id: "dashboard", label: "Home", icon: LayoutGrid },
                { id: "connections", label: "People", icon: Users },
                { id: "ai_hub", label: "AI Hub", icon: BrainCircuit },
                { id: "quests", label: "Quests", icon: Sparkles },
                { id: "calendar", label: "Calendar", icon: Calendar },
                { id: "timeline", label: "Activity", icon: Activity },
                { id: "groups", label: "Groups", icon: Users2 },
              ].map((item) => (
                <SheetClose key={item.id} asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-12 rounded-xl text-sm font-medium transition-all ${
                      activeTab === item.id
                        ? "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                    onClick={() => onTabChange(item.id)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </SheetClose>
              ))}
            </div>
          </div>

          <div>
            <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Actions
            </h3>
            <div className="grid grid-cols-1 gap-1">
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400"
                  onClick={onAddFriend}
                >
                  <UserPlus className="w-4 h-4" />
                  Add New Connection
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400"
                  onClick={onCompareFriends}
                >
                  <GitCompare className="w-4 h-4" />
                  Compare Connections
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400"
                  onClick={onBackupRestore}
                >
                  <Download className="w-4 h-4" />
                  Backup & Restore
                </Button>
              </SheetClose>
            </div>
          </div>

          <div>
            <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Settings & Info
            </h3>
            <div className="grid grid-cols-1 gap-1">
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400"
                  onClick={onOpenProfile}
                >
                  <User className="w-4 h-4" />
                  My Profile
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400"
                  onClick={onOpenSecuritySettings}
                >
                  <Settings className="w-4 h-4" />
                  Security Settings
                </Button>
              </SheetClose>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400"
                onClick={onToggleMute}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                {isMuted ? "Unmute Audio" : "Mute Audio"}
              </Button>
              <div className="pt-1">
                <KeyboardShortcutsDialog />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
