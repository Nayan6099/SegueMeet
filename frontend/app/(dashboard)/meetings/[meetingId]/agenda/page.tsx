"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockAgendas } from "@/lib/mock-agenda";
import { mockMeetings } from "@/lib/mock-meetings";
import { AgendaSection, AgendaItem } from "@/lib/types";

const purposeLabels: Record<AgendaItem["purpose"], string> = {
  none: "—",
  for_noting: "For noting",
  for_decision: "For decision",
  for_discussion: "For discussion",
};

export default function AgendaBuilderPage() {
  const params = useParams<{ meetingId: string }>();
  const router = useRouter();
  const meeting = mockMeetings.find((m) => m.id === params.meetingId);

  const [sections, setSections] = useState<AgendaSection[]>(
    mockAgendas[params.meetingId] ?? []
  );
  const [published, setPublished] = useState(
    meeting?.agendaStatus === "published"
  );

  function addSection() {
    setSections((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: "New section", items: [] },
    ]);
  }

  function addItem(sectionId: string) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: [
                ...s.items,
                {
                  id: crypto.randomUUID(),
                  title: "New agenda item",
                  purpose: "none",
                  presenter: "",
                  durationMinutes: 5,
                },
              ],
            }
          : s
      )
    );
  }

  function updateItem(
    sectionId: string,
    itemId: string,
    patch: Partial<AgendaItem>
  ) {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              items: s.items.map((it) =>
                it.id === itemId ? { ...it, ...patch } : it
              ),
            }
      )
    );
  }

  function updateSectionTitle(sectionId: string, title: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s))
    );
  }

  if (!meeting) {
    return <p className="text-muted-foreground">Meeting not found.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {meeting.title} — Agenda
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meeting.date} · {meeting.startTime}–{meeting.endTime}
          </p>
        </div>
        <Badge variant={published ? "default" : "secondary"}>
          {published ? "Published" : "Draft"}
        </Badge>
      </div>

      {published && (
        <p className="mt-4 rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
          This agenda is published — structural edits are locked. Roll back
          to draft to make changes.
        </p>
      )}

      <div className="mt-6 space-y-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="rounded-md border border-border bg-card p-4"
          >
            <Input
              value={section.title}
              disabled={published}
              onChange={(e) =>
                updateSectionTitle(section.id, e.target.value)
              }
              className="mb-3 max-w-sm font-medium"
            />

            <div className="space-y-3">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 items-center gap-2 rounded-md border border-border p-3"
                >
                  <Input
                    className="col-span-4"
                    value={item.title}
                    disabled={published}
                    onChange={(e) =>
                      updateItem(section.id, item.id, {
                        title: e.target.value,
                      })
                    }
                  />
                  <Input
                    className="col-span-3"
                    placeholder="Presenter"
                    value={item.presenter}
                    disabled={published}
                    onChange={(e) =>
                      updateItem(section.id, item.id, {
                        presenter: e.target.value,
                      })
                    }
                  />
                  <Select
                    value={item.purpose}
                    disabled={published}
                    onValueChange={(v) =>
                      updateItem(section.id, item.id, {
                        purpose: v as AgendaItem["purpose"],
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(purposeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    className="col-span-2"
                    value={item.durationMinutes}
                    disabled={published}
                    onChange={(e) =>
                      updateItem(section.id, item.id, {
                        durationMinutes: Number(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
            </div>

            {!published && (
              <button
                onClick={() => addItem(section.id)}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                + Add agenda item
              </button>
            )}
          </div>
        ))}

        {!published && (
          <button
            onClick={addSection}
            className="rounded-md border border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            + Add section
          </button>
        )}
      </div>

      <div className="mt-8 flex items-center gap-3">
        {!published ? (
          <button
            onClick={() => setPublished(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Publish agenda
          </button>
        ) : (
          <button
            onClick={() => setPublished(false)}
            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Roll back to draft
          </button>
        )}
        <button
          onClick={() => router.push("/meetings")}
          className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Back to meetings
        </button>
      </div>
    </div>
  );
}