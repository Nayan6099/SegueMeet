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
import { Plus, ShieldAlert, Loader2, Save } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useGetOrganisationSettings, useUpdateOrganisationSettings, useGetAuditLogs } from "@/hooks/use-settings";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId;
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [quorumType, setQuorumType] = useState("MAJORITY");
  const [defaultQuorumPercentage, setDefaultQuorumPercentage] = useState("50");
  const [defaultQuorumCount, setDefaultQuorumCount] = useState("");

  const { data: orgData, isLoading } = useGetOrganisationSettings(orgId);
  const updateMutation = useUpdateOrganisationSettings(orgId);
  const { data: auditLogs = [], isLoading: isLoadingAudit } = useGetAuditLogs(orgId);

  useEffect(() => {
    if (orgData) {
      setName(orgData.name || "");
      setShortName(orgData.settings?.shortName || "");
      setQuorumType(orgData.settings?.quorumType || "MAJORITY");
      setDefaultQuorumPercentage(orgData.settings?.defaultQuorumPercentage || "50");
      setDefaultQuorumCount(orgData.settings?.defaultQuorumCount || "");
    }
  }, [orgData]);

  const handleSave = () => {
    if (!name.trim()) return;
    updateMutation.mutate({
      name,
      settings: {
        ...orgData?.settings,
        shortName,
        quorumType,
        defaultQuorumPercentage,
        defaultQuorumCount,
      }
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
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
          <TabsList className="bg-transparent h-auto p-0 rounded-none border-none flex-nowrap overflow-x-auto w-full justify-start space-x-4 md:space-x-6 scrollbar-hide">
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
              value="notifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-500 hover:text-slate-700"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-500 hover:text-slate-700"
            >
              Audit Logs
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
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending || isLoading || !name.trim()}
            className="bg-[#6b21a8] hover:bg-[#581c87] text-white font-medium px-6 h-9 rounded-md"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <TabsContent value="general" className="mt-0">
          <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-lg p-4 md:p-8 shadow-sm">
            
            {/* Organisation Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6 first:pt-0">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Organisation Name</h3>
                <p className="text-sm text-slate-500 mt-1">Used on Agenda and Minutes.</p>
              </div>
              <div className="col-span-2">
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="max-w-2xl text-slate-700 h-10 border-slate-200" 
                />
              </div>
            </div>

            {/* Short Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Short Name</h3>
                <p className="text-sm text-slate-500 mt-1">Used on the application interface.</p>
              </div>
              <div className="col-span-2">
                <Input 
                  value={shortName} 
                  onChange={(e) => setShortName(e.target.value)} 
                  className="max-w-2xl h-10 border-slate-200" 
                />
              </div>
            </div>

            {/* Country of Operation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Country of Operation</h3>
                <p className="text-sm text-slate-500 mt-1">Primary Country for this organisation.</p>
                <p className="text-sm text-slate-500 mt-2">Contact SegueMeet support if the country needs to be changed.</p>
              </div>
              <div className="col-span-2">
                <Input defaultValue="India" disabled className="max-w-2xl h-10 border-slate-200 bg-slate-50 text-slate-500" />
              </div>
            </div>

            {/* Organisation Language */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6 pb-2">
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
        
        {/* Quorum & Participation Settings */}
        <TabsContent value="quorum" className="mt-0">
          <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-lg p-4 md:p-8 shadow-sm">
            
            {/* Rule Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6 first:pt-0">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Default Quorum Rule</h3>
                <p className="text-sm text-slate-500 mt-1">
                  How quorum requirements are calculated for meetings by default. Individual meetings can also override this.
                </p>
              </div>
              <div className="col-span-2 space-y-4">
                <Select value={quorumType} onValueChange={(val) => setQuorumType(val || "MAJORITY")}>
                  <SelectTrigger className="w-full max-w-2xl h-10 border-slate-200 text-slate-700 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="w-full min-w-[320px] max-w-2xl">
                    <SelectItem value="MAJORITY">Simple Majority (50% + 1 of eligible members)</SelectItem>
                    <SelectItem value="PERCENTAGE">Custom Percentage of eligible members</SelectItem>
                    <SelectItem value="FIXED">Fixed minimum attendee count</SelectItem>
                  </SelectContent>
                </Select>

                {quorumType === "PERCENTAGE" && (
                  <div className="space-y-1.5 max-w-sm">
                    <label className="text-xs font-medium text-slate-600">Required Percentage (%)</label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={defaultQuorumPercentage}
                      onChange={(e) => setDefaultQuorumPercentage(e.target.value)}
                      placeholder="e.g. 50"
                      className="h-10 border-slate-200"
                    />
                  </div>
                )}

                {quorumType === "FIXED" && (
                  <div className="space-y-1.5 max-w-sm">
                    <label className="text-xs font-medium text-slate-600">Minimum Required Attendees Count</label>
                    <Input
                      type="number"
                      min={1}
                      value={defaultQuorumCount}
                      onChange={(e) => setDefaultQuorumCount(e.target.value)}
                      placeholder="e.g. 5"
                      className="h-10 border-slate-200"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Participation Standards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Participation Tracking</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Participation rate measures the ratio of present and participating attendees relative to total eligible members.
                </p>
              </div>
              <div className="col-span-2">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-sm text-slate-700 max-w-2xl">
                  <div className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                    Governance Standard Formula
                  </div>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Participation (%) =</span> (Present + Remote + Late Attendees) / Total Eligible Members × 100
                  </p>
                  <p className="text-xs text-slate-500">
                    Members marked as Excused or Absent are tracked in the meeting record and audit log.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </TabsContent>
        
        <TabsContent value="audit" className="mt-0">
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
                System Audit Logs
              </h3>
              <p className="text-sm text-slate-500 mt-1">A chronological record of all system actions for compliance and tracking.</p>
            </div>
            
            {isLoadingAudit ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No audit logs found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b">
                    <tr>
                      <th className="px-6 py-3 font-medium">Timestamp</th>
                      <th className="px-6 py-3 font-medium">Actor</th>
                      <th className="px-6 py-3 font-medium">Action</th>
                      <th className="px-6 py-3 font-medium">Entity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-700">
                          {log.actor?.name || <span className="text-slate-400 italic">System</span>}
                        </td>
                        <td className="px-6 py-3">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          {log.entityType} <span className="text-slate-400">({log.entityId.substring(0, 8)}...)</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}