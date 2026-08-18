"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useCreateResolution } from "@/hooks/use-resolutions";

interface AddResolutionModalProps {
  organisationId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResolutionModal({ organisationId, isOpen, onOpenChange }: AddResolutionModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [closeDate, setCloseDate] = useState("");
  
  const createResolution = useCreateResolution(organisationId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !closeDate || !organisationId) return;

    await createResolution.mutateAsync({
      title,
      description,
      closeDate,
      organisationId,
    });

    setTitle("");
    setDescription("");
    setCloseDate("");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Circular Resolution</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Resolution Title *</Label>
            <Input 
              id="title"
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Approval of Q3 Budget"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description"
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the resolution clearly..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="closeDate">Voting Close Date *</Label>
            <Input 
              id="closeDate"
              type="date"
              value={closeDate} 
              onChange={(e) => setCloseDate(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!title.trim() || !description.trim() || !closeDate || createResolution.isPending}
              className="bg-[#2d1b54] hover:bg-[#1a0f35] text-white"
            >
              {createResolution.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Publish Resolution
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
