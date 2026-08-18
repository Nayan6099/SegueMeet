"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckSquare, User, Calendar, MoreHorizontal, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useGetOrganisationActions, useUpdateActionItem } from "@/hooks/use-actions";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ActionsPage() {
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId;
  const [filterOwner, setFilterOwner] = useState<"all" | "me">("all");
  const [page, setPage] = useState(1);
  const take = 10;
  const skip = (page - 1) * take;

  const { data: response, isLoading } = useGetOrganisationActions(orgId, { skip, take });
  const allActions = response?.data || [];
  const total = response?.total || 0;
  const updateAction = useUpdateActionItem(orgId || "");

  const filteredActions = allActions.filter((a: any) => {
    if (filterOwner === "me") {
      return a.assigneeId === user?.id;
    }
    return true;
  });

  const currentActions = filteredActions.filter((a: any) => a.status === "OPEN" || a.status === "IN_PROGRESS" || a.status === "OVERDUE");
  const completedActions = filteredActions.filter((a: any) => a.status === "COMPLETED");
  const cancelledActions: any[] = []; // Our schema doesn't have cancelled, but if it did we'd map it here.

  const totalPages = Math.ceil(total / take);

  // Helper to render action lists
  const renderActionsList = (actions: typeof allActions, emptyMessage: string) => {
    if (actions.length === 0) {
      return (
        <div className="border rounded-xl bg-white p-24 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="bg-gray-50 p-4 rounded-2xl mb-4">
            <CheckSquare className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {actions.map((action: any) => (
          <div key={action.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow group gap-4 sm:gap-0">
            <div className="flex-1 min-w-0 sm:pr-4">
              <h3 className="font-medium text-slate-800 text-base mb-1">{action.description}</h3>
              <div className="flex flex-wrap items-center text-sm text-slate-500 gap-y-2 gap-x-4">
                <span className="flex items-center gap-1.5 whitespace-nowrap"><User className="w-4 h-4 shrink-0" /> {action.assignee?.name || "Unassigned"}</span>
                <span className="flex items-center gap-1.5 whitespace-nowrap"><Calendar className="w-4 h-4 shrink-0" /> Due: {action.dueDate || "No date"}</span>
                <span className="text-gray-300">•</span>
                <span>{action.minutes?.meeting?.title || "Unknown Meeting"}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 shrink-0">
               <Select
                  value={action.status}
                  onValueChange={(v) => updateAction.mutate({ id: action.id, patch: { status: v } })}
                >
                  <SelectTrigger className={`h-8 border-none font-semibold ${
                    action.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                    action.status === "OPEN" ? "bg-blue-100 text-blue-700" :
                    action.status === "OVERDUE" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">OPEN</SelectItem>
                    <SelectItem value="IN_PROGRESS">IN PROGRESS</SelectItem>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    <SelectItem value="OVERDUE">OVERDUE</SelectItem>
                  </SelectContent>
                </Select>
               <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
                 <MoreHorizontal className="w-5 h-5" />
               </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
          Action List 
          <span className="text-sm font-normal text-muted-foreground ml-2 hidden sm:inline-block">
            Track, update, and complete your Actions
          </span>
        </h1>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-0 mb-6 gap-4 sm:gap-0">
          <TabsList className="bg-transparent h-auto p-0 rounded-none border-none flex-nowrap overflow-x-auto w-full justify-start space-x-4 md:space-x-6 scrollbar-hide">
            <TabsTrigger 
              value="current" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-700"
            >
              Current Actions
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-muted-foreground"
            >
              Completed Actions
            </TabsTrigger>
            <TabsTrigger 
              value="cancelled"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-muted-foreground"
            >
              Cancelled Actions
            </TabsTrigger>
          </TabsList>
          
          {/* Owner Filter Button */}
          <div 
            className="flex items-center justify-center sm:justify-start w-full sm:w-auto text-sm font-medium text-slate-600 bg-white border px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 transition-colors shadow-sm select-none"
            onClick={() => setFilterOwner(prev => prev === "all" ? "me" : "all")}
          >
            <User className="mr-2 h-4 w-4 text-gray-400" />
            Owner <span className="mx-1 text-gray-300">|</span> {filterOwner === "me" ? "Me" : "All"}
          </div>
        </div>

        <TabsContent value="current" className="mt-0">
           {isLoading ? (
             <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
           ) : renderActionsList(currentActions, "No current actions have been created yet.")}
        </TabsContent>
        <TabsContent value="completed" className="mt-0">
           {isLoading ? (
             <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
           ) : renderActionsList(completedActions, "No completed actions found.")}
        </TabsContent>
        <TabsContent value="cancelled" className="mt-0">
           {isLoading ? (
             <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
           ) : renderActionsList(cancelledActions, "No cancelled actions found.")}
        </TabsContent>
      </Tabs>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 border rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 border rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
