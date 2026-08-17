import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { mockMinutes } from "@/lib/mock-minutes";
import { mockMeetings } from "@/lib/mock-meetings";
import { MinuteBlock } from "@/lib/types";
import { CheckSquare, User, Calendar, MoreHorizontal } from "lucide-react";

export default function ActionsPage() {
  // Flatten all action blocks across all meetings
  const allActions = Object.entries(mockMinutes).flatMap(([meetingId, blocks]) => {
    return blocks
      .filter((b): b is MinuteBlock & { blockType: "action" } => b.blockType === "action")
      .map(action => {
        const meeting = mockMeetings.find(m => m.id === meetingId);
        return {
          ...action,
          meetingTitle: meeting?.title || "Unknown Meeting"
        };
      });
  });

  const currentActions = allActions.filter(a => a.actionStatus === "open" || a.actionStatus === "in_progress" || !a.actionStatus);
  const completedActions = allActions.filter(a => a.actionStatus === "completed");
  const cancelledActions = allActions.filter(a => a.actionStatus === "cancelled");

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
        {actions.map(action => (
          <div key={action.id} className="flex items-center justify-between border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex-1 min-w-0 pr-4">
              <h3 className="font-medium text-slate-800 text-base mb-1">{action.content}</h3>
              <div className="flex items-center text-sm text-slate-500 gap-4">
                <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {action.actionOwner || "Unassigned"}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Due: {action.actionDueDate || "No date"}</span>
                <span className="text-gray-300">•</span>
                <span>{action.meetingTitle}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
               {/* Status Badge (visual only) */}
               <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  action.actionStatus === "completed" ? "bg-green-100 text-green-700" :
                  action.actionStatus === "open" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-700"
               }`}>
                 {action.actionStatus === "completed" ? "Completed" : action.actionStatus === "open" ? "Open" : "Action"}
               </span>
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
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
          Action List 
          <span className="text-sm font-normal text-muted-foreground ml-2">
            Track, update, and complete your Actions
          </span>
        </h1>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <div className="flex items-center justify-between border-b pb-0 mb-6">
          <TabsList className="bg-transparent h-auto p-0 rounded-none border-none space-x-6">
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
          <div className="flex items-center text-sm font-medium text-slate-600 bg-white border px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
            <User className="mr-2 h-4 w-4 text-gray-400" />
            Owner <span className="mx-1 text-gray-300">|</span> All
          </div>
        </div>

        <TabsContent value="current" className="mt-0">
           {renderActionsList(currentActions, "No current actions have been created yet.")}
        </TabsContent>
        <TabsContent value="completed" className="mt-0">
           {renderActionsList(completedActions, "No completed actions found.")}
        </TabsContent>
        <TabsContent value="cancelled" className="mt-0">
           {renderActionsList(cancelledActions, "No cancelled actions found.")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
