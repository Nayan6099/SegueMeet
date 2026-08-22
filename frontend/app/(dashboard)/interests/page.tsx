"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShieldCheck, History, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { AddInterestModal } from "@/components/interests/add-interest-modal";

export default function InterestsPage() {
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId;
  const userId = user?.id;

  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: interests = [], isLoading } = useQuery({
    queryKey: ["interests", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await api.get(`/interests`, {
        params: { organisationId: orgId }
      });
      return res.data;
    },
    enabled: !!orgId,
  });

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex flex-wrap items-baseline gap-2 text-slate-800">
            Interests Register
            <span className="text-sm font-normal text-muted-foreground hidden sm:inline-block">
              Manage your organisation's Interests Register
            </span>
          </h1>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="bg-[#1e1b4b] hover:bg-[#2e2b5b] text-white rounded-full px-6 self-start sm:self-auto"
        >
          + Add New Interest
        </Button>
      </div>

      {orgId && userId && (
        <AddInterestModal
          organisationId={orgId}
          userId={userId}
          isOpen={isAddOpen}
          onOpenChange={setIsAddOpen}
        />
      )}

      {/* Tabs */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-0 mb-6 gap-3 sm:gap-0">
          <div className="flex space-x-3 sm:space-x-6 overflow-x-auto w-full sm:w-auto no-scrollbar flex-nowrap">
            <Link
              href="/people"
              className="px-0 py-2 font-medium text-muted-foreground hover:text-slate-700 transition-colors border-b-2 border-transparent whitespace-nowrap"
            >
              People List
            </Link>
            <Link
              href="/people"
              className="px-0 py-2 font-medium text-muted-foreground hover:text-slate-700 transition-colors border-b-2 border-transparent whitespace-nowrap"
            >
              Board Profile
            </Link>
            <Link
              href="/people"
              className="px-0 py-2 font-medium text-muted-foreground hover:text-slate-700 transition-colors border-b-2 border-transparent whitespace-nowrap"
            >
              Changes Log
            </Link>
            <Link
              href="/interests"
              className="px-0 py-2 font-semibold text-blue-600 border-b-2 border-blue-600 whitespace-nowrap"
            >
              Interests Register
            </Link>
          </div>
          <Link href="#" className="flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors pb-2 sm:pb-0 shrink-0">
            Access Levels <ExternalLink className="ml-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 md:mb-8">
          <div className="flex rounded-md border border-slate-200 p-0.5 bg-white w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-1.5 rounded text-sm font-medium bg-blue-50 text-blue-700">
              <ShieldCheck className="w-4 h-4" />
              Current
            </button>
            <button className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-1.5 rounded text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <History className="w-4 h-4" />
              Past
            </button>
          </div>
          
          <div className="hidden sm:block border-l border-slate-200 h-8"></div>
          
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[200px] h-9 bg-white border-slate-200 text-slate-600">
              <SelectValue placeholder="Person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People</SelectItem>
              <SelectItem value="kartikey">Kartikey Agrahari</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : interests.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl bg-white p-8 sm:p-16 text-center">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No interests declared yet.</p>
          </div>
        ) : (
          <div className="border rounded-xl bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[500px] sm:min-w-[600px]">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-3 sm:px-6 py-3 font-medium">Person</th>
                  <th className="px-3 sm:px-6 py-3 font-medium sm:w-1/2">Interest Description</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">Declared On</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interests.map((interest: any) => (
                  <tr key={interest.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-slate-800">
                      {interest.user?.name || "Unknown User"}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="font-medium text-slate-800">{interest.title}</div>
                      {interest.description && <div className="text-slate-500 text-xs mt-1 line-clamp-2">{interest.description}</div>}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-500 whitespace-nowrap">
                      {new Date(interest.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                        interest.isResolved ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {interest.isResolved ? 'Resolved' : 'Current'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
