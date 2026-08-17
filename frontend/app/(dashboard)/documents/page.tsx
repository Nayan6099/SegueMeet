"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, FolderOpen, Search, Plus, FileText } from "lucide-react";

export default function DocumentsPage() {
  const [activeFolder, setActiveFolder] = useState("Policies");
  
  const folders = ["Policies", "Charters", "Registers"];

  const renderEmptyState = () => (
    <div className="flex-1 border rounded-xl bg-white p-24 flex flex-col items-center justify-center text-center shadow-sm">
      <div className="bg-gray-50 p-6 rounded-2xl mb-4">
        <FolderOpen className="w-10 h-10 text-slate-400" />
      </div>
      <p className="text-slate-600 text-sm font-medium">No documents in this folder</p>
    </div>
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
        <Button className="bg-slate-800 hover:bg-slate-700 text-white rounded-full px-6">
          + Add Document
        </Button>
      </div>

      <Tabs defaultValue="governance" className="w-full">
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
                <button className="text-slate-400 hover:text-slate-600">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 space-y-1">
                {folders.map(folder => (
                  <button 
                    key={folder}
                    onClick={() => setActiveFolder(folder)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                      activeFolder === folder 
                        ? "bg-slate-100 text-slate-900 font-medium" 
                        : "text-slate-600 hover:bg-gray-50"
                    }`}
                  >
                    {activeFolder === folder ? (
                       <FolderOpen className="w-4 h-4 text-primary" />
                    ) : (
                       <Folder className="w-4 h-4 text-slate-400" />
                    )}
                    {folder}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Area: Document List or Empty State */}
            {renderEmptyState()}

          </div>
        </TabsContent>
        
        <TabsContent value="meeting" className="mt-0">
           <div className="border rounded-xl bg-white p-24 flex flex-col items-center justify-center text-center shadow-sm">
             <div className="bg-gray-50 p-6 rounded-2xl mb-4">
               <FileText className="w-10 h-10 text-slate-400" />
             </div>
             <p className="text-slate-600 text-sm font-medium">Meeting documents are organized by meeting date.</p>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
