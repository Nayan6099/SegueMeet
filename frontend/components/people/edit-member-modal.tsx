"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, X, UserCog } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface EditMemberModalProps {
  organisationId: string;
  member: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMemberModal({
  organisationId,
  member,
  isOpen,
  onOpenChange
}: EditMemberModalProps) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<string>(member?.role || "BOARD_MEMBER");
  const [tenureEndDate, setTenureEndDate] = useState<string>(member?.tenureEndDate || "");

  useEffect(() => {
    if (isOpen && member) {
      setRole(member.role);
      setTenureEndDate(member.tenureEndDate || "");
    }
  }, [isOpen, member]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/organisations/${organisationId}/members/${member.user.id}`, {
        role,
        tenureEndDate: tenureEndDate || null
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", organisationId] });
      toast.success("Member updated successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update member");
    }
  });

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-1.5 rounded-md text-orange-600">
              <UserCog className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg">Edit Member: {member.user.name}</DialogTitle>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-slate-700">Role</Label>
            <Select value={role} onValueChange={(val) => setRole(val || "BOARD_MEMBER")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOARD_MEMBER">Board Member</SelectItem>
                <SelectItem value="BOARD_ADMIN">Board Admin</SelectItem>
                <SelectItem value="CHAIR">Chair</SelectItem>
                <SelectItem value="SECRETARY">Secretary</SelectItem>
                <SelectItem value="EXECUTIVE">Executive</SelectItem>
                <SelectItem value="GUEST">Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-700">Tenure End Date (Optional)</Label>
            <Input 
              type="date"
              value={tenureEndDate}
              onChange={(e) => setTenureEndDate(e.target.value)}
              className="border-slate-300"
            />
            <p className="text-xs text-slate-500">
              Used for sending automatic tenure reminders 8 weeks and 1 day before the end date.
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex gap-3 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6 text-slate-700">
            Cancel
          </Button>
          <Button 
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8"
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
