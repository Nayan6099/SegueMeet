"use client";

import { Button } from "@/components/ui/button";
import { ClipboardList, ExternalLink, FileUp, PlusSquare } from "lucide-react";
import Link from "next/link";

export default function AnnualWorkPlanPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            Annual Work Plans
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Your central hub for planning and priorities
            </span>
          </h1>
        </div>
        <Button className="bg-[#1e1b4b] hover:bg-[#2e2b5b] text-white rounded-md px-6 h-9">
          + Add
        </Button>
      </div>

      {/* Empty State */}
      <div className="border border-slate-200 rounded-xl bg-white min-h-[60vh] flex flex-col items-center justify-center text-center shadow-sm p-8">
        <div className="bg-slate-100 p-5 rounded-2xl mb-6">
          <ClipboardList className="w-10 h-10 text-slate-500" />
        </div>
        
        <h2 className="text-lg font-semibold text-[#1e1b4b] mb-3">
          Create an annual work plan
        </h2>
        
        <p className="text-slate-500 text-sm max-w-sm mb-8">
          Stay focused on the strategic, long-term priorities that drive your organisation forward.
        </p>

        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" className="border-slate-300 text-slate-700 h-10 px-4 flex items-center gap-2">
            <FileUp className="w-4 h-4" />
            Import existing plan
          </Button>
          <Button className="bg-[#2e2a74] hover:bg-[#1e1b4b] text-white h-10 px-4 flex items-center gap-2">
            <PlusSquare className="w-4 h-4" />
            Create blank plan
          </Button>
        </div>

        <Link href="#" className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
          Learn more <ExternalLink className="ml-1.5 w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
