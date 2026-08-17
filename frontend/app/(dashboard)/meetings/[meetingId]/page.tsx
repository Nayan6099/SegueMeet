"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  MoreVertical,
  Download,
  Eye
} from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function MeetingOverviewPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = use(params);

  // Mock data for the meeting
  const meeting = {
    title: "August Board Meeting",
    status: "Draft",
    date: "20 Aug 2026",
    time: "9:00 am - 12:00 pm",
    location: "https://meet.google.com/xyz",
    admin: "Kartikey Agrahari",
    expected: ["Alice Smith", "Bob Johnson", "Charlie Brown"],
    apologies: [],
    guests: ["David Guest"],
  };

  const UserPill = ({ name }: { name: string }) => (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
        {name.charAt(0)}
      </div>
      <span className="text-sm text-slate-700">{name}</span>
    </div>
  );

  const DocumentRow = ({ title, meta }: { title: string, meta: string }) => (
    <div className="flex items-center justify-between p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 group transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-50 rounded text-red-500">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{meta}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800">
          <Eye className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800">
          <Download className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-slate-800">{meeting.title}</h1>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">
            {meeting.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/meetings/${meetingId}/agenda`}>
            <Button variant="outline" className="border-slate-300 text-slate-700 h-9 font-medium">
              Edit Agenda
            </Button>
          </Link>
          <Button className="bg-[#1e1b4b] hover:bg-[#2e2b5b] text-white h-9 font-medium">
            Publish Agenda
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Meeting Details */}
        <div className="col-span-1 space-y-8">
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-800">Date</p>
                <p className="text-sm text-slate-600">{meeting.date}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-800">Time</p>
                <p className="text-sm text-slate-600">{meeting.time}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-800">Location</p>
                <a href="#" className="text-sm text-blue-600 hover:underline">{meeting.location}</a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Meeting Administrator</h3>
            <UserPill name={meeting.admin} />
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Expected ({meeting.expected.length})</h3>
            {meeting.expected.map(name => <UserPill key={name} name={name} />)}
            
            <h3 className="text-sm font-semibold text-slate-800 mt-6 mb-3">Apologies ({meeting.apologies.length})</h3>
            {meeting.apologies.length === 0 && <p className="text-sm text-slate-500 italic mb-2">None</p>}
            
            <h3 className="text-sm font-semibold text-slate-800 mt-6 mb-3">Guests ({meeting.guests.length})</h3>
            {meeting.guests.map(name => <UserPill key={name} name={name} />)}
            
            <Link href="#" className="text-sm text-blue-600 hover:underline mt-4 inline-block font-medium">
              Send an update to attendees
            </Link>
          </div>
          
        </div>

        {/* Right Column: Tabs */}
        <div className="col-span-2">
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="bg-transparent h-auto p-0 rounded-none border-b border-slate-200 w-full justify-start space-x-8 mb-6">
              <TabsTrigger
                value="notices"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-medium text-slate-500"
              >
                Notices
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-medium text-slate-500"
              >
                Attendance
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-medium text-slate-500"
              >
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="votes"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-medium text-slate-500"
              >
                Votes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-6">
              
              {/* Document Section 1 */}
              <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800">August Board Meeting</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  <DocumentRow 
                    title="August Board Meeting - Agenda" 
                    meta="PDF • Generated 14/08/2026 • 1 Page" 
                  />
                </div>
              </div>

              {/* Document Section 2 */}
              <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800">Consent Agenda</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  <DocumentRow 
                    title="Previous Meeting Minutes" 
                    meta="PDF • Uploaded 12/08/2026 • 3 Pages" 
                  />
                  <DocumentRow 
                    title="Health and Safety Report" 
                    meta="PDF • Uploaded 13/08/2026 • 2 Pages" 
                  />
                </div>
              </div>

              {/* Document Section 3 */}
              <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800">Chief Executive's Report</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  <DocumentRow 
                    title="CEO Monthly Update - July" 
                    meta="PDF • Uploaded 14/08/2026 • 5 Pages" 
                  />
                </div>
              </div>

            </TabsContent>

            <TabsContent value="notices" className="p-8 text-center text-slate-500 border rounded-lg bg-white mt-4">
              No notices for this meeting.
            </TabsContent>
            <TabsContent value="attendance" className="p-8 text-center text-slate-500 border rounded-lg bg-white mt-4">
              Attendance tracking is disabled until the meeting starts.
            </TabsContent>
            <TabsContent value="votes" className="p-8 text-center text-slate-500 border rounded-lg bg-white mt-4">
              No active votes for this meeting.
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </div>
  );
}
