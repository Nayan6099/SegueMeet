"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface AddAttendeeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  members: any[]; // Organisation members
  currentAttendees: any[];
}

export function AddAttendeeModal({
  isOpen,
  onOpenChange,
  meetingId,
  members,
  currentAttendees,
}: AddAttendeeModalProps) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  const mutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post(`/meetings/${meetingId}/attendees`, { userId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      onOpenChange(false);
      setSelectedUserId("");
    },
  });

  const handleAdd = () => {
    if (!selectedUserId) return;
    mutation.mutate(selectedUserId);
  };

  // Filter out members who are already attendees
  const attendeeUserIds = currentAttendees?.map(a => a.userId) || [];
  const availableMembers = members.filter(m => !attendeeUserIds.includes(m.userId));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Attendee</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p className="text-sm text-slate-500">
            Select a member to invite to this meeting. They will receive an email notification.
          </p>

          <select 
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Select a member...</option>
            {availableMembers.map(m => (
              <option key={m.user.id} value={m.user.id}>{m.user.name} ({m.user.email})</option>
            ))}
          </select>

          {availableMembers.length === 0 && (
            <p className="text-xs text-amber-600 italic">All organisation members have already been invited.</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAdd}
              disabled={!selectedUserId || mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Invite Attendee
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
