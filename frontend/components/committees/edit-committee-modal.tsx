import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, UserPlus, ShieldAlert, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  useUpdateCommittee,
  useDeleteCommittee,
  useAddCommitteeMember,
  useRemoveCommitteeMember,
  useUpdateCommitteeMemberRole
} from "@/hooks/use-committees";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function EditCommitteeModal({
  isOpen,
  onOpenChange,
  committee,
  organisationId,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  committee: any | null;
  organisationId: string;
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("MEMBER");

  const updateCommittee = useUpdateCommittee(organisationId);
  const deleteCommittee = useDeleteCommittee(organisationId);
  const addMember = useAddCommitteeMember(organisationId);
  const removeMember = useRemoveCommitteeMember(organisationId);
  const updateRole = useUpdateCommitteeMemberRole(organisationId);

  useEffect(() => {
    if (committee) {
      setName(committee.name || "");
      setDescription(committee.description || "");
      setActiveTab("details");
      setNewMemberId("");
      setNewMemberRole("MEMBER");
    }
  }, [committee]);

  const { data: orgMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["members", organisationId],
    queryFn: async () => {
      if (!organisationId) return [];
      const res = await api.get(`/organisations/${organisationId}/members`);
      return res.data;
    },
    enabled: !!organisationId && isOpen,
  });

  if (!committee) return null;

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await updateCommittee.mutateAsync({
        id: committee.id,
        data: { name, description },
      });
      toast.success("Committee updated successfully");
    } catch (error) {
      toast.error("Failed to update committee");
    }
  };

  const handleAddMember = async () => {
    if (!newMemberId) return;

    try {
      await addMember.mutateAsync({
        committeeId: committee.id,
        userId: newMemberId,
        role: newMemberRole,
      });
      toast.success("Member added");
      setNewMemberId("");
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  const handleDeleteCommittee = async () => {
    try {
      await deleteCommittee.mutateAsync(committee.id);
      toast.success("Committee deleted");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete committee");
    }
  };

  const availableMembers = orgMembers.filter((m: any) => 
    !committee.members.some((cm: any) => cm.userId === m.user.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Committee: {committee.name}</DialogTitle>
          <DialogDescription>
            Update committee details or manage its members.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="members">Members ({committee.members?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 pt-4">
            <form onSubmit={handleUpdateDetails} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Committee Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Audit & Risk Committee"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is the purpose of this committee?"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={updateCommittee.isPending}>
                  {updateCommittee.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>

            <div className="border-t pt-6 mt-6">
              <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Danger Zone
              </h4>
              <p className="text-sm text-slate-500 mb-4">
                Permanently delete this committee and all of its associated data.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                  Delete Committee
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the "{committee.name}" committee. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCommittee} className="bg-red-600 hover:bg-red-700">
                      Yes, delete committee
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6 pt-4">
            {/* Add new member section */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full space-y-1.5">
                <Label className="text-xs text-slate-500">Select Person</Label>
                <Select value={newMemberId} onValueChange={(val) => val && setNewMemberId(val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select a member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500 text-center">No more members to add</div>
                    ) : (
                      availableMembers.map((m: any) => (
                        <SelectItem key={m.user.id} value={m.user.id}>
                          {m.user.name} ({m.user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-[150px] space-y-1.5">
                <Label className="text-xs text-slate-500">Role</Label>
                <Select value={newMemberRole} onValueChange={(val) => val && setNewMemberRole(val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHAIR">Chair</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="SECRETARY">Secretary</SelectItem>
                    <SelectItem value="OBSERVER">Observer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAddMember}
                disabled={!newMemberId || addMember.isPending}
                className="w-full sm:w-auto shrink-0 bg-[#2e2a74] hover:bg-[#1e1b4b]"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            {/* Current members list */}
            <div className="border rounded-md divide-y">
              {committee.members?.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No members in this committee yet.
                </div>
              ) : (
                committee.members.map((member: any) => (
                  <div key={member.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-medium text-sm text-slate-800">{member.user.name}</div>
                      <div className="text-xs text-slate-500">{member.user.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={member.role} 
                        onValueChange={(val) => {
                          updateRole.mutate({
                            committeeId: committee.id,
                            userId: member.user.id,
                            role: val
                          });
                        }}
                      >
                        <SelectTrigger className="h-8 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CHAIR">Chair</SelectItem>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="SECRETARY">Secretary</SelectItem>
                          <SelectItem value="OBSERVER">Observer</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        disabled={removeMember.isPending}
                        onClick={() => {
                          removeMember.mutate({
                            committeeId: committee.id,
                            userId: member.user.id
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
