import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportData, importData } from '@/lib/reminders';
import type { Friend, Event } from '@/types';
import { Download, Upload, FileJson, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DataExportProps {
  friends: Friend[];
  events: Event[];
  onImport: (friends: Friend[], events: Event[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function DataExport({ friends, events, onImport, isOpen, onClose }: DataExportProps) {
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData(friends, events);
    navigator.clipboard.writeText(data);
    setCopied(true);
    toast.success('Data copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const data = exportData(friends, events);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `friend-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup file downloaded!');
  };

  const handleImport = () => {
    const result = importData(importText);
    if (result) {
      onImport(result.friends, result.events);
      setImportText('');
      setImportError('');
      toast.success(`Imported ${result.friends.length} friends and ${result.events.length} events!`);
      onClose();
    } else {
      setImportError('Invalid data format. Please check your JSON.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  const exportJson = exportData(friends, events);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Backup & Restore</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FileJson className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200">Export Your Data</h4>
                  <p className="text-sm text-slate-500">{friends.length} friends, {events.length} events</p>
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
                <code className="text-xs text-slate-600 dark:text-slate-400 break-all">
                  {exportJson.slice(0, 500)}...
                </code>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleExport} 
                  variant="outline" 
                  className="flex-1"
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
                <Button 
                  onClick={handleDownload}
                  className="flex-1 bg-violet-500 hover:bg-violet-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            </Card>

            <p className="text-xs text-slate-500 text-center">
              Your data is stored locally in your browser. Export regularly to keep backups.
            </p>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200">Import Data</h4>
                  <p className="text-sm text-slate-500">Restore from a previous backup</p>
                </div>
              </div>

              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full mb-3"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Backup File
              </Button>

              <div className="relative">
                <textarea
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    setImportError('');
                  }}
                  placeholder="Or paste your backup JSON here..."
                  className="w-full h-32 p-3 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {importError && (
                <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {importError}
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="w-full mt-3 bg-violet-500 hover:bg-violet-600 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </Button>
            </Card>

            <p className="text-xs text-slate-500 text-center">
              Warning: Importing will replace all current data. Make sure to export first if needed.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
