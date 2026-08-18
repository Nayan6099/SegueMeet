"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useCreateInterest } from "@/hooks/use-interests";

interface AddInterestModalProps {
  organisationId: string;
  userId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddInterestModal({ organisationId, userId, isOpen, onOpenChange }: AddInterestModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const createInterest = useCreateInterest(organisationId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organisationId || !userId) return;

    await createInterest.mutateAsync({
      title,
      description,
      organisationId,
      userId,
    });

    setTitle("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Declare New Interest</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Interest Title *</Label>
            <Input 
              id="title"
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Director at ABC Corp"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description"
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about this interest..."
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!title.trim() || createInterest.isPending}
              className="bg-[#2d1b54] hover:bg-[#1a0f35] text-white"
            >
              {createInterest.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Interest
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
