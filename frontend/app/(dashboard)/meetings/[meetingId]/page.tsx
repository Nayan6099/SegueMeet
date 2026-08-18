"use client";

import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  FileText, 
  MoreVertical,
  Folder,
  Info,
  Clock,
  HelpCircle
} from "lucide-react";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { BuildAgendaModal } from "@/components/meetings/build-agenda-modal";
import { useRouter } from "next/navigation";

export default function MeetingOverviewPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = use(params);
  const router = useRouter();
  const [isBuildAgendaOpen, setIsBuildAgendaOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: async () => {
      const res = await api.get(`/meetings/${meetingId}`);
      return res.data;
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members", meeting?.organisationId],
    queryFn: async () => {
      if (!meeting?.organisationId) return [];
      const res = await api.get(`/organisations/${meeting.organisationId}/members`);
      return res.data;
    },
    enabled: !!meeting?.organisationId,
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col">
        <p className="text-muted-foreground">Failed to load meeting details.</p>
      </div>
    );
  }

  const handleDownloadBoardPack = async () => {
    try {
      setIsGeneratingPdf(true);
      const res = await api.get(`/meetings/${meetingId}/board-pack/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Formatting helpers
  const dateObj = new Date(meeting.scheduledStartDate);
  const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const startTimeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  const endTimeStr = new Date(meeting.scheduledEndDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  
  // Calculate duration in hours
  const diffMs = new Date(meeting.scheduledEndDate).getTime() - dateObj.getTime();
  const diffHrs = Math.round(diffMs / (1000 * 60 * 60));

  const creatorName = members.find((m: any) => m.user.id === meeting.creatorId)?.user.name || "nayan mishra";

  return (
    <div className="max-w-5xl mx-auto p-8">
      
      {/* Top right buttons */}
      <div className="flex justify-end gap-2 mb-6">
        <Button variant="outline" disabled className="text-slate-600 bg-white border-slate-200 shadow-sm h-8 px-3 text-xs font-medium rounded-md">
          <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" /> Notice
        </Button>
        <Button onClick={() => router.push(`/meetings/${meetingId}/agenda`)} variant="outline" className="text-slate-600 bg-white border-slate-200 shadow-sm h-8 px-3 text-xs font-medium rounded-md">
          <FileText className="w-3.5 h-3.5 mr-2 text-slate-400" /> Agenda
        </Button>
        <Button 
          variant="outline" 
          onClick={handleDownloadBoardPack}
          disabled={isGeneratingPdf}
          className="text-slate-600 bg-white border-slate-200 shadow-sm h-8 px-3 text-xs font-medium rounded-md"
        >
          {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin text-slate-400" /> : <Folder className="w-3.5 h-3.5 mr-2 text-slate-400" />} 
          Board Pack
        </Button>
        <Button onClick={() => router.push(`/meetings/${meetingId}/minutes`)} variant="outline" className="text-slate-600 bg-white border-slate-200 shadow-sm h-8 px-3 text-xs font-medium rounded-md">
          <FileText className="w-3.5 h-3.5 mr-2 text-slate-400" /> Minutes
        </Button>
        <Button variant="outline" size="icon" className="text-slate-600 bg-white border-slate-200 shadow-sm h-8 w-8 rounded-md">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* Header Row */}
      <div className="flex justify-between items-start mb-12">
        <h1 className="text-[32px] font-normal text-slate-800">{meeting.title}</h1>
        
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">No Agenda</span>
          <Button 
            onClick={() => setIsBuildAgendaOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded font-medium px-4 h-8 text-sm shadow-sm"
          >
            Build Agenda
          </Button>
        </div>
      </div>

      <BuildAgendaModal 
        isOpen={isBuildAgendaOpen} 
        onOpenChange={setIsBuildAgendaOpen} 
        meetingId={meeting.id} 
      />

      {/* Main Details Grid */}
      <div className="grid grid-cols-[240px_1fr] gap-y-8">
        
        {/* Date */}
        <div className="text-sm font-semibold text-slate-700 pt-1">Date:</div>
        <div className="text-sm text-slate-800 flex items-center gap-3">
          {dateStr} <span className="text-slate-400 text-xs">(IST)</span>
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-medium cursor-pointer hover:underline">Meeting Time</span>
            <div className="w-8 h-4 bg-slate-300 rounded-full relative cursor-pointer">
              <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-[1px] left-[1px]"></div>
            </div>
            <span className="text-blue-600 font-medium cursor-pointer hover:underline">My Time</span>
          </div>
        </div>

        {/* Time */}
        <div className="text-sm font-semibold text-slate-700 pt-1">Time:</div>
        <div className="text-sm text-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <span>{startTimeStr}</span>
            <span className="text-slate-400">-</span>
            <span>{endTimeStr}</span>
            <span className="text-slate-500 ml-2">{diffHrs} hrs</span>
          </div>
          <button className="text-blue-600 font-medium flex items-center gap-1.5 text-xs hover:underline">
            <Calendar className="w-3.5 h-3.5" />
            Add To Calendar
          </button>
        </div>

        {/* Location */}
        <div className="text-sm font-semibold text-slate-700 pt-1">Location:</div>
        <div className="text-sm text-slate-600 leading-relaxed">
          {meeting.location ? (
            <>
              {meeting.location.includes(',') ? (
                <>
                  <div className="text-slate-800">Default Location</div>
                  {meeting.location}
                  <div className="mt-1">Time zone: Asia/Kolkata</div>
                </>
              ) : (
                meeting.location
              )}
            </>
          ) : (
            "Default Location\nGhaziabad, Uttar Pradesh, India\nTime zone: Asia/Kolkata"
          )}
        </div>

        {/* Video URL */}
        <div className="text-sm font-semibold text-slate-700 pt-1">Video URL:</div>
        <div>
          <button className="text-blue-600 font-medium text-sm hover:underline">
            Add Meeting URL
          </button>
        </div>

        {/* Meeting Administrator */}
        <div className="text-sm font-semibold text-slate-700 pt-1 mt-2">Meeting Administrator:</div>
        <div className="mt-2">
          <select className="border border-slate-200 rounded text-sm px-3 py-1.5 w-64 text-slate-700 bg-transparent outline-none">
            <option>{creatorName}</option>
          </select>
        </div>

        {/* Spacer / Banner */}
        <div className="col-span-2 my-2 w-[550px] ml-[240px]">
          <div className="bg-amber-50/50 border border-amber-200/60 rounded p-4 flex gap-3 text-sm">
            <div className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              !
            </div>
            <div>
              <span className="font-semibold text-amber-800">Confirm your email:</span>
              <span className="text-amber-800 ml-1">Check inbox to confirm your email address. Didn't receive the email? </span>
              <button className="font-semibold text-amber-800 underline hover:text-amber-900">Resend</button>
            </div>
          </div>
        </div>

        {/* Attendees / Apologies */}
        <div className="text-sm font-semibold text-slate-700 pt-1 mt-4">Attendees/Apologies:</div>
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-4 w-[550px]">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Attendees</h4>
              <div className="border border-blue-200 bg-blue-50/30 rounded p-2 text-sm text-slate-700 flex justify-between items-center cursor-pointer">
                {creatorName}
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Apologies</h4>
              <div className="bg-slate-100 rounded p-2 text-sm text-slate-400 h-9">
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            NOTE: You can drag and move people between Attendees or Apologies.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <Button variant="outline" className="h-8 px-4 text-xs font-medium text-slate-600">
              Add from People List
            </Button>
            <div className="w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold text-[10px] cursor-help">
              !
            </div>
          </div>
        </div>

        {/* Guests */}
        <div className="text-sm font-semibold text-slate-700 pt-1 mt-2">Guests:</div>
        <div className="mt-2">
          <p className="text-sm text-slate-500">
            Separate guest names with commas. E.g. John Smith, Carol Kiggs, Chris Jones
          </p>
        </div>

        {/* Notes */}
        <div className="text-sm font-semibold text-slate-700 pt-1 mt-2">Notes:</div>
        <div className="mt-2">
          <p className="text-sm text-emerald-600 hover:underline cursor-pointer">
            Click here to add some notes at the top of the Agenda
          </p>
        </div>

      </div>
    </div>
  );
}
