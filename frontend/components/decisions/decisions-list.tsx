"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AddDecisionModal } from "./add-decision-modal";

export function DecisionsList({ organisationId, committeeId }: { organisationId: string; committeeId?: string }) {
  const { data = {}, isLoading } = useQuery({
    queryKey: ["decisions", organisationId, committeeId],
    queryFn: async () => {
      if (!organisationId) return { data: [], total: 0 };
      const res = await api.get(`/decisions`, {
        params: { organisationId, committeeId, take: 100 }
      });
      return res.data;
    },
    enabled: !!organisationId,
  });

  const [isAddOpen, setIsAddOpen] = useState(false);

  const decisions = data.data || [];

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground bg-white text-center">
        No decisions found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {committeeId && (
        <div className="flex justify-end mb-4">
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="rounded-md bg-[#2d1b54] hover:bg-[#1a0f35] text-white px-4 py-2 text-sm font-semibold shadow-sm flex items-center gap-2 h-9"
          >
            <Plus className="w-4 h-4" />
            Add Decision
          </Button>
        </div>
      )}

      {decisions.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground bg-white text-center">
          No decisions found.
        </div>
      ) : (
        decisions.map((decision: any) => (
          <div key={decision.id} className="p-4 border rounded-xl hover:border-primary transition-colors bg-white shadow-sm flex items-start gap-4">
            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-slate-800 text-[15px]">{decision.title}</h4>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  decision.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {decision.status}
                </span>
              </div>
              {decision.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{decision.description}</p>
              )}
              <div className="text-xs text-slate-400 mt-2 flex items-center gap-3">
                <span>Added {new Date(decision.createdAt).toLocaleDateString()}</span>
                {decision.votingEndsAt && (
                  <span>Voting ends: {new Date(decision.votingEndsAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {committeeId && (
        <AddDecisionModal 
          organisationId={organisationId}
          committeeId={committeeId}
          isOpen={isAddOpen}
          onOpenChange={setIsAddOpen}
        />
      )}
    </div>
  );
}
