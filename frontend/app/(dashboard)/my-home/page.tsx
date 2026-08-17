import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { mockMeetings } from "@/lib/mock-meetings";
import { Calendar, Clock, MapPin, MoreHorizontal, PenTool, CheckSquare } from "lucide-react";

function formatMeetingDate(dateString: string) {
  const d = new Date(dateString);
  const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  const year = d.getFullYear();
  return { month, day, year };
}

export default function MyHomePage() {
  // Simple filter logic for mock data (assuming "today" is roughly Aug 14 2026 based on screenshots)
  const upcomingMeetings = mockMeetings.filter(m => new Date(m.date) >= new Date("2026-08-14"));
  const pastMeetings = mockMeetings.filter(m => new Date(m.date) < new Date("2026-08-14"));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
          My BoardPro Dashboard 
          <span className="text-sm font-normal text-muted-foreground ml-2">
            All meetings and key activities across all boards and committees
          </span>
        </h1>
      </div>

      {/* Top Section - Meetings */}
      <Tabs defaultValue="upcoming" className="w-full">
        <div className="flex items-center justify-between border-b pb-0 mb-6">
          <TabsList className="bg-transparent h-auto p-0 rounded-none border-none space-x-6">
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
            {upcomingMeetings.length === 0 ? (
               <div className="text-muted-foreground text-center py-8">No upcoming meetings</div>
            ) : (
              upcomingMeetings.map(meeting => (
                <div key={meeting.id} className="flex items-center border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                  {/* Date block */}
                  <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg w-16 h-16 mr-6 shrink-0">
                    <span className="text-[10px] font-bold text-gray-500 tracking-wider leading-none mb-1">{formatMeetingDate(meeting.date).month}</span>
                    <span className="text-xl font-bold text-slate-700 leading-none">{formatMeetingDate(meeting.date).day}</span>
                    <span className="text-[10px] font-bold text-gray-500 tracking-wider leading-none mt-1">{formatMeetingDate(meeting.date).year}</span>
                  </div>
                  
                  {/* Meeting info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 bg-gray-200 rounded-sm"></div>
                      <span className="text-sm text-muted-foreground">Kartikey Tech</span>
                    </div>
                    <h3 className="font-semibold text-lg text-slate-800 truncate group-hover:text-primary transition-colors">{meeting.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {meeting.startTime} {parseInt(meeting.startTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {meeting.location}
                      </div>
                    </div>
                  </div>

                  {/* Action menu */}
                  <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 shrink-0">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="past">
          <div className="space-y-4">
             {pastMeetings.length === 0 ? (
               <div className="text-muted-foreground text-center py-8">No past meetings</div>
             ) : (
                pastMeetings.map(meeting => (
                  <div key={meeting.id} className="flex items-center border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow group cursor-pointer opacity-70">
                    {/* Date block */}
                    <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg w-16 h-16 mr-6 shrink-0">
                      <span className="text-[10px] font-bold text-gray-500 tracking-wider leading-none mb-1">{formatMeetingDate(meeting.date).month}</span>
                      <span className="text-xl font-bold text-slate-700 leading-none">{formatMeetingDate(meeting.date).day}</span>
                      <span className="text-[10px] font-bold text-gray-500 tracking-wider leading-none mt-1">{formatMeetingDate(meeting.date).year}</span>
                    </div>
                    
                    {/* Meeting info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 bg-gray-200 rounded-sm"></div>
                        <span className="text-sm text-muted-foreground">Kartikey Tech</span>
                      </div>
                      <h3 className="font-semibold text-lg text-slate-800 truncate group-hover:text-primary transition-colors">{meeting.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {meeting.startTime} {parseInt(meeting.startTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {meeting.location}
                        </div>
                      </div>
                    </div>

                    {/* Action menu */}
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 shrink-0">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
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
          <div className="border rounded-xl bg-white p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="bg-gray-50 p-4 rounded-2xl mb-4">
              <PenTool className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 text-sm">No documents are waiting for you to sign.</p>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="mt-0">
          <div className="border rounded-xl bg-white p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="bg-gray-50 p-4 rounded-2xl mb-4">
              <CheckSquare className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 text-sm">No actions have been created yet.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}