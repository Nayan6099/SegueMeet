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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AgendaSection, AgendaItem } from "@/lib/types";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const purposeLabels: Record<AgendaItem["purpose"], string> = {
  none: "—",
  for_noting: "For noting",
  for_decision: "For decision",
  for_discussion: "For discussion",
};

export default function AgendaBuilderPage() {
  const params = useParams<{ meetingId: string }>();
  const meetingId = params.meetingId;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["agenda", meetingId],
    queryFn: async () => {
      const res = await api.get(`/meetings/${meetingId}/agenda`);
      return res.data;
    },
  });

  const { user } = useAuth();
  const orgId = data?.organisationId;
  const userRole = user?.memberships?.find((m: any) => m.organisationId === orgId)?.role;
  const isEditor = ["BOARD_ADMIN", "CHAIR", "SECRETARY"].includes(userRole || "");

  // Mutations
  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      return api.patch(`/meetings/${meetingId}`, { agendaStatus: status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] }),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members", data?.organisationId],
    queryFn: async () => {
      if (!data?.organisationId) return [];
      const res = await api.get(`/organisations/${data.organisationId}/members`);
      return res.data;
    },
    enabled: !!data?.organisationId,
  });

  const createSection = useMutation({
    mutationFn: async (title: string) => {
      return api.post(`/meetings/${meetingId}/agenda/sections`, { title });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] }),
  });

  const updateSectionTitle = useMutation({
    mutationFn: async ({ sectionId, title }: { sectionId: string; title: string }) => {
      return api.patch(`/agenda/sections/${sectionId}`, { title });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] }),
  });

  const deleteSection = useMutation({
    mutationFn: async (sectionId: string) => {
      return api.delete(`/agenda/sections/${sectionId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] }),
  });

  const createItem = useMutation({
    mutationFn: async (sectionId: string) => {
      return api.post(`/agenda/sections/${sectionId}/items`, {
        title: "New agenda item",
        purpose: "NONE",
        durationMinutes: 5,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] }),
  });

  const updateItemCall = useMutation({
    mutationFn: async ({ itemId, patch }: { itemId: string; patch: any }) => {
      // Map purpose none/for_noting to uppercase if needed by backend enum
      const payload = { ...patch };
      if (payload.purpose) {
        payload.purpose = payload.purpose.toUpperCase();
      }
      return api.patch(`/agenda/items/${itemId}`, payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      return api.delete(`/agenda/items/${itemId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] }),
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Meeting not found.</p>;
  }

  const meeting = data;
  const sections = data.agendaSections || [];
  const published = meeting.agendaStatus === "PUBLISHED";
  const disabled = published || !isEditor;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {meeting.title} — Agenda
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(meeting.scheduledStartDate).toLocaleString()} - {new Date(meeting.scheduledEndDate).toLocaleTimeString()}
          </p>
        </div>
        <Badge variant={published ? "default" : "secondary"}>
          {published ? "Published" : "Draft"}
        </Badge>
      </div>

      {(published || !isEditor) && (
        <p className="mt-4 rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
          {published 
            ? "This agenda is published — structural edits are locked." 
            : "You do not have permission to edit this agenda."}
        </p>
      )}

      <div className="mt-6 space-y-6">
        {sections.map((section: any) => (
          <div
            key={section.id}
            className="rounded-md border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Input
                key={section.title}
                defaultValue={section.title}
                disabled={disabled}
                onBlur={(e) => {
                  if (e.target.value !== section.title) {
                    updateSectionTitle.mutate({ sectionId: section.id, title: e.target.value });
                  }
                }}
                className="font-medium"
              />
              {!disabled && (
                <button 
                  onClick={() => deleteSection.mutate(section.id)}
                  className="p-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {section.items.map((item: any) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 items-center gap-2 rounded-md border border-border p-3"
                >
                  <Input
                    className="col-span-4"
                    key={item.title}
                    defaultValue={item.title}
                    disabled={disabled}
                    onBlur={(e) => {
                      if (e.target.value !== item.title) {
                        updateItemCall.mutate({ itemId: item.id, patch: { title: e.target.value } });
                      }
                    }}
                  />
                  <Input
                    className="col-span-3"
                    placeholder="Presenter"
                    key={item.presenter || "none"}
                    defaultValue={item.presenter || ""}
                    disabled={disabled}
                    onBlur={(e) => {
                      if (e.target.value !== item.presenter) {
                        updateItemCall.mutate({ itemId: item.id, patch: { presenter: e.target.value } });
                      }
                    }}
                  />
                  <Select
                    value={item.purpose?.toLowerCase()}
                    disabled={disabled}
                    onValueChange={(v) => {
                      updateItemCall.mutate({ itemId: item.id, patch: { purpose: v } });
                    }}
                  >
                    <SelectTrigger className="col-span-2">
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
                    key={item.durationMinutes}
                    defaultValue={item.durationMinutes}
                    disabled={disabled}
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (val !== item.durationMinutes) {
                        updateItemCall.mutate({ itemId: item.id, patch: { durationMinutes: val } });
                      }
                    }}
                  />
                  {!disabled && (
                    <div className="col-span-1 flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger>
                          <div className="p-2 text-muted-foreground hover:text-primary cursor-pointer">
                            <UserPlus className="h-4 w-4" />
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage Guest Access</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <p className="text-sm text-muted-foreground mb-4">
                              Select members who should have access to this item. (e.g., Guests/Observers)
                            </p>
                            {members?.map((m: any) => (
                              <div key={m.id} className="flex items-center space-x-2 mb-2">
                                <input
                                  type="checkbox"
                                  defaultChecked={item.guestAccess?.some((a: any) => a.memberId === m.id)}
                                  onChange={(e) => {
                                    const currentAccess = item.guestAccess?.map((a: any) => a.memberId) || [];
                                    const newAccess = e.target.checked
                                      ? [...currentAccess, m.id]
                                      : currentAccess.filter((id: string) => id !== m.id);
                                    api.post(`/meetings/${meetingId}/agenda/items/${item.id}/access`, { memberIds: newAccess })
                                      .then(() => queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] }));
                                  }}
                                />
                                <span className="text-sm">{m.user.name} ({m.role})</span>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <button 
                        onClick={() => deleteItem.mutate(item.id)}
                        className="p-2 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!disabled && (
              <button
                onClick={() => createItem.mutate(section.id)}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                + Add agenda item
              </button>
            )}
          </div>
        ))}

        {!disabled && (
          <button
            onClick={() => createSection.mutate("New Section")}
            className="rounded-md border border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            + Add section
          </button>
        )}
      </div>

      <div className="mt-8 flex items-center gap-3">
        {!published ? (
          <button
            onClick={() => updateStatus.mutate("PUBLISHED")}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Publish agenda
          </button>
        ) : (
          <button
            onClick={() => updateStatus.mutate("DRAFT")}
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