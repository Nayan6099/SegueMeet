"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { mockInterests } from "@/lib/mock-interests";
import { ExternalLink, ShieldCheck, History } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InterestsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            Interests Register
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Manage your organisation's Interests Register
            </span>
          </h1>
        </div>
        <Button className="bg-[#1e1b4b] hover:bg-[#2e2b5b] text-white rounded-full px-6">
          + Add New Interest
        </Button>
      </div>

      {/* Tabs */}
      <div className="w-full">
        <div className="flex items-center justify-between border-b pb-0 mb-6">
          <div className="flex space-x-6">
            <Link
              href="/people"
              className="px-0 py-2 font-medium text-muted-foreground hover:text-slate-700 transition-colors border-b-2 border-transparent"
            >
              People List
            </Link>
            <Link
              href="#"
              className="px-0 py-2 font-medium text-muted-foreground hover:text-slate-700 transition-colors border-b-2 border-transparent"
            >
              Board Profile
            </Link>
            <Link
              href="#"
              className="px-0 py-2 font-medium text-muted-foreground hover:text-slate-700 transition-colors border-b-2 border-transparent"
            >
              Changes Log
            </Link>
            <Link
              href="/interests"
              className="px-0 py-2 font-semibold text-blue-600 border-b-2 border-blue-600"
            >
              Interests Register
            </Link>
          </div>
          <Link href="#" className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            Access Levels <ExternalLink className="ml-1.5 w-4 h-4" />
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex rounded-md border border-slate-200 p-0.5 bg-white">
            <button className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium bg-blue-50 text-blue-700">
              <ShieldCheck className="w-4 h-4" />
              Current
            </button>
            <button className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <History className="w-4 h-4" />
              Past
            </button>
          </div>
          
          <div className="border-l border-slate-200 h-8"></div>
          
          <Select defaultValue="all">
            <SelectTrigger className="w-[200px] h-9 bg-white border-slate-200 text-slate-600">
              <SelectValue placeholder="Person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Person</SelectItem>
              <SelectItem value="kartikey">Kartikey Agrahari</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="border-t border-slate-200 py-8">
          <p className="text-slate-600">Sorry, No results!</p>
        </div>
      </div>
    </div>
  );
}
