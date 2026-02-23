import { useState } from "react";
import { useSecurity } from "@/context/SecurityContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Lock,
  ShieldAlert,
  Cloud,
  RefreshCw,
  Bell,
  BrainCircuit,
} from "lucide-react";
import { googleDriveService } from "@/lib/googleDrive";
import { Switch } from "@/components/ui/switch";
import { useStorage } from "@/hooks/useStorage";
import { toast } from "sonner";

// Custom event for manual sync triggering
export const SYNC_EVENT = "friend-tracker-sync";

interface SecuritySettingsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SecuritySettings({
  open,
  onOpenChange,
}: SecuritySettingsProps) {
  const { isLockEnabled, setLock, removeLock } = useSecurity();
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useStorage<boolean>(
    "auto-sync-enabled",
    false,
  );
  const [isNotificationsEnabled, setIsNotificationsEnabled] =
    useStorage<boolean>("notifications-enabled", false);
  const [isDriveAuthenticated, setIsDriveAuthenticated] = useState(
    googleDriveService.isAuthenticated(),
  );
  const [groqApiKey, setGroqApiKey] = useStorage<string>("groq-api-key", "");

  const handleToggleNotifications = async (checked: boolean) => {
    if (checked) {
      if (!("Notification" in window)) {
        toast.error("This browser does not support desktop notifications");
        setIsNotificationsEnabled(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setIsNotificationsEnabled(true);
        toast.success("Relationship alerts enabled!");

        // Example notification to verify
        new Notification("Friend Tracker", {
          body: "You will now receive relationship intelligence alerts.",
          icon: "/icons/icon-192x192.svg",
        });
      } else {
        toast.error(
          "Permission denied. Please enable notifications in your browser settings.",
        );
        setIsNotificationsEnabled(false);
      }
    } else {
      setIsNotificationsEnabled(false);
      toast.info("Notifications disabled");
    }
  };

  const handleSetLock = () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }
    setLock(pin);
    setIsOpen(false);
    setPin("");
    setConfirmPin("");
    setError("");
  };

  const handleRemoveLock = () => {
    // In a real app, we should ask for current PIN first
    if (confirm("Are you sure you want to remove the App Lock?")) {
      removeLock();
      setIsOpen(false);
    }
  };

  const handleConnectDrive = async () => {
    try {
      await googleDriveService.authenticate();
      setIsDriveAuthenticated(true);
      toast.success("Connected to Google Drive");
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to Google Drive");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            App Security
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="space-y-1">
              <h4 className="font-medium">App Lock</h4>
              <p className="text-sm text-slate-500">
                Require a PIN to access the app
              </p>
            </div>
            {isLockEnabled ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveLock}
              >
                Disable
              </Button>
            ) : (
              <div className="text-sm text-slate-500 italic">Not Set</div>
            )}
          </div>

          {!isLockEnabled && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Set New PIN</h4>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                />
                <Input
                  type="password"
                  placeholder="Confirm PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  maxLength={6}
                />
                {error && <p className="text-xs text-red-500">{error}</p>}

                <Button className="w-full" onClick={handleSetLock}>
                  Set Lock
                </Button>
              </div>
            </div>
          )}

          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-500" />
              Push Notifications
            </h4>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Friend Activity Alerts</p>
                <p className="text-xs text-slate-500">
                  Get notified about birthdays and milestones
                </p>
              </div>
              <Switch
                checked={isNotificationsEnabled}
                onCheckedChange={handleToggleNotifications}
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Cloud className="w-4 h-4 text-sky-500" />
              Cloud Synchronization
            </h4>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Auto-Sync to Drive</p>
                <p className="text-xs text-slate-500 italic">
                  Keeps your data safe in the cloud
                </p>
              </div>
              <Switch
                checked={isAutoSyncEnabled}
                onCheckedChange={(checked) => {
                  if (checked && !isDriveAuthenticated) {
                    toast.error("Please connect to Google Drive first");
                    return;
                  }
                  setIsAutoSyncEnabled(checked);
                }}
              />
            </div>

            {isDriveAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs h-8"
                onClick={async () => {
                  toast.promise(googleDriveService.syncNow(), {
                    loading: "Syncing with Google Drive...",
                    success: "Data synchronized successfully",
                    error: "Sync failed. Will retry in background.",
                  });
                }}
              >
                <RefreshCw className="w-3 h-3" />
                Sync Now
              </Button>
            )}

            {!isDriveAuthenticated ? (
              <Button
                variant="outline"
                className="w-full gap-2 border-sky-200 hover:bg-sky-50 dark:border-sky-900/30 dark:hover:bg-sky-900/20"
                onClick={handleConnectDrive}
              >
                <Cloud className="w-4 h-4" />
                Connect Google Drive
              </Button>
            ) : (
              <div className="flex items-center justify-between px-2 py-1 bg-sky-50 dark:bg-sky-900/10 rounded border border-sky-100 dark:border-sky-900/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">
                    Connected
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-red-500 hover:text-red-700 p-0 px-2"
                  onClick={() => setIsDriveAuthenticated(false)}
                >
                  Disconnect
                </Button>
              </div>
            )}
            {(groqApiKey || import.meta.env.VITE_GROQ_API_KEY) && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 p-3 rounded-lg flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-yellow-800 dark:text-yellow-400 leading-relaxed">
                  <strong>Cloud Processing Active:</strong> Advanced AI features
                  are enabled. When using Deep Insights or Smart Drafts,
                  anonymized relationship data is securely sent to Groq's
                  servers for processing. Semantic Search remains on-device.
                </p>
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-emerald-500" />
              Advanced AI (Groq)
            </h4>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                API Key (Optional)
              </label>
              <Input
                type="password"
                placeholder="gsk_..."
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
              />
              <p className="text-[10px] text-slate-500">
                Unlock lightning-fast, ultra-smart insights and drafts. Leave
                blank to use the built-in local engine (MiniLM).
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
