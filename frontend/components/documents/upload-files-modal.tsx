"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, UploadCloud, File, X } from "lucide-react";

interface UploadFilesModalProps {
  organisationId: string;
  folderId?: string; // Optional if they want to upload to root
  folderName?: string;
  committeeId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadFilesModal({ organisationId, folderId, folderName, committeeId, isOpen, onOpenChange }: UploadFilesModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      // We must upload sequentially or use Promise.all. 
      // For simplicity, we use Promise.all.
      const promises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("organisationId", organisationId);
        if (folderId) {
          formData.append("folderId", folderId);
        }
        if (committeeId) {
          formData.append("committeeId", committeeId);
          formData.append("committeeVisible", "true");
        }

        return api.post("/documents/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      });

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", organisationId] });
      setSelectedFiles([]);
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            {folderName ? `Uploading to folder: ${folderName}` : "Uploading to general governance documents."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <UploadCloud className="w-8 h-8 text-primary mb-2" />
            <p className="font-medium text-sm">Click to select files to upload</p>
            <p className="text-xs text-muted-foreground mt-1">Supports PDF, Word, Excel, and Images</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple
              onChange={handleFileSelect}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              <h4 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h4>
              {selectedFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-2 border rounded-md text-sm">
                  <div className="flex items-center gap-2 truncate pr-4">
                    <File className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            disabled={selectedFiles.length === 0 || uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
            className="bg-[#2d1b54] hover:bg-[#1a0f35] text-white"
          >
            {uploadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Upload {selectedFiles.length > 0 ? selectedFiles.length : ""} Files
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
