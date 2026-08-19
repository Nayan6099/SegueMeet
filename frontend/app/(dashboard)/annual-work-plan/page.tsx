"use client";

import { Button } from "@/components/ui/button";
import { ClipboardList, ExternalLink, FileUp, PlusSquare, Loader2, Calendar } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useGetAnnualPlans, useCreateAnnualPlan } from "@/hooks/use-annual-plan";

export default function AnnualWorkPlanPage() {
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId;
  const currentYear = new Date().getFullYear();

  const { data: plans = [], isLoading } = useGetAnnualPlans(orgId, currentYear);
  const createPlan = useCreateAnnualPlan(orgId, currentYear);

  const activePlan = plans[0];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            Annual Work Plans
            <span className="text-sm font-normal text-muted-foreground ml-2 hidden sm:inline-block">
              Your central hub for planning and priorities
            </span>
          </h1>
        </div>
        <Button 
          onClick={() => orgId && createPlan.mutate()}
          disabled={createPlan.isPending || !orgId}
          className="bg-[#1e1b4b] hover:bg-[#2e2b5b] text-white rounded-md px-6 h-9 self-start sm:self-auto"
        >
          {createPlan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "+ Add"}
        </Button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
      ) : !activePlan ? (
        <div className="border border-slate-200 rounded-xl bg-white min-h-[60vh] flex flex-col items-center justify-center text-center shadow-sm p-8">
          <div className="bg-slate-100 p-5 rounded-2xl mb-6">
            <ClipboardList className="w-10 h-10 text-slate-500" />
          </div>
          
          <h2 className="text-lg font-semibold text-[#1e1b4b] mb-3">
            Create an annual work plan for {currentYear}
          </h2>
          
          <p className="text-slate-500 text-sm max-w-sm mb-8">
            Stay focused on the strategic, long-term priorities that drive your organisation forward.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto border-slate-300 text-slate-700 h-10 px-4 flex items-center justify-center gap-2">
              <FileUp className="w-4 h-4 shrink-0" />
              Import existing plan
            </Button>
            <Button 
              onClick={() => orgId && createPlan.mutate()} 
              disabled={createPlan.isPending || !orgId}
              className="w-full sm:w-auto bg-[#2e2a74] hover:bg-[#1e1b4b] text-white h-10 px-4 flex items-center justify-center gap-2"
            >
              <PlusSquare className="w-4 h-4 shrink-0" />
              {createPlan.isPending ? "Creating..." : "Create blank plan"}
            </Button>
          </div>

          <Link href="#" className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Learn more <ExternalLink className="ml-1.5 w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-x-auto">
          <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              {currentYear} Work Plan
            </h2>
            <div className="text-sm font-medium text-slate-500">
              {activePlan.items?.length || 0} items scheduled
            </div>
          </div>
          
          {activePlan.items?.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Month</th>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePlan.items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {new Date(currentYear, item.month - 1).toLocaleString('default', { month: 'long' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{item.title}</div>
                      {item.description && <div className="text-slate-500 text-xs mt-1">{item.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        item.status === 'DONE' ? 'bg-green-100 text-green-700' :
                        item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-500">
              No items in this plan yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
