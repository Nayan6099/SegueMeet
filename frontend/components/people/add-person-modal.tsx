"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

const ROLES = [
  { value: "BOARD_MEMBER", label: "Board Member" },
  { value: "BOARD_ADMIN", label: "Board Admin" },
  { value: "CHAIR", label: "Chair" },
  { value: "SECRETARY", label: "Secretary" },
  { value: "EXECUTIVE", label: "Executive" },
  { value: "GUEST", label: "Guest" },
];

export function AddPersonModal({
  isOpen,
  onOpenChange,
  organisationId,
  trigger,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organisationId: string;
  trigger?: React.ReactNode;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("BOARD_MEMBER");
  
  const queryClient = useQueryClient();

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/organisations/${organisationId}/members`, {
        name,
        email,
        role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", organisationId] });
      toast.success("Person added successfully!");
      onOpenChange(false);
      setName("");
      setEmail("");
      setRole("BOARD_MEMBER");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add person");
    }
  });

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and Email are required");
      return;
    }
    addMemberMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Person</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input 
              placeholder="e.g. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              type="email"
              placeholder="e.g. jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(val) => setRole(val || "BOARD_MEMBER")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={addMemberMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={addMemberMutation.isPending} className="bg-emerald-500 hover:bg-emerald-600">
            {addMemberMutation.isPending ? "Adding..." : "Add Person"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
