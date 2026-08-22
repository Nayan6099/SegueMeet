"use client";

import { Button } from "@/components/ui/button";
import { Tent, Loader2, Users, Settings2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useGetCommittees, useCreateCommittee } from "@/hooks/use-committees";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EditCommitteeModal } from "@/components/committees/edit-committee-modal";

export default function CommitteesPage() {
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId;

  const { data: committees = [], isLoading } = useGetCommittees(orgId);
  const createCommittee = useCreateCommittee(orgId);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCommitteeName, setNewCommitteeName] = useState("");
  const [newCommitteeDesc, setNewCommitteeDesc] = useState("");

  const [editingCommittee, setEditingCommittee] = useState<any>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !newCommitteeName.trim()) return;
    
    try {
      await createCommittee.mutateAsync({
        name: newCommitteeName,
        description: newCommitteeDesc,
        organisationId: orgId,
      });
      
      setIsCreateOpen(false);
      setNewCommitteeName("");
      setNewCommitteeDesc("");
    } catch (error) {
      console.error("Failed to create committee", error);
    }
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex flex-wrap items-baseline gap-2 text-slate-800">
            Committees
            <span className="text-sm font-normal text-muted-foreground hidden sm:inline-block">
              Manage your committees
            </span>
          </h1>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-[#1e1b4b] hover:bg-[#2e2b5b] text-white rounded-md px-4 sm:px-6 h-9 self-start sm:self-auto cursor-pointer">
            + Add Committee
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Committee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Committee Name *</Label>
                <Input
                  id="name"
                  value={newCommitteeName}
                  onChange={(e) => setNewCommitteeName(e.target.value)}
                  placeholder="e.g. Audit & Risk Committee"
                  required
                  disabled={createCommittee.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={newCommitteeDesc}
                  onChange={(e) => setNewCommitteeDesc(e.target.value)}
                  placeholder="What is the purpose of this committee?"
                  disabled={createCommittee.isPending}
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={!newCommitteeName.trim() || createCommittee.isPending}
                >
                  {createCommittee.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Committee
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
      ) : committees.length === 0 ? (
        <div className="border border-slate-200 rounded-xl bg-white p-8 sm:p-16 md:p-24 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="bg-slate-100 p-6 rounded-2xl mb-4">
            <Tent className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-600 text-[15px] font-medium">You don't have any active committees</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {committees.map((committee: any) => (
            <div 
              key={committee.id} 
              className="group border border-slate-200 rounded-xl bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all hover:border-slate-300 relative"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-lg text-slate-800 pr-8">{committee.name}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-700 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  onClick={() => setEditingCommittee(committee)}
                >
                  <Settings2 className="w-4 h-4" />
                </Button>
              </div>
              {committee.description && <p className="text-slate-500 text-sm mt-2 line-clamp-2">{committee.description}</p>}
              
              <div className="mt-6 flex items-center gap-2 text-slate-600 text-sm">
                <Users className="w-4 h-4" />
                <span>{committee.members?.length || 0} member{(committee.members?.length || 0) === 1 ? '' : 's'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {orgId && (
        <EditCommitteeModal
          isOpen={!!editingCommittee}
          onOpenChange={(open) => {
            if (!open) setEditingCommittee(null);
          }}
          committee={editingCommittee}
          organisationId={orgId}
        />
      )}
    </div>
  );
}
