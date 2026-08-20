"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, FileText, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UploadFilesModal } from "./upload-files-modal";

export function DocumentsList({ organisationId, committeeId }: { organisationId: string; committeeId?: string }) {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", organisationId, committeeId],
    queryFn: async () => {
      if (!organisationId) return [];
      const res = await api.get(`/documents`, {
        params: { organisationId, committeeId }
      });
      return res.data;
    },
    enabled: !!organisationId,
  });

  const [isUploadOpen, setIsUploadOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleDownload = async (doc: any) => {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: doc.mimeType }));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download document", err);
    }
  };

  return (
    <div className="space-y-4">
      {committeeId && (
        <div className="flex justify-end mb-4">
          <Button 
            onClick={() => setIsUploadOpen(true)}
            className="rounded-md bg-[#2d1b54] hover:bg-[#1a0f35] text-white px-4 py-2 text-sm font-semibold shadow-sm flex items-center gap-2 h-9"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </Button>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground bg-white text-center">
          No documents found.
        </div>
      ) : (
        documents.map((doc: any) => (
          <div key={doc.id} onClick={() => handleDownload(doc)} className="flex items-center justify-between p-4 border rounded-xl hover:border-primary transition-colors bg-white shadow-sm group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-50 text-slate-500 rounded-lg group-hover:bg-slate-100 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-slate-800">{doc.originalName}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {(doc.sizeBytes / 1024).toFixed(1)} KB • Uploaded by {doc.uploadedBy?.name || "Unknown"} on {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-primary">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        ))
      )}

      {committeeId && (
        <UploadFilesModal 
          organisationId={organisationId}
          committeeId={committeeId}
          isOpen={isUploadOpen}
          onOpenChange={setIsUploadOpen}
        />
      )}
    </div>
  );
}
