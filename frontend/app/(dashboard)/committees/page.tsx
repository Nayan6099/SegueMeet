"use client";

import { Button } from "@/components/ui/button";
import { Tent } from "lucide-react";

export default function CommitteesPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            Committees
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Manage your committees
            </span>
          </h1>
        </div>
        <Button className="bg-[#1e1b4b] hover:bg-[#2e2b5b] text-white rounded-md px-6 h-9">
          + Add Committee
        </Button>
      </div>

      {/* Empty State */}
      <div className="border border-slate-200 rounded-xl bg-white h-[60vh] flex flex-col items-center justify-center text-center shadow-sm">
        <div className="bg-slate-100 p-6 rounded-2xl mb-4">
          <Tent className="w-10 h-10 text-slate-400" />
        </div>
        <p className="text-slate-600 text-[15px] font-medium">You don't have any active committees</p>
      </div>
    </div>
  );
}
