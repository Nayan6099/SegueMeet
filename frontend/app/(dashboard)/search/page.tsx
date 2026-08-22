"use client";

import { useAuth } from "@/lib/auth-context";
import { useSearch } from "@/hooks/use-search";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Search as SearchIcon, Calendar, FileText, User } from "lucide-react";
import Link from "next/link";

export default function SearchPage() {
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const initialQuery = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce the input value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue);
      
      // Update URL silently
      const params = new URLSearchParams(searchParams.toString());
      if (inputValue) {
        params.set("q", inputValue);
      } else {
        params.delete("q");
      }
      router.replace(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, pathname, router, searchParams]);

  const { data: results, isLoading } = useSearch(debouncedQuery, orgId);

  const meetings = results?.meetings || [];
  const documents = results?.documents || [];
  const people = results?.people || [];

  const totalResults = meetings.length + documents.length + people.length;

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
    <div className="p-3 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8">
      {/* Header & Search Bar */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 sm:mb-6">Global Search</h1>
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
          <Input
            className="pl-11 py-5 sm:py-6 text-base sm:text-lg rounded-xl border-slate-300 shadow-sm focus-visible:ring-primary w-full"
            placeholder="Search meetings, documents, or people..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
          />
          {isLoading && (
            <Loader2 className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 animate-spin" />
          )}
        </div>
      </div>

      {!debouncedQuery.trim() ? (
        <div className="py-16 sm:py-24 text-center text-slate-500">
          <SearchIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-base sm:text-lg">Type something to start searching</p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-transparent h-auto p-0 rounded-none border-b border-slate-200 w-full justify-start space-x-4 sm:space-x-8 mb-6 overflow-x-auto flex-nowrap no-scrollbar">
            <TabsTrigger 
              value="all" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 sm:py-3 font-medium text-slate-500 whitespace-nowrap text-xs sm:text-sm"
            >
              All Results ({totalResults})
            </TabsTrigger>
            <TabsTrigger 
              value="meetings" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 sm:py-3 font-medium text-slate-500 whitespace-nowrap text-xs sm:text-sm"
            >
              Meetings ({meetings.length})
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 sm:py-3 font-medium text-slate-500 whitespace-nowrap text-xs sm:text-sm"
            >
              Documents ({documents.length})
            </TabsTrigger>
            <TabsTrigger 
              value="people" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 sm:py-3 font-medium text-slate-500 whitespace-nowrap text-xs sm:text-sm"
            >
              People ({people.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8 mt-0">
            {totalResults === 0 && !isLoading && (
              <p className="text-center py-12 text-slate-500 text-sm">No results found for "{debouncedQuery}"</p>
            )}
            
            {meetings.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Meetings</h3>
                <div className="grid gap-4">
                  {meetings.map((m: any) => (
                    <Link key={m.id} href={`/meetings/${m.id}`}>
                      <div className="p-3 sm:p-4 border rounded-xl hover:border-primary transition-colors bg-white flex items-start gap-3 sm:gap-4 shadow-sm group">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-slate-800 truncate">{m.title}</h4>
                          <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">{new Date(m.scheduledStartDate || m.date).toLocaleString()} • {m.location || 'N/A'}</p>
                          {m.notes && <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2">{m.notes}</p>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {documents.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Documents</h3>
                <div className="grid gap-4">
                  {documents.map((d: any) => (
                    <div key={d.id} onClick={() => handleDownload(d)} className="cursor-pointer">
                      <div className="p-4 border rounded-xl hover:border-primary transition-colors bg-white flex items-start gap-4 shadow-sm group">
                        <div className="p-2 bg-red-50 text-red-500 rounded-lg group-hover:bg-red-100 transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{d.originalName}</h4>
                          <p className="text-sm text-slate-500 mt-1">Uploaded on {new Date(d.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {people.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">People</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {people.map((p: any) => (
                    <div key={p.id} className="p-4 border rounded-xl bg-white flex items-center gap-4 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                        {p.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{p.user.name}</h4>
                        <p className="text-sm text-slate-500">{p.user.email} • {p.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Individual Tabs */}
          <TabsContent value="meetings" className="mt-0">
            {meetings.length === 0 ? (
              <p className="text-center py-12 text-slate-500">No meeting results</p>
            ) : (
              <div className="grid gap-4">
                {meetings.map((m: any) => (
                  <Link key={m.id} href={`/meetings/${m.id}`}>
                    <div className="p-4 border rounded-xl hover:border-primary transition-colors bg-white flex items-start gap-4 shadow-sm group">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{m.title}</h4>
                        <p className="text-sm text-slate-500 mt-1">{new Date(m.scheduledStartDate || m.date).toLocaleString()} • {m.location || 'N/A'}</p>
                        {m.notes && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{m.notes}</p>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            {documents.length === 0 ? (
              <p className="text-center py-12 text-slate-500">No document results</p>
            ) : (
              <div className="grid gap-4">
                  {documents.map((d: any) => (
                    <div key={d.id} onClick={() => handleDownload(d)} className="cursor-pointer">
                      <div className="p-4 border rounded-xl hover:border-primary transition-colors bg-white flex items-start gap-4 shadow-sm group">
                        <div className="p-2 bg-red-50 text-red-500 rounded-lg group-hover:bg-red-100 transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{d.originalName}</h4>
                          <p className="text-sm text-slate-500 mt-1">Uploaded on {new Date(d.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="people" className="mt-0">
            {people.length === 0 ? (
              <p className="text-center py-12 text-slate-500">No people results</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {people.map((p: any) => (
                  <div key={p.id} className="p-4 border rounded-xl bg-white flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                      {p.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{p.user.name}</h4>
                      <p className="text-sm text-slate-500">{p.user.email} • {p.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

        </Tabs>
      )}
    </div>
  );
}
