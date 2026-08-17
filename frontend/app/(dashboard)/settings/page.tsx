"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            General Settings
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Manage your organisation's preferences and settings
            </span>
          </h1>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <div className="flex items-center justify-between border-b pb-0 mb-6">
          <TabsList className="bg-transparent h-auto p-0 rounded-none border-none space-x-6">
            <TabsTrigger
              value="general"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-semibold text-slate-700 hover:text-slate-900"
            >
              General Settings
            </TabsTrigger>
            <TabsTrigger
              value="quorum"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-500 hover:text-slate-700"
            >
              Quorum & Participation
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-500 hover:text-slate-700"
            >
              Security
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-500 hover:text-slate-700"
            >
              BoardPro AI
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-500 hover:text-slate-700"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="locations"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-500 hover:text-slate-700"
            >
              Meeting Locations
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex justify-end mb-6">
          <Button disabled className="bg-slate-200 text-slate-400 font-medium px-6 h-9 rounded-md">
            Save Changes
          </Button>
        </div>

        <TabsContent value="general" className="mt-0">
          <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-lg p-8 shadow-sm">
            
            {/* Organisation Name */}
            <div className="grid grid-cols-3 gap-12 py-6 first:pt-0">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Organisation Name</h3>
                <p className="text-sm text-slate-500 mt-1">Used on Agenda and Minutes.</p>
              </div>
              <div className="col-span-2">
                <Input defaultValue="Kartikey Tech" className="max-w-2xl text-slate-700 h-10 border-slate-200" />
              </div>
            </div>

            {/* Short Name */}
            <div className="grid grid-cols-3 gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Short Name</h3>
                <p className="text-sm text-slate-500 mt-1">Used on the application interface.</p>
              </div>
              <div className="col-span-2">
                <Input className="max-w-2xl h-10 border-slate-200" />
              </div>
            </div>

            {/* Country of Operation */}
            <div className="grid grid-cols-3 gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Country of Operation</h3>
                <p className="text-sm text-slate-500 mt-1">Primary Country for this organisation.</p>
                <p className="text-sm text-slate-500 mt-2">Contact BoardPro support if the country needs to be changed.</p>
              </div>
              <div className="col-span-2">
                <Input defaultValue="India" disabled className="max-w-2xl h-10 border-slate-200 bg-slate-50 text-slate-500" />
              </div>
            </div>

            {/* Organisation Language */}
            <div className="grid grid-cols-3 gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Organisation Language</h3>
                <p className="text-sm text-slate-500 mt-1">Used on the PDFs for this organisation.</p>
              </div>
              <div className="col-span-2">
                <Select defaultValue="nz">
                  <SelectTrigger className="max-w-2xl h-10 border-slate-200 text-slate-700 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nz">(en-NZ) New Zealand English</SelectItem>
                    <SelectItem value="us">(en-US) US English</SelectItem>
                    <SelectItem value="uk">(en-GB) British English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Logo */}
            <div className="grid grid-cols-3 gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Logo</h3>
                <p className="text-sm text-slate-500 mt-1">Used on the generated PDF's, such as Agenda, Board Pack, Minutes, etc.</p>
              </div>
              <div className="col-span-2">
                <div className="max-w-2xl border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-8 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
                  <Plus className="w-5 h-5 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-600 mb-2">
                    Drag and drop your files here, or <span className="text-blue-600 font-medium">click to browse</span>
                  </p>
                  <p className="text-xs text-slate-400">Recommended dimensions: 200px x 100px, 1MB limit.</p>
                  <p className="text-xs text-slate-400 mt-1">Allowed types: .png, .jpeg, .jpg, .gif</p>
                </div>
              </div>
            </div>

            {/* Icon */}
            <div className="grid grid-cols-3 gap-12 py-6 pb-2">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Icon</h3>
                <p className="text-sm text-slate-500 mt-1">Used in the web and application interfaces.</p>
              </div>
              <div className="col-span-2">
                <div className="max-w-2xl border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-8 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
                  <Plus className="w-5 h-5 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-600 mb-2">
                    Drag and drop your files here, or <span className="text-blue-600 font-medium">click to browse</span>
                  </p>
                  <p className="text-xs text-slate-400">Recommended dimensions: 84px x 84px, 1MB limit.</p>
                  <p className="text-xs text-slate-400 mt-1">Allowed types: .png, .jpeg, .jpg, .gif</p>
                </div>
              </div>
            </div>

          </div>
        </TabsContent>
        
        {/* Empty state for other tabs just in case */}
        <TabsContent value="quorum">
          <div className="p-8 text-center text-slate-500 border rounded-lg bg-white mt-8">Quorum settings coming soon.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}