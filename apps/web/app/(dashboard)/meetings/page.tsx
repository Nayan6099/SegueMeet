import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockMeetings } from "@/lib/mock-meetings";

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

export default function MeetingsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = mockMeetings.filter((m) => m.date >= today);
  const past = mockMeetings.filter((m) => m.date < today);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
        <Link
          href="/meetings/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Create meeting
        </Link>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Upcoming
        </h2>
        <MeetingTable meetings={upcoming} />
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Past
        </h2>
        <MeetingTable meetings={past} />
      </section>
    </div>
  );
}

function MeetingTable({ meetings }: { meetings: typeof mockMeetings }) {
  if (meetings.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
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
          {meetings.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">
                <Link href={`/meetings/${m.id}/agenda`} className="hover:underline">
                  {m.title}
                </Link>
              </TableCell>
              <TableCell>
                {m.date} · {m.startTime}–{m.endTime}
              </TableCell>
              <TableCell>{m.location}</TableCell>
              <TableCell>{agendaBadge(m.agendaStatus)}</TableCell>
              <TableCell>{minutesBadge(m.minutesStatus)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}