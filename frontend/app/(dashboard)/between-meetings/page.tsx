"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Send, FileType2, CheckSquare2, ListFilter, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { AddResolutionModal } from "@/components/resolutions/add-resolution-modal";

export default function BetweenMeetingsPage() {
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId;
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: resolutions = [], isLoading } = useQuery({
    queryKey: ["resolutions", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await api.get(`/resolutions`, {
        params: { organisationId: orgId }
      });
      return res.data;
    },
    enabled: !!orgId,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.post(`/resolutions/${id}/vote`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resolutions"] });
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            Between Meetings
            <span className="text-sm font-normal text-muted-foreground ml-2 hidden sm:inline-block">
              Approvals and Reports for when there isn't a meeting
            </span>
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 h-9 bg-white border-slate-200 text-sm focus-visible:ring-blue-500"
            />
          </div>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="w-full sm:w-auto bg-[#1e1b4b] hover:bg-[#2e2b5b] text-white rounded-md px-6 h-9"
          >
            + Add
          </Button>
        </div>
      </div>

      {orgId && (
        <AddResolutionModal 
          organisationId={orgId}
          isOpen={isAddOpen}
          onOpenChange={setIsAddOpen}
        />
      )}

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors">
          <FileType2 className="w-4 h-4 text-slate-500" />
          Type
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors">
          <CheckSquare2 className="w-4 h-4 text-slate-500" />
          Outcome
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors">
          <ListFilter className="w-4 h-4 text-slate-500" />
          Status
        </button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
      ) : resolutions.length === 0 ? (
        <div className="border border-slate-200 rounded-xl bg-white h-[60vh] flex flex-col items-center justify-center text-center shadow-sm">
          <div className="bg-slate-100 p-6 rounded-2xl mb-4">
            <Send className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-600 text-[15px] font-medium">No results found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {resolutions.map((res: any) => {
            const myVote = res.votes.find((v: any) => v.voterId === user?.id);
            const inFavour = res.votes.filter((v: any) => v.status === "IN_FAVOUR").length;
            const against = res.votes.filter((v: any) => v.status === "AGAINST").length;

            return (
              <div key={res.id} className="border border-slate-200 rounded-xl bg-white p-6 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-800">{res.title}</h3>
                    <p className="text-slate-600 mt-1">{res.description}</p>
                    <div className="text-sm text-slate-400 mt-2">Closes: {new Date(res.closeDate).toLocaleDateString()}</div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    res.status === 'PASSED' ? 'bg-green-100 text-green-700' :
                    res.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    res.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {res.status}
                  </span>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between border border-slate-100 gap-4 sm:gap-0">
                  <div className="flex items-center justify-center sm:justify-start gap-6">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 font-medium">In Favour</span>
                      <span className="text-lg font-bold text-green-600">{inFavour}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 font-medium">Against</span>
                      <span className="text-lg font-bold text-red-600">{against}</span>
                    </div>
                  </div>
                  
                  {res.status === 'OPEN' && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        variant={myVote?.status === "IN_FAVOUR" ? "default" : "outline"} 
                        className={`flex-1 sm:flex-none ${myVote?.status === "IN_FAVOUR" ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                        onClick={() => voteMutation.mutate({ id: res.id, status: "IN_FAVOUR" })}
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" /> Approve
                      </Button>
                      <Button 
                        variant={myVote?.status === "AGAINST" ? "default" : "outline"}
                        className={`flex-1 sm:flex-none ${myVote?.status === "AGAINST" ? "bg-red-600 hover:bg-red-700 text-white border-red-600" : "text-red-600 border-red-200 hover:bg-red-50"}`}
                        onClick={() => voteMutation.mutate({ id: res.id, status: "AGAINST" })}
                      >
                        <ThumbsDown className="w-4 h-4 mr-2" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
