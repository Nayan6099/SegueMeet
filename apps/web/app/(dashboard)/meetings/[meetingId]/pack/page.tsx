"use client";

import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { mockMeetings } from "@/lib/mock-meetings";
import { mockAgendas } from "@/lib/mock-agenda";

const purposeLabels: Record<string, string> = {
  none: "—",
  for_noting: "For noting",
  for_decision: "For decision",
  for_discussion: "For discussion",
};

export default function BoardPackPage() {
  const params = useParams<{ meetingId: string }>();
  const router = useRouter();

  const meeting = mockMeetings.find((m) => m.id === params.meetingId);
  const sections = mockAgendas[params.meetingId] ?? [];

  if (!meeting) {
    return <p className="text-muted-foreground">Meeting not found.</p>;
  }

  if (meeting.agendaStatus !== "published") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Board Pack</h1>
        <p className="mt-4 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          This meeting's agenda hasn't been published yet. The Board Pack
          compiles automatically once the agenda is published — go to the
          Agenda tab and publish it first.
        </p>
        <button
          onClick={() => router.push(`/meetings/${meeting.id}/agenda`)}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Go to agenda
        </button>
      </div>
    );
  }

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const totalMinutes = sections.reduce(
    (sum, s) => sum + s.items.reduce((a, i) => a + i.durationMinutes, 0),
    0
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Board Pack
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Auto-compiled from the published agenda
          </p>
        </div>
        <button
          disabled
          title="PDF export needs the backend — coming once apps/api is wired up"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50"
        >
          Download PDF
        </button>
      </div>

      {/* Cover page */}
      <div className="mt-6 rounded-md border border-border bg-card p-8 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Board Pack
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          {meeting.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {meeting.date} · {meeting.startTime}–{meeting.endTime} ·{" "}
          {meeting.location}
        </p>
        <div className="mt-4 flex justify-center gap-6 text-xs text-muted-foreground">
          <span>{sections.length} sections</span>
          <span>{totalItems} items</span>
          <span>~{totalMinutes} min</span>
        </div>
      </div>

      {/* Table of contents */}
      <div className="mt-6 rounded-md border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">
          Agenda
        </h3>
        <ol className="mt-3 space-y-1 text-sm">
          {sections.map((s, idx) => (
            <li key={s.id}>
              <span className="text-muted-foreground">{idx + 1}.</span>{" "}
              {s.title}
            </li>
          ))}
        </ol>
      </div>

      {/* Papers — one block per section, matching the printed pack layout */}
      <div className="mt-6 space-y-6">
        {sections.map((section, idx) => (
          <div
            key={section.id}
            className="rounded-md border border-border bg-card p-6"
          >
            <h3 className="text-lg font-semibold">
              {idx + 1}. {section.title}
            </h3>
            <div className="mt-4 space-y-3">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Presenter: {item.presenter || "—"} ·{" "}
                      {item.durationMinutes} min
                    </p>
                  </div>
                  <Badge variant="outline">
                    {purposeLabels[item.purpose]}
                  </Badge>
                </div>
              ))}
              {section.items.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No items in this section.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}