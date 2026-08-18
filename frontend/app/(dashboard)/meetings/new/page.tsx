"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function NewMeetingPage() {
  const router = useRouter();
  const [isRemote, setIsRemote] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orgId = user?.memberships?.[0]?.organisationId || user?.memberships?.[0]?.organisation?.id;

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const payload = {
        organisationId: orgId,
        title: formData.get("title"),
        date: formData.get("date"),
        startTime: formData.get("startTime"),
        endTime: formData.get("endTime"),
        location: formData.get("location"),
        administrator: formData.get("administrator"),
        notes: formData.get("notes"),
        isRemote,
      };

      return api.post("/meetings", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      router.push("/meetings");
    },
    onSettled: () => setSubmitting(false),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgId) return alert("No organisation selected.");
    setSubmitting(true);
    mutation.mutate(new FormData(e.currentTarget));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">
        Create meeting
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This is the meeting&apos;s Notice — date, time, location and admin.
        You&apos;ll build the agenda in the next step.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Meeting title</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. September Board Meeting"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startTime">Start time</Label>
            <Input id="startTime" name="startTime" type="time" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End time</Label>
            <Input id="endTime" name="endTime" type="time" required />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="location">
              {isRemote ? "Video link" : "Location"}
            </Label>
            <button
              type="button"
              onClick={() => setIsRemote((v) => !v)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {isRemote ? "Switch to in-person" : "Switch to remote"}
            </button>
          </div>
          <Input
            id="location"
            name="location"
            placeholder={
              isRemote
                ? "e.g. https://meet.google.com/..."
                : "e.g. Conference Room A"
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="administrator">Meeting administrator</Label>
          {/* Phase 1 stub: real dropdown of Membership records comes once
              the People module + API exist. Free-text for now. */}
          <Input
            id="administrator"
            name="administrator"
            placeholder="e.g. Kartikey Yadav"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Anything attendees should know before the meeting"
            rows={4}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create meeting"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/meetings")}
            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}