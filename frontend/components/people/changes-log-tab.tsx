"use client";

import { Info, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";

export function ChangesLogTab({ organisationId }: { organisationId: string }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", organisationId],
    queryFn: async () => {
      const res = await api.get(`/organisations/${organisationId}/audit-logs`);
      return res.data;
    },
    enabled: !!organisationId,
  });

  // Group logs by date
  const groupedLogs = logs.reduce((acc: any, log: any) => {
    const date = new Date(log.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  const renderActionMessage = (log: any) => {
    const actorName = log.actor?.name || "System";
    const boldActor = <span className="font-semibold text-slate-800">{actorName}</span>;

    switch (log.action) {
      case "organisation.created":
        return <>{boldActor} created the organisation with AI enabled</>;
      case "organisation.member_added":
        return <>{boldActor} added a user to the organisation</>;
      case "organisation.member_removed":
        return <>{boldActor} removed a user from the organisation</>;
      default:
        return <>{boldActor} performed action: {log.action.replace('_', ' ')}</>;
    }
  };

  const renderPayloadCard = (log: any) => {
    if (log.action === "organisation.member_added") {
      return (
        <div className="mt-2 border rounded-lg p-4 bg-white shadow-sm flex items-center justify-between">
          <div className="text-sm">
            <span className="font-semibold text-slate-800">{log.actor?.name}</span>{" "}
            <span className="text-slate-500">{log.actor?.email}</span>
            <div className="mt-2 text-slate-600">
              <p>Board Member: {log.payload?.role?.includes("BOARD") ? "Yes" : "No"}</p>
              <p>Position: {log.payload?.role?.replace('_', ' ')}</p>
              <p>Access Level: {log.payload?.role?.includes("ADMIN") ? "Administrator" : "Standard"}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100 flex items-center gap-1.5">
            No Access
          </span>
        </div>
      );
    }
    
    // Default fallback box
    return (
      <div className="mt-2 border rounded-lg p-4 bg-white shadow-sm flex items-center justify-between">
        <div className="text-sm">
          <span className="font-semibold text-slate-800">{log.actor?.name}</span>{" "}
          <span className="text-slate-500">{log.actor?.email}</span>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          Has Access
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Email Confirmation Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-800">Confirm your email</p>
          <p className="text-slate-600 mt-1">
            Check inbox to confirm your email address. Didn't receive the email?{" "}
            <button className="font-semibold underline hover:text-slate-800">Resend</button>
          </p>
        </div>
      </div>

      {/* Filters Mock */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-2 border-b">
        <select className="border rounded-md px-3 py-1.5 text-sm text-slate-700 bg-white shadow-sm w-full sm:w-48 outline-none">
          <option>Change by</option>
        </select>
        <select className="border rounded-md px-3 py-1.5 text-sm text-slate-700 bg-white shadow-sm w-full sm:w-48 outline-none">
          <option>Person</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-slate-500">No changes logged.</div>
      ) : (
        <div className="space-y-8 mt-6">
          {Object.entries(groupedLogs).map(([date, dayLogs]: [string, any]) => (
            <div key={date} className="relative">
              <div className="flex items-center gap-2 mb-6">
                <h4 className="font-semibold text-slate-800 text-sm">{date}</h4>
                <div className="w-4 h-4 bg-slate-800 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </div>

              <div className="absolute left-[88px] top-8 bottom-0 w-px bg-slate-200" />

              <div className="space-y-6">
                {dayLogs.map((log: any) => (
                  <div key={log.id} className="flex gap-4 relative z-10 pl-6">
                    <div className="w-16 shrink-0 text-right pt-0.5 text-xs text-slate-500 font-medium">
                      {format(new Date(log.createdAt), "h:mm a").toLowerCase()}
                    </div>
                    <div className="relative mt-1">
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 bg-white relative z-10" />
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm text-slate-600 mb-2">
                        {renderActionMessage(log)}
                      </p>
                      {renderPayloadCard(log)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
