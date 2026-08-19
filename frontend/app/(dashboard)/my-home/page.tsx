"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, MoreHorizontal, PenTool, CheckSquare, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";

function formatMeetingDate(dateString: string) {
  const d = new Date(dateString);
  const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  const year = d.getFullYear();
  return { month, day, year };
}

export default function MyHomePage() {
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId || user?.memberships?.[0]?.organisation?.id;
  const orgName = user?.memberships?.find((m: any) => (m.organisationId || m.organisation?.id) === orgId)?.organisation?.name || "Organisation";

  const { data: meetings = [], isLoading: loadingMeetings } = useQuery({
    queryKey: ["meetings", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await api.get(`/meetings`, {
        params: { organisationId: orgId }
      });
      return res.data.data || [];
    },
    enabled: !!orgId,
  });

  const { data: actions = [], isLoading: loadingActions } = useQuery({
    queryKey: ["global-actions", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await api.get(`/minutes/actions`, {
        params: { organisationId: orgId }
      });
      return res.data.data || [];
    },
    enabled: !!orgId,
  });

  const { data: pendingSignatures = [], isLoading: loadingSignatures } = useQuery({
    queryKey: ["pending-signatures", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await api.get(`/minutes/pending-signatures`, {
        params: { organisationId: orgId }
      });
      return res.data.data || [];
    },
    enabled: !!orgId,
  });

  const today = new Date().toISOString().split('T')[0];
  const upcomingMeetings = meetings.filter((m: any) => m.date >= today);
  const pastMeetings = meetings.filter((m: any) => m.date < today);
  
  const myActions = actions.filter((a: any) => a.assigneeId === user?.id && a.status !== "COMPLETED");

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto space-y-8 md:space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
          My SegueMeet Dashboard 
          <span className="text-sm font-normal text-muted-foreground ml-2">
            All meetings and key activities across all boards and committees
          </span>
        </h1>
      </div>

      {/* Top Section - Meetings */}
      <Tabs defaultValue="upcoming" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-0 mb-6 gap-4 sm:gap-0">
          <TabsList className="bg-transparent h-auto p-0 rounded-none border-none flex-nowrap overflow-x-auto w-full justify-start space-x-4 md:space-x-6 scrollbar-hide">
            <TabsTrigger 
              value="upcoming" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-700"
            >
              My Upcoming Meetings
              <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700 hover:bg-purple-100 rounded-full px-2">
                {upcomingMeetings.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="past"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-muted-foreground"
            >
              Past Meetings
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center text-sm font-medium text-slate-600 bg-gray-100 px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-200 transition-colors">
            <Calendar className="mr-2 h-4 w-4" />
            Next 90 days
          </div>
        </div>

        <TabsContent value="upcoming" className="mt-0">
          <div className="space-y-4">
            {loadingMeetings ? (
               <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : upcomingMeetings.length === 0 ? (
               <div className="text-muted-foreground text-center py-8">No upcoming meetings</div>
            ) : (
              upcomingMeetings.map((meeting: any) => (
                <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow group cursor-pointer gap-4 sm:gap-0">
                  {/* Date block */}
                  <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg w-16 h-16 sm:mr-6 shrink-0">
                    <span className="text-[10px] font-bold text-gray-500 tracking-wider leading-none mb-1">{formatMeetingDate(meeting.date).month}</span>
                    <span className="text-xl font-bold text-slate-700 leading-none">{formatMeetingDate(meeting.date).day}</span>
                    <span className="text-[10px] font-bold text-gray-500 tracking-wider leading-none mt-1">{formatMeetingDate(meeting.date).year}</span>
                  </div>
                  
                  {/* Meeting info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 bg-emerald-100 rounded-sm flex items-center justify-center text-[10px] font-bold text-emerald-700">
                          {orgName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-muted-foreground">{orgName}</span>
                      </div>
                    <h3 className="font-semibold text-lg text-slate-800 truncate group-hover:text-primary transition-colors">{meeting.title}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-500 mt-2 sm:mt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 shrink-0" />
                        {meeting.startTime} {parseInt(meeting.startTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                      </div>
                      <div className="flex items-center gap-1.5 line-clamp-1">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">{meeting.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action menu */}
                  <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 shrink-0">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                </Link>
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="past">
          <div className="space-y-4">
             {loadingMeetings ? (
               <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
             ) : pastMeetings.length === 0 ? (
               <div className="text-muted-foreground text-center py-8">No past meetings</div>
             ) : (
                pastMeetings.map((meeting: any) => (
                  <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow group cursor-pointer opacity-70 gap-4 sm:gap-0">
                    {/* Date block */}
                    <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg w-16 h-16 sm:mr-6 shrink-0">
                      <span className="text-[10px] font-bold text-gray-500 tracking-wider leading-none mb-1">{formatMeetingDate(meeting.date).month}</span>
                      <span className="text-xl font-bold text-slate-700 leading-none">{formatMeetingDate(meeting.date).day}</span>
                      <span className="text-[10px] font-bold text-gray-500 tracking-wider leading-none mt-1">{formatMeetingDate(meeting.date).year}</span>
                    </div>
                    
                    {/* Meeting info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 bg-emerald-100 rounded-sm flex items-center justify-center text-[10px] font-bold text-emerald-700">
                          {orgName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-muted-foreground">{orgName}</span>
                      </div>
                      <h3 className="font-semibold text-lg text-slate-800 truncate group-hover:text-primary transition-colors">{meeting.title}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-500 mt-2 sm:mt-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 shrink-0" />
                          {meeting.startTime} {parseInt(meeting.startTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                        </div>
                        <div className="flex items-center gap-1.5 line-clamp-1">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{meeting.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action menu */}
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 shrink-0">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                  </Link>
                ))
             )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Bottom Section - Tasks */}
      <Tabs defaultValue="signature" className="w-full">
        <div className="border-b mb-6">
          <TabsList className="bg-transparent h-auto p-0 rounded-none border-none space-x-6">
            <TabsTrigger 
              value="signature" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-semibold text-slate-700"
            >
              Signature Required
              {pendingSignatures.length > 0 && (
                <Badge variant="destructive" className="ml-2 rounded-full px-2">
                  {pendingSignatures.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="actions"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-semibold text-muted-foreground"
            >
              Actions
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="signature" className="mt-0">
          {loadingSignatures ? (
             <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
          ) : pendingSignatures.length === 0 ? (
            <div className="border rounded-xl bg-white p-16 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="bg-gray-50 p-4 rounded-2xl mb-4">
                <PenTool className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 text-sm">No documents are waiting for you to sign.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSignatures.map((min: any) => (
                <Link key={min.id} href={`/meetings/${min.meeting.id}/minutes`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow group cursor-pointer gap-4 sm:gap-0">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                        <PenTool className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 break-words">{min.meeting.title} - Minutes</p>
                        <p className="text-xs text-slate-500 mt-1">Date: {min.meeting.date}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50 self-start sm:self-auto shrink-0">Sign now</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="actions" className="mt-0">
          {loadingActions ? (
             <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
          ) : myActions.length === 0 ? (
            <div className="border rounded-xl bg-white p-16 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="bg-gray-50 p-4 rounded-2xl mb-4">
                <CheckSquare className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 text-sm">No actions have been assigned to you.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myActions.map((action: any) => (
                <div key={action.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl p-4 bg-white shadow-sm gap-4 sm:gap-0">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 break-words">{action.description}</p>
                      <p className="text-xs text-slate-500 mt-1">Due: {action.dueDate || "No date"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 self-start sm:self-auto shrink-0">{action.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}