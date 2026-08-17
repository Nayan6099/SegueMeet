import { mockMinutes } from "@/lib/mock-minutes";
import { mockMeetings } from "@/lib/mock-meetings";
import { MinuteBlock } from "@/lib/types";
import { Calendar, Search, Filter, ListChecks, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DecisionsPage() {
  // Flatten all decision blocks across all meetings
  const allDecisions = Object.entries(mockMinutes).flatMap(([meetingId, blocks]) => {
    return blocks
      .filter((b): b is MinuteBlock & { blockType: "decision" } => b.blockType === "decision")
      .map(decision => {
        const meeting = mockMeetings.find(m => m.id === meetingId);
        return {
          ...decision,
          meetingTitle: meeting?.title || "Unknown Meeting",
          meetingDate: meeting?.date || "No date"
        };
      });
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            Decisions Register
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Central record of all decisions
            </span>
          </h1>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search..." 
            className="pl-9 bg-white border-slate-200"
          />
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3">
        <Button variant="outline" className="bg-white text-slate-600 font-normal h-9">
          <Calendar className="mr-2 h-4 w-4 text-slate-400" />
          14 Feb 2026 - 14 Aug 2026
        </Button>
        <Button variant="outline" className="bg-white text-slate-600 font-normal h-9">
          <Filter className="mr-2 h-4 w-4 text-slate-400" />
          Type
        </Button>
        <Button variant="outline" className="bg-white text-slate-600 font-normal h-9">
          <CheckCircle2 className="mr-2 h-4 w-4 text-slate-400" />
          Outcome
        </Button>
      </div>

      {/* Content Area */}
      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        {allDecisions.length === 0 ? (
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
                <th className="px-6 py-4 font-medium">Outcome</th>
                <th className="px-6 py-4 font-medium">Mover / Seconder</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allDecisions.map(decision => (
                <tr key={decision.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {decision.content}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700">{decision.meetingTitle}</span>
                      <span className="text-xs">{decision.meetingDate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      decision.decisionOutcome === "approved" ? "bg-green-100 text-green-700" :
                      decision.decisionOutcome === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {decision.decisionOutcome ? decision.decisionOutcome.charAt(0).toUpperCase() + decision.decisionOutcome.slice(1) : "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {decision.mover && decision.seconder ? (
                       <span className="flex flex-col gap-0.5">
                         <span><span className="text-xs text-slate-400">M:</span> {decision.mover}</span>
                         <span><span className="text-xs text-slate-400">S:</span> {decision.seconder}</span>
                       </span>
                    ) : (
                      "-"
                    )}
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
