"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const purposeLabels: Record<string, string> = {
  none: "—",
  for_noting: "For noting",
  for_decision: "For decision",
  for_discussion: "For discussion",
};

export default function BoardPackPage() {
  const params = useParams<{ meetingId: string }>();
  const router = useRouter();
  const meetingId = params.meetingId;

  const { user } = useAuth();
  const orgRole = user?.memberships?.[0]?.role;
  const canManagePack = orgRole === "BOARD_ADMIN" || orgRole === "CHAIR" || orgRole === "SECRETARY";

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["board-pack", meetingId],
    queryFn: async () => {
      const res = await api.get(`/meetings/${meetingId}/board-pack`);
      return res.data;
    },
  });

  const [downloading, setDownloading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  async function publishPack() {
    setPublishing(true);
    try {
      await api.post(`/meetings/${meetingId}/board-pack/publish`);
      toast.success("Board Pack published successfully!");
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to publish board pack.");
    } finally {
      setPublishing(false);
    }
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const res = await api.get(`/meetings/${meetingId}/board-pack/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${data?.meeting?.title || "Board Pack"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-muted-foreground">Failed to load board pack.</p>;
  }

  const meeting = data.meeting;
  const sections = data.agenda || [];

  if (meeting.agendaStatus !== "PUBLISHED") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Board Pack</h1>
        <p className="mt-4 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          This meeting&apos;s agenda hasn&apos;t been published yet.. The Board Pack
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

  const totalItems = sections.reduce((sum: number, s: any) => sum + s.items.length, 0);
  const totalMinutes = sections.reduce(
    (sum: number, s: any) => sum + s.items.reduce((a: number, i: any) => a + i.durationMinutes, 0),
    0
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Board Pack
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Auto-compiled from the published agenda
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {data.boardPack && (
            <Badge variant="secondary" className="font-normal text-xs py-1 px-2">
              Version {data.boardPack.version} · {new Date(data.boardPack.publishedAt).toLocaleDateString()}
            </Badge>
          )}

          {data.boardPack ? (
            <button
              onClick={downloadPdf}
              disabled={downloading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {downloading ? "Downloading..." : "Download Final PDF"}
            </button>
          ) : canManagePack ? (
            <button
              onClick={publishPack}
              disabled={publishing}
              className="rounded-md bg-[#1e1b4b] px-4 py-2 text-sm font-medium text-white hover:bg-[#2e2b5b] disabled:opacity-50 flex items-center"
            >
              {publishing ? (
                <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Publishing...</>
              ) : (
                "Publish Board Pack"
              )}
            </button>
          ) : (
            <p className="text-sm text-muted-foreground italic">Pack not published yet</p>
          )}
        </div>
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
          {new Date(meeting.date).toLocaleDateString()} · {meeting.startTime}–{meeting.endTime} ·{" "}
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
          {sections.map((s: any, idx: number) => (
            <li key={s.id}>
              <span className="text-muted-foreground">{idx + 1}.</span>{" "}
              {s.title}
            </li>
          ))}
        </ol>
      </div>

      {/* Papers — one block per section, matching the printed pack layout */}
      <div className="mt-6 space-y-6">
        {sections.map((section: any, idx: number) => (
          <div
            key={section.id}
            className="rounded-md border border-border bg-card p-6"
          >
            <h3 className="text-lg font-semibold">
              {idx + 1}. {section.title}
            </h3>
            <div className="mt-4 space-y-3">
              {section.items.map((item: any) => (
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
                    {purposeLabels[item.purpose.toLowerCase()] || item.purpose}
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