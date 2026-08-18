"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, FolderOpen, Search, Plus, FileText, Download, Loader2, UploadCloud } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddFolderModal } from "@/components/documents/add-folder-modal";
import { UploadFilesModal } from "@/components/documents/upload-files-modal";

export default function DocumentsPage() {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("governance");

  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId;

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await api.get(`/documents`, {
        params: { organisationId: orgId }
      });
      return res.data;
    },
    enabled: !!orgId,
  });

  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: ["document-folders", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await api.get(`/documents/folders`, {
        params: { organisationId: orgId }
      });
      return res.data;
    },
    enabled: !!orgId,
  });

  useEffect(() => {
    if (folders.length > 0 && !activeFolderId) {
      setActiveFolderId(folders[0].id);
    }
  }, [folders, activeFolderId]);

  const meetingDocs = documents.filter((d: any) => d.meetingId);
  const governanceDocs = documents.filter((d: any) => !d.meetingId && d.folderId === activeFolderId);
  const activeFolderData = folders.find((f: any) => f.id === activeFolderId);

  const renderEmptyState = (msg: string) => (
    <div className="flex-1 border rounded-xl bg-white p-24 flex flex-col items-center justify-center text-center shadow-sm">
      <div className="bg-gray-50 p-6 rounded-2xl mb-4">
        <FolderOpen className="w-10 h-10 text-slate-400" />
      </div>
      <p className="text-slate-600 text-sm font-medium">{msg}</p>
    </div>
  );

  const DocumentRow = ({ doc }: { doc: any }) => (
    <a href={doc.storagePath} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 border rounded-xl hover:border-primary transition-colors bg-white shadow-sm group">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-red-50 text-red-500 rounded-lg group-hover:bg-red-100 transition-colors">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-slate-800">{doc.originalName}</h4>
          <p className="text-xs text-slate-500 mt-1">{(doc.sizeBytes / 1024).toFixed(1)} KB • Uploaded {new Date(doc.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-primary">
        <Download className="w-4 h-4" />
      </Button>
    </a>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            Documents
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Central repository of all Governance and Meeting documents
            </span>
          </h1>
        </div>
        
        {orgId && activeTab === "governance" && (
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button className="bg-[#2d1b54] hover:bg-[#1a0f35] text-white rounded-md px-6 shadow-sm flex items-center gap-2 font-semibold h-9">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-48 shadow-lg rounded-xl border border-slate-100 p-1 font-medium">
              <DropdownMenuItem onClick={() => setIsAddFolderOpen(true)} className="flex items-center gap-2 cursor-pointer py-2 hover:bg-slate-50 focus:bg-slate-50 rounded-lg">
                <Folder className="w-4 h-4 text-slate-700" />
                <span>Add Folder</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2 cursor-pointer py-2 hover:bg-slate-50 focus:bg-slate-50 rounded-lg">
                <UploadCloud className="w-4 h-4 text-slate-700" />
                <span>Upload Files</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {orgId && (
        <>
          <AddFolderModal 
            organisationId={orgId} 
            isOpen={isAddFolderOpen} 
            onOpenChange={setIsAddFolderOpen} 
          />
          <UploadFilesModal 
            organisationId={orgId}
            folderId={activeFolderId || undefined}
            folderName={activeFolderData?.name}
            isOpen={isUploadOpen}
            onOpenChange={setIsUploadOpen}
          />
        </>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b pb-0 mb-6">
          <TabsList className="bg-transparent h-auto p-0 rounded-none border-none space-x-6">
            <TabsTrigger 
              value="governance" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-semibold text-slate-700"
            >
              Governance Documents
            </TabsTrigger>
            <TabsTrigger 
              value="meeting"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-muted-foreground"
            >
              Meeting Documents
            </TabsTrigger>
          </TabsList>
          
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search documents..." 
              className="pl-9 h-9 bg-white border-slate-200 text-sm"
            />
          </div>
        </div>

        <TabsContent value="governance" className="mt-0">
          <div className="flex gap-6 items-start">
            
            {/* Sidebar: Folders */}
            <div className="w-64 shrink-0 bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-700 text-sm">Folders</h3>
                <button onClick={() => setIsAddFolderOpen(true)} className="text-slate-400 hover:text-slate-600">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 space-y-1">
                {isLoadingFolders ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
                ) : folders.length === 0 ? (
                  <p className="text-xs text-slate-400 p-2 text-center">No folders found</p>
                ) : folders.map((folder: any) => (
                  <button 
                    key={folder.id}
                    onClick={() => setActiveFolderId(folder.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                      activeFolderId === folder.id 
                        ? "bg-slate-100 text-slate-900 font-medium" 
                        : "text-slate-600 hover:bg-gray-50"
                    }`}
                  >
                    {activeFolderId === folder.id ? (
                       <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                       <Folder className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Area: Document List or Empty State */}
            <div className="flex-1">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
              ) : governanceDocs.length === 0 ? (
                renderEmptyState("No documents have been uploaded yet.")
              ) : (
                <div className="grid gap-3">
                  {governanceDocs.map((doc: any) => <DocumentRow key={doc.id} doc={doc} />)}
                </div>
              )}
            </div>

          </div>
        </TabsContent>
        
        <TabsContent value="meeting" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
          ) : meetingDocs.length === 0 ? (
            <div className="border rounded-xl bg-white p-24 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="bg-gray-50 p-6 rounded-2xl mb-4">
                <FileText className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-600 text-sm font-medium">No meeting documents found.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {meetingDocs.map((doc: any) => <DocumentRow key={doc.id} doc={doc} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
