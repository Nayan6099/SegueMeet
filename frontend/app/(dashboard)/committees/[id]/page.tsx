"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Users, FileText, Calendar, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetCommittees } from "@/hooks/use-committees";
import { EditCommitteeModal } from "@/components/committees/edit-committee-modal";
import { useState } from "react";
import { MeetingsList } from "@/components/meetings/meetings-list";
import { DocumentsList } from "@/components/documents/documents-list";
import { DecisionsList } from "@/components/decisions/decisions-list";
import { MembersList } from "@/components/committees/members-list";

export default function CommitteeDetailPage() {
  const { id: committeeId } = useParams() as { id: string };
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId;
  const router = useRouter();

  const { data: committees = [], isLoading } = useGetCommittees(orgId);
  const committee = committees.find((c: any) => c.id === committeeId);

  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  if (!committee) {
    return <div className="p-8 text-center text-slate-500">Committee not found.</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <Button variant="ghost" className="pl-0 text-slate-500 hover:text-slate-800" onClick={() => router.back()}>
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{committee.name}</h1>
          {committee.description && <p className="text-slate-500 mt-1">{committee.description}</p>}
        </div>
        <Button variant="outline" onClick={() => setIsEditOpen(true)}>Edit Committee</Button>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-4 h-auto p-1 bg-slate-100/50">
          <TabsTrigger value="members" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <Users className="w-4 h-4 mr-2 hidden sm:inline" /> Members
          </TabsTrigger>
          <TabsTrigger value="meetings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <Calendar className="w-4 h-4 mr-2 hidden sm:inline" /> Meetings
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <FileText className="w-4 h-4 mr-2 hidden sm:inline" /> Documents
          </TabsTrigger>
          <TabsTrigger value="decisions" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <CheckSquare className="w-4 h-4 mr-2 hidden sm:inline" /> Decisions
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="members" className="m-0 focus-visible:outline-none">
            <MembersList committee={committee} />
          </TabsContent>

          <TabsContent value="meetings" className="m-0 focus-visible:outline-none">
            <MeetingsList organisationId={orgId!} committeeId={committeeId} />
          </TabsContent>

          <TabsContent value="documents" className="m-0 focus-visible:outline-none">
            <DocumentsList organisationId={orgId!} committeeId={committeeId} />
          </TabsContent>

          <TabsContent value="decisions" className="m-0 focus-visible:outline-none">
            <DecisionsList organisationId={orgId!} committeeId={committeeId} />
          </TabsContent>
        </div>
      </Tabs>

      {orgId && (
        <EditCommitteeModal
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          committee={committee}
          organisationId={orgId}
        />
      )}
    </div>
  );
}
