"use client";

import { useState } from "react";
import { Calendar, Search, Filter, ListChecks, CheckCircle2, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { useGetDecisions, useGetResolutions, useCreateDecision, useCreateResolution } from "@/hooks/use-decisions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function DecisionsPage() {
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId;
  const role = user?.memberships?.[0]?.role;
  const canManage = ["BOARD_ADMIN", "CHAIR", "SECRETARY"].includes(role || "");
  const router = useRouter();

  const { data: allDecisions = [], isLoading: isLoadingDecisions } = useGetDecisions(orgId);
  const { data: allResolutions = [], isLoading: isLoadingResolutions } = useGetResolutions(orgId);

  const isLoading = isLoadingDecisions || isLoadingResolutions;

  const [search, setSearch] = useState("");

  const [decisionOpen, setDecisionOpen] = useState(false);
  const [resolutionOpen, setResolutionOpen] = useState(false);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            Decisions Register
            <span className="text-sm font-normal text-muted-foreground ml-2 hidden sm:inline-block">
              Central record of all decisions & circular resolutions
            </span>
          </h1>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-slate-200"
          />
        </div>
      </div>

      <Tabs defaultValue="decisions" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="decisions">Meeting Decisions</TabsTrigger>
            <TabsTrigger value="resolutions">Circular Resolutions</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="bg-white text-slate-600 font-normal h-9">
              <Filter className="mr-2 h-4 w-4 text-slate-400 shrink-0" /> Filter
            </Button>
            {canManage && (
              <>
                <CreateDecisionModal open={decisionOpen} onOpenChange={setDecisionOpen} orgId={orgId || ""} />
                <CreateResolutionModal open={resolutionOpen} onOpenChange={setResolutionOpen} orgId={orgId || ""} />
              </>
            )}
          </div>
        </div>

        <TabsContent value="decisions" className="mt-6">
          <div className="border rounded-xl bg-white shadow-sm overflow-x-auto min-h-[400px]">
            {isLoadingDecisions ? (
              <div className="flex justify-center items-center h-full py-24"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : allDecisions.length === 0 ? (
              <EmptyState message="No meeting decisions found" />
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-slate-500 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium w-1/2">Decision</th>
                    <th className="px-6 py-4 font-medium">Meeting</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y cursor-pointer">
                  {allDecisions.map((decision: any) => (
                    <tr key={decision.id} onClick={() => router.push(`/decisions/${decision.id}`)} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{decision.title}</div>
                        {decision.description && <div className="text-slate-500 mt-1 line-clamp-2">{decision.description}</div>}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <span className="font-medium text-slate-700">{decision.meeting?.title || "Direct Decision"}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(decision.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={decision.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resolutions" className="mt-6">
          <div className="border rounded-xl bg-white shadow-sm overflow-x-auto min-h-[400px]">
            {isLoadingResolutions ? (
              <div className="flex justify-center items-center h-full py-24"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : allResolutions.length === 0 ? (
              <EmptyState message="No circular resolutions found" />
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-slate-500 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium w-1/2">Resolution</th>
                    <th className="px-6 py-4 font-medium">Deadline</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y cursor-pointer">
                  {allResolutions.map((res: any) => (
                    <tr key={res.id} onClick={() => router.push(`/resolutions/${res.id}`)} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{res.title}</div>
                        {res.description && <div className="text-slate-500 mt-1 line-clamp-2">{res.description}</div>}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(res.closeDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={res.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-24 flex flex-col items-center justify-center text-center">
      <div className="bg-gray-50 p-4 rounded-2xl mb-4">
        <ListChecks className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-slate-600 text-sm font-medium">{message}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-700",
    CLOSED: "bg-gray-100 text-gray-700",
    PASSED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    DRAFT: "bg-yellow-100 text-yellow-700",
  };
  const color = colors[status] || "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Modals ─────────────────────────────────────────────────────────────────

function CreateDecisionModal({ open, onOpenChange, orgId }: { open: boolean, onOpenChange: (open: boolean) => void, orgId: string }) {
  const createDecision = useCreateDecision();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDecision.mutate({ organisationId: orgId, title, description, date }, {
      onSuccess: () => {
        toast.success("Decision created");
        onOpenChange(false);
        setTitle(""); setDescription(""); setDate("");
      },
      onError: (err: any) => toast.error(err.response?.data?.message || "Error creating decision")
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[#1e1b4b] hover:bg-[#2e2b5b]"><Plus className="w-4 h-4 mr-2"/> Decision</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Meeting Decision</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Date</label>
            <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={createDecision.isPending}>
            {createDecision.isPending ? "Saving..." : "Save Decision"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateResolutionModal({ open, onOpenChange, orgId }: { open: boolean, onOpenChange: (open: boolean) => void, orgId: string }) {
  const createResolution = useCreateResolution();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [closeDate, setCloseDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createResolution.mutate({ organisationId: orgId, title, description, closeDate }, {
      onSuccess: () => {
        toast.success("Resolution created");
        onOpenChange(false);
        setTitle(""); setDescription(""); setCloseDate("");
      },
      onError: (err: any) => toast.error(err.response?.data?.message || "Error creating resolution")
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[#1e1b4b] hover:bg-[#2e2b5b]"><Plus className="w-4 h-4 mr-2"/> Resolution</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Circular Resolution</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea required value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Voting Deadline</label>
            <Input type="date" required value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={createResolution.isPending}>
            {createResolution.isPending ? "Saving..." : "Save Resolution"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
