"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Loader2, ShieldCheck, User, Calendar, Activity } from "lucide-react";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "meeting.created":       { label: "Meeting Created",       color: "bg-emerald-100 text-emerald-700" },
  "meeting.updated":       { label: "Meeting Updated",       color: "bg-blue-100 text-blue-700" },
  "meeting.deleted":       { label: "Meeting Deleted",       color: "bg-red-100 text-red-700" },
  "meeting.attendee_added":{ label: "Attendee Added",        color: "bg-purple-100 text-purple-700" },
  "member.added":          { label: "Member Added",          color: "bg-emerald-100 text-emerald-700" },
  "member.updated":        { label: "Member Updated",        color: "bg-blue-100 text-blue-700" },
  "member.removed":        { label: "Member Removed",        color: "bg-red-100 text-red-700" },
  "agenda.published":      { label: "Agenda Published",      color: "bg-indigo-100 text-indigo-700" },
  "minutes.confirmed":     { label: "Minutes Confirmed",     color: "bg-teal-100 text-teal-700" },
  "document.uploaded":     { label: "Document Uploaded",     color: "bg-amber-100 text-amber-700" },
};

function formatAction(action: string) {
  const info = ACTION_LABELS[action];
  if (info) return info;
  // fallback: humanize the key
  const label = action.replace(/\./g, ' → ').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { label, color: "bg-slate-100 text-slate-600" };
}

export default function AuditLogPage() {
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId || user?.memberships?.[0]?.organisation?.id;

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["audit-logs", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await api.get(`/organisations/${orgId}/audit-logs`);
      return res.data;
    },
    enabled: !!orgId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await api.get(`/organisations/${orgId}/members`);
      return res.data;
    },
    enabled: !!orgId,
  });

  const getUserName = (actorId: string) => {
    const member = members.find((m: any) => m.user.id === actorId);
    return member?.user?.name || actorId.substring(0, 8) + "...";
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Failed to load audit logs. You may not have permission to view these.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-purple-100 p-2 rounded-xl">
          <ShieldCheck className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Audit Log</h1>
          <p className="text-sm text-slate-500">A complete history of all actions taken in your organisation.</p>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <Activity className="w-5 h-5 text-purple-500 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-slate-800">{logs.length}</div>
            <div className="text-xs text-slate-500">Total Events</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <User className="w-5 h-5 text-blue-500 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {new Set(logs.map((l: any) => l.actorId)).size}
            </div>
            <div className="text-xs text-slate-500">Unique Users</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <Calendar className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {logs.filter((l: any) => {
                const d = new Date(l.createdAt);
                const now = new Date();
                return d.toDateString() === now.toDateString();
              }).length}
            </div>
            <div className="text-xs text-slate-500">Today's Events</div>
          </div>
        </div>
      </div>

      {/* Log Table */}
      {logs.length === 0 ? (
        <div className="border rounded-xl bg-white p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <Activity className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No audit events yet</p>
          <p className="text-sm text-slate-400 mt-1">Actions like creating meetings, adding members, and publishing agendas will appear here.</p>
        </div>
      ) : (
        <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b">
              <tr>
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Entity</th>
                <th className="px-5 py-3 font-medium">Performed By</th>
                <th className="px-5 py-3 font-medium">Details</th>
                <th className="px-5 py-3 font-medium">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log: any) => {
                const { label, color } = formatAction(log.action);
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                        {label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      <span className="font-medium text-slate-700">{log.entityType}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {getUserName(log.actorId).charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-700 text-xs">{getUserName(log.actorId)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs max-w-[200px] truncate">
                      {log.payload ? JSON.stringify(log.payload) : "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
