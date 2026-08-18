"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { api } from "@/lib/api";
import { MinuteBlock, MinuteBlockType, MinutesStatus } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useGetAgenda } from "@/hooks/use-agenda";
import { 
  useGetMinutes, 
  useUpdateMinutes, 
  useCreateActionItem, 
  useUpdateActionItem, 
  useDeleteActionItem 
} from "@/hooks/use-minutes";

const statusLabels: Record<MinutesStatus, string> = {
  not_started: "Not started",
  draft: "Draft",
  in_review: "In review",
  confirmed: "Confirmed",
};

export default function MinutesPage() {
  const params = useParams<{ meetingId: string }>();
  const meetingId = params.meetingId;
  const router = useRouter();
  const { data: agendaData, isLoading: loadingAgenda } = useGetAgenda(meetingId);
  const { data: minutes, isLoading: loadingMinutes } = useGetMinutes(meetingId);

  const [blocks, setBlocks] = useState<MinuteBlock[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);
  const queryClient = useQueryClient();

  const { data: members = [] } = useQuery({
    queryKey: ["members", agendaData?.organisationId],
    queryFn: async () => {
      if (!agendaData?.organisationId) return [];
      const res = await api.get(`/organisations/${agendaData.organisationId}/members`);
      return res.data;
    },
    enabled: !!agendaData?.organisationId,
  });

  const createActionItem = useCreateActionItem(meetingId);
  const updateActionItem = useUpdateActionItem(meetingId);
  const deleteActionItem = useDeleteActionItem(meetingId);

  // Sync state when data loads
  if (minutes && blocks.length === 0 && minutes.content && minutes.content !== "[]") {
    try {
      const parsed = JSON.parse(minutes.content);
      if (parsed.length > 0) setBlocks(parsed);
    } catch (e) {}
  }

  const updateMinutesCall = useUpdateMinutes(meetingId);

  const signMinutesCall = useMutation({
    mutationFn: async () => {
      if (!minutes?.id) throw new Error("No minutes ID");
      return api.post(`/minutes/${minutes.id}/sign`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["minutes", meetingId] }),
  });

  if (loadingAgenda || loadingMinutes) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!agendaData) {
    return <p className="text-muted-foreground">Meeting not found.</p>;
  }

  const meeting = agendaData;
  const sections = agendaData.agendaSections || [];
  const status = minutes?.status?.toLowerCase() || "draft";

  if (meeting.agendaStatus !== "PUBLISHED") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Minutes</h1>
        <p className="mt-4 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          Minutes can only be taken once the agenda is published. Go to the
          Agenda tab and publish it first.
        </p>
        <button
          onClick={() => router.push(`/meetings/${meetingId}/agenda`)}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Go to agenda
        </button>
      </div>
    );
  }

  const locked = status === "confirmed";
  const allItems = sections.flatMap((s: any) =>
    s.items.map((item: any) => ({ ...item, sectionTitle: s.title }))
  );

  function blocksFor(agendaItemId: string) {
    return blocks.filter((b) => b.agendaItemId === agendaItemId);
  }

  async function addBlock(agendaItemId: string, blockType: MinuteBlockType) {
    if (status === "draft" || status === "not_started") {
      updateMinutesCall.mutate({ minutesId: minutes.id, status: "DRAFT" });
    }

    let actionItemId = crypto.randomUUID();
    let defaultContent = "";

    if (blockType === "action" && minutes?.id) {
      // Create real action item in DB — hook returns res.data directly
      const createdItem = await createActionItem.mutateAsync(minutes.id);
      actionItemId = createdItem.id;
      defaultContent = createdItem.description || "";
    }

    setBlocks((prev) => [
      ...prev,
      {
        id: actionItemId,
        agendaItemId,
        blockType,
        content: defaultContent,
        ...(blockType === "decision"
          ? { decisionOutcome: "approved", mover: "", seconder: "" }
          : {}),
        ...(blockType === "action"
          ? { actionOwner: "", actionDueDate: "" }
          : {}),
      },
    ]);
  }

  function updateBlock(id: string, patch: Partial<MinuteBlock>) {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const updated = { ...b, ...patch };
          // If action, fire update to backend
          if (b.blockType === "action") {
            const backendPatch: any = {};
            if (patch.content !== undefined) backendPatch.description = patch.content;
            if (patch.actionOwner !== undefined) backendPatch.assigneeId = patch.actionOwner; // Note: assigneeId needs to be a real user ID in the future
            if (patch.actionDueDate !== undefined) backendPatch.dueDate = patch.actionDueDate || null;
            updateActionItem.mutate({ id, patch: backendPatch });
          }
          return updated;
        }
        return b;
      })
    );
  }

  function removeBlock(id: string) {
    const block = blocks.find(b => b.id === id);
    if (block?.blockType === "action") {
      deleteActionItem.mutate(id);
    }
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function finishDraft() {
    updateMinutesCall.mutate({ minutesId: minutes.id, status: "IN_REVIEW", content: JSON.stringify(blocks) });
    setShowChecklist(true);
  }

  function confirmMinutes() {
    updateMinutesCall.mutate({ minutesId: minutes.id, status: "CONFIRMED", content: JSON.stringify(blocks) });
    setShowChecklist(false);
  }

  function rollBack() {
    updateMinutesCall.mutate({ minutesId: minutes.id, status: "DRAFT" });
    setShowChecklist(false);
  }

  function saveContent() {
    updateMinutesCall.mutate({ minutesId: minutes.id, content: JSON.stringify(blocks) });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {meeting.title} — Minutes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(meeting.scheduledStartDate).toLocaleString()} - {new Date(meeting.scheduledEndDate).toLocaleTimeString()}
          </p>
        </div>
        <Badge variant={status === "confirmed" ? "default" : "secondary"}>
          {statusLabels[status as MinutesStatus] || status}
        </Badge>
      </div>

      {showChecklist && (
        <div className="mt-4 space-y-2 rounded-md border border-border bg-muted/50 p-4">
          <p className="text-muted-foreground">Draft minutes will be published for review</p>
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

      {minutes?.signatures?.length > 0 && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
          <h3 className="font-semibold text-green-800">Signatures ({minutes.signatures.length})</h3>
          <div className="mt-2 space-y-2">
            {minutes.signatures.map((sig: any) => (
              <div key={sig.id} className="text-sm text-green-700 flex flex-col">
                <span className="font-medium">{sig.signer?.name || sig.signerId}</span>
                <span className="text-xs text-green-600 opacity-80">Signed at {new Date(sig.signedAt).toLocaleString()}</span>
                <span className="text-[10px] font-mono break-all mt-1 opacity-60 bg-green-100 p-1 rounded">Hash: {sig.signatureHash}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-6">
        <div className="flex justify-end">
          <button
            onClick={saveContent}
            disabled={updateMinutesCall.isPending || locked}
            className="text-sm text-primary hover:underline"
          >
            {updateMinutesCall.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
        {allItems.map((item: any) => (
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
                  members={members}
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
        {status === "confirmed" && (
          <button
            onClick={() => signMinutesCall.mutate()}
            disabled={signMinutesCall.isPending}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {signMinutesCall.isPending ? "Signing..." : "Sign Document"}
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

function MinuteBlockEditor({
  block,
  locked,
  members = [],
  onChange,
  onRemove,
}: {
  block: MinuteBlock;
  locked: boolean;
  members?: any[];
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
          <Select
            value={block.actionOwner ? block.actionOwner : undefined}
            disabled={locked}
            onValueChange={(v) => onChange({ actionOwner: v as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Owner" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.user.id} value={m.user.id}>
                  {m.user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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