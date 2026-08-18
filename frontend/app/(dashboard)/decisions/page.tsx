"use client";

import { Calendar, Search, Filter, ListChecks, CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useGetDecisions } from "@/hooks/use-decisions";

export default function DecisionsPage() {
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId;

  const { data: allDecisions = [], isLoading } = useGetDecisions(orgId);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            Decisions Register
            <span className="text-sm font-normal text-muted-foreground ml-2 hidden sm:inline-block">
              Central record of all decisions
            </span>
          </h1>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search..." 
            className="pl-9 bg-white border-slate-200"
          />
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" className="w-full sm:w-auto bg-white text-slate-600 font-normal h-9">
          <Calendar className="mr-2 h-4 w-4 text-slate-400" />
          14 Feb 2026 - 14 Aug 2026
        </Button>
        <Button variant="outline" className="flex-1 sm:flex-none bg-white text-slate-600 font-normal h-9">
          <Filter className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
          Type
        </Button>
        <Button variant="outline" className="flex-1 sm:flex-none bg-white text-slate-600 font-normal h-9">
          <CheckCircle2 className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
          Outcome
        </Button>
      </div>

      {/* Content Area */}
      <div className="border rounded-xl bg-white shadow-sm overflow-x-auto min-h-[400px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-full py-24"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : allDecisions.length === 0 ? (
          // Empty State matching the screenshot
          <div className="p-24 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-4 rounded-2xl mb-4">
              <ListChecks className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 text-sm font-medium">No results found</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-slate-500 border-b">
              <tr>
                <th className="px-6 py-4 font-medium w-1/2">Decision</th>
                <th className="px-6 py-4 font-medium">Meeting</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allDecisions.map((decision: any) => (
                <tr key={decision.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{decision.title}</div>
                    {decision.description && <div className="text-slate-500 mt-1 line-clamp-2">{decision.description}</div>}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <span className="font-medium text-slate-700">{decision.meeting?.title || "Direct Resolution"}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(decision.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      decision.status === "APPROVED" ? "bg-green-100 text-green-700" :
                      decision.status === "REJECTED" ? "bg-red-100 text-red-700" :
                      decision.status === "PROPOSED" ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {decision.status.charAt(0) + decision.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
