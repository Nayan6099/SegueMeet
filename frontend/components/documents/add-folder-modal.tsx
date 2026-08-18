"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface AddFolderModalProps {
  organisationId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFolderModal({ organisationId, isOpen, onOpenChange }: AddFolderModalProps) {
  const queryClient = useQueryClient();
  const [folderName, setFolderName] = useState("");

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/documents/folders`, {
        organisationId,
        name: folderName,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-folders", organisationId] });
      setFolderName("");
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Folder</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-2">
            <Label>Folder Name</Label>
            <Input 
              value={folderName} 
              onChange={(e) => setFolderName(e.target.value)} 
              placeholder="e.g. Board Pack"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            disabled={!folderName || createFolderMutation.isPending}
            onClick={() => createFolderMutation.mutate()}
            className="bg-[#2d1b54] hover:bg-[#1a0f35] text-white"
          >
            {createFolderMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
