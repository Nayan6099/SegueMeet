"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockMeetings } from "@/lib/mock-meetings";
import { mockAgendas } from "@/lib/mock-agenda";
import { mockMinutes, mockMinutesStatus } from "@/lib/mock-minutes";
import { MinuteBlock, MinuteBlockType, MinutesStatus } from "@/lib/types";

const statusLabels: Record<MinutesStatus, string> = {
  not_started: "Not started",
  draft: "Draft",
  in_review: "In review",
  confirmed: "Confirmed",
};

export default function MinutesPage() {
  const params = useParams<{ meetingId: string }>();
  const router = useRouter();

  const meeting = mockMeetings.find((m) => m.id === params.meetingId);
  const sections = mockAgendas[params.meetingId] ?? [];
  const [blocks, setBlocks] = useState<MinuteBlock[]>(
    mockMinutes[params.meetingId] ?? []
  );
  const [status, setStatus] = useState<MinutesStatus>(
    mockMinutesStatus[params.meetingId] ?? "not_started"
  );
  const [showChecklist, setShowChecklist] = useState(false);

  if (!meeting) {
    return <p className="text-muted-foreground">Meeting not found.</p>;
  }

  if (meeting.agendaStatus !== "published") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Minutes</h1>
        <p className="mt-4 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          Minutes can only be taken once the agenda is published. Go to the
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

  const locked = status === "confirmed";
  const allItems = sections.flatMap((s) =>
    s.items.map((item) => ({ ...item, sectionTitle: s.title }))
  );

  function blocksFor(agendaItemId: string) {
    return blocks.filter((b) => b.agendaItemId === agendaItemId);
  }

  function addBlock(agendaItemId: string, blockType: MinuteBlockType) {
    setBlocks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        agendaItemId,
        blockType,
        content: "",
        ...(blockType === "decision"
          ? { decisionOutcome: "approved", mover: "", seconder: "" }
          : {}),
        ...(blockType === "action"
          ? { actionOwner: "", actionDueDate: "" }
          : {}),
      },
    ]);
    if (status === "not_started") setStatus("draft");
  }

  function updateBlock(id: string, patch: Partial<MinuteBlock>) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function finishDraft() {
    setStatus("in_review");
    setShowChecklist(true);
  }

  function confirmMinutes() {
    setStatus("confirmed");
    setShowChecklist(false);
  }

  function rollBack() {
    setStatus("draft");
    setShowChecklist(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {meeting.title} — Minutes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meeting.date} · {meeting.startTime}–{meeting.endTime}
          </p>
        </div>
        <Badge variant={status === "confirmed" ? "default" : "secondary"}>
          {statusLabels[status]}
        </Badge>
      </div>

      {showChecklist && (
        <div className="mt-4 space-y-2 rounded-md border border-border bg-muted/50 p-4">
          <p className="text-sm font-medium">Minutes are in review</p>
          <p className="text-sm text-muted-foreground">
            These steps are optional and can be done anytime — nothing here
            sends automatically.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Send minutes to the board</li>
            <li>• Send action notices to owners</li>
            <li>• Schedule confirmation for the next meeting</li>
          </ul>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {allItems.map((item) => (
          <div
            key={item.id}
            className="rounded-md border border-border bg-card p-4"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {item.sectionTitle}
            </p>
            <h3 className="mt-1 font-medium">{item.title}</h3>

            <div className="mt-3 space-y-3">
              {blocksFor(item.id).map((block) => (
                <MinuteBlockEditor
                  key={block.id}
                  block={block}
                  locked={locked}
                  onChange={(patch) => updateBlock(block.id, patch)}
                  onRemove={() => removeBlock(block.id)}
                />
              ))}
            </div>

            {!locked && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => addBlock(item.id, "note")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  + Note
                </button>
                <button
                  onClick={() => addBlock(item.id, "decision")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  + Decision
                </button>
                <button
                  onClick={() => addBlock(item.id, "action")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  + Action
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3">
        {status === "draft" && (
          <button
            onClick={finishDraft}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Finish draft minutes
          </button>
        )}
        {status === "in_review" && (
          <>
            <button
              onClick={confirmMinutes}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Confirm minutes
            </button>
            <button
              onClick={rollBack}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Roll back to draft
            </button>
          </>
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

function MinuteBlockEditor({
  block,
  locked,
  onChange,
  onRemove,
}: {
  block: MinuteBlock;
  locked: boolean;
  onChange: (patch: Partial<MinuteBlock>) => void;
  onRemove: () => void;
}) {
  const typeLabel =
    block.blockType === "note"
      ? "Note"
      : block.blockType === "decision"
      ? "Decision"
      : "Action";

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <Badge variant="outline">{typeLabel}</Badge>
        {!locked && (
          <button
            onClick={onRemove}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        )}
      </div>

      <Textarea
        className="mt-2"
        placeholder={
          block.blockType === "note"
            ? "What was discussed..."
            : block.blockType === "decision"
            ? "What was decided..."
            : "What needs to happen..."
        }
        value={block.content}
        disabled={locked}
        onChange={(e) => onChange({ content: e.target.value })}
      />

      {block.blockType === "decision" && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Select
            value={block.decisionOutcome}
            disabled={locked}
            onValueChange={(v) =>
              onChange({ decisionOutcome: v as MinuteBlock["decisionOutcome"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="deferred">Deferred</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Mover"
            value={block.mover}
            disabled={locked}
            onChange={(e) => onChange({ mover: e.target.value })}
          />
          <Input
            placeholder="Seconder"
            value={block.seconder}
            disabled={locked}
            onChange={(e) => onChange({ seconder: e.target.value })}
          />
        </div>
      )}

      {block.blockType === "action" && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Input
            placeholder="Owner"
            value={block.actionOwner}
            disabled={locked}
            onChange={(e) => onChange({ actionOwner: e.target.value })}
          />
          <Input
            type="date"
            value={block.actionDueDate}
            disabled={locked}
            onChange={(e) => onChange({ actionDueDate: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}