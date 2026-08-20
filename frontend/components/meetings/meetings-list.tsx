"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddMeetingModal } from "@/components/meetings/add-meeting-modal";
import { Button } from "@/components/ui/button";

function agendaBadge(status: string) {
  return status === "published" ? (
    <Badge>Published</Badge>
  ) : (
    <Badge variant="secondary">Draft</Badge>
  );
}

function minutesBadge(status: string) {
  const labels: Record<string, string> = {
    not_started: "Not started",
    draft: "Draft",
    in_review: "In review",
    confirmed: "Confirmed",
  };
  return <Badge variant="outline">{labels[status]}</Badge>;
}

export function MeetingsList({ organisationId, committeeId }: { organisationId: string; committeeId?: string }) {
  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings", organisationId, committeeId],
    queryFn: async () => {
      if (!organisationId) return [];
      const res = await api.get(`/meetings`, {
        params: { organisationId, committeeId }
      });
      return res.data.data || [];
    },
    enabled: !!organisationId,
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = meetings.filter((m: any) => m.date >= today);
  const past = meetings.filter((m: any) => m.date < today);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AddMeetingModal 
          organisationId={organisationId} 
          trigger={
            <Button className="rounded-md bg-[#2d1b54] hover:bg-[#1a0f35] text-white px-4 py-2 text-sm font-semibold shadow-sm flex items-center gap-2 h-9">
              Add Meeting
            </Button>
          } 
        />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Upcoming</h2>
        <MeetingTable meetings={upcoming} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Past</h2>
        <MeetingTable meetings={past} />
      </section>
    </div>
  );
}

function MeetingTable({ meetings }: { meetings: any[] }) {
  if (meetings.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground bg-white">
        No meetings here yet.
      </p>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Agenda</TableHead>
            <TableHead>Minutes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {meetings.map((m: any) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">
                <Link href={`/meetings/${m.id}/agenda`} className="hover:underline">
                  {m.title}
                </Link>
              </TableCell>
              <TableCell>
                {new Date(m.date).toLocaleDateString()} {m.startTime}
              </TableCell>
              <TableCell>{m.location || 'N/A'}</TableCell>
              <TableCell>{agendaBadge(m.agenda?.status || 'draft')}</TableCell>
              <TableCell>{minutesBadge(m.minutes?.status || 'not_started')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
