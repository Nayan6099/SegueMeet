"use client";

import { Button } from "@/components/ui/button";
import { ClipboardList, ExternalLink, FileUp, PlusSquare, Loader2, Calendar, Trash2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useGetAnnualPlans, useCreateAnnualPlan, useDeleteAnnualPlan, useCreatePlanItemsBulk } from "@/hooks/use-annual-plan";
import { AddItemModal } from "@/components/annual-plan/add-item-modal";
import { useState, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

export default function AnnualWorkPlanPage() {
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organisationId;
  const currentRealYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentRealYear);

  const { data: plans = [], isPending } = useGetAnnualPlans(orgId, selectedYear);
  const createPlan = useCreateAnnualPlan(orgId, selectedYear);
  const deletePlan = useDeleteAnnualPlan(orgId, selectedYear);
  const createBulk = useCreatePlanItemsBulk(orgId, selectedYear);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const activePlan = plans[0];
  const yearOptions = [currentRealYear - 1, currentRealYear, currentRealYear + 1, currentRealYear + 2];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !orgId) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) throw new Error("CSV is empty or missing headers");

      const splitLine = (str: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < str.length; i++) {
          if (str[i] === '"') {
            inQuotes = !inQuotes;
          } else if (str[i] === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += str[i];
          }
        }
        result.push(current.trim());
        return result.map(s => s.replace(/^"|"$/g, ''));
      };

      const headers = splitLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const parsedItems = lines.slice(1).map(line => {
        const values = splitLine(line);
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      const formattedItems = parsedItems.map(row => {
        return {
          title: row.title || 'Untitled',
          description: row.description || '',
          month: parseInt(row.month, 10) || 1,
          status: row.status ? row.status.toUpperCase().replace(/\s+/g, '_') : 'TODO'
        };
      }).filter(item => item.title);

      if (formattedItems.length === 0) throw new Error("No valid items found in CSV");

      let targetPlanId = activePlan?.id;
      
      // If plan doesn't exist, create it first
      if (!targetPlanId) {
        const newPlan = await createPlan.mutateAsync();
        targetPlanId = newPlan.id;
      }

      await createBulk.mutateAsync({ planId: targetPlanId, items: formattedItems });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to import CSV", error);
      alert("Failed to import CSV. Ensure it has headers like Month, Title, Description, Status.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            Annual Work Plans
            <span className="text-sm font-normal text-muted-foreground ml-2 hidden sm:inline-block">
              Your central hub for planning and priorities
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val, 10))}>
            <SelectTrigger className="w-[120px] bg-white">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!activePlan && (
            <Button 
              onClick={async () => {
                if (orgId) {
                  await createPlan.mutateAsync();
                  setIsAddModalOpen(true);
                }
              }}
              disabled={createPlan.isPending || !orgId}
              className="bg-[#1e1b4b] hover:bg-[#2e2b5b] text-white rounded-md px-6 h-9"
            >
              {createPlan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "+ Add"}
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isPending || !orgId ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
      ) : !activePlan ? (
        <div className="border border-slate-200 rounded-xl bg-white min-h-[60vh] flex flex-col items-center justify-center text-center shadow-sm p-8">
          <div className="bg-slate-100 p-5 rounded-2xl mb-6">
            <ClipboardList className="w-10 h-10 text-slate-500" />
          </div>
          
          <h2 className="text-lg font-semibold text-[#1e1b4b] mb-3">
            Create an annual work plan for {selectedYear}
          </h2>
          
          <p className="text-slate-500 text-sm max-w-sm mb-8">
            Stay focused on the strategic, long-term priorities that drive your organisation forward.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 w-full sm:w-auto">
            <Label 
              htmlFor="csv-upload" 
              className={`cursor-pointer w-full sm:w-auto border border-slate-300 text-slate-700 h-10 px-4 flex items-center justify-center gap-2 rounded-md hover:bg-slate-50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4 shrink-0" />}
              Import existing plan
            </Label>
            <input 
              id="csv-upload"
              type="file" 
              accept=".csv"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            
            <Button 
              onClick={async () => {
                if (orgId) {
                  await createPlan.mutateAsync();
                  setIsAddModalOpen(true);
                }
              }}
              disabled={createPlan.isPending || !orgId || isUploading}
              className="w-full sm:w-auto bg-[#2e2a74] hover:bg-[#1e1b4b] text-white h-10 px-4 flex items-center justify-center gap-2"
            >
              <PlusSquare className="w-4 h-4 shrink-0" />
              {createPlan.isPending ? "Creating..." : "Create blank plan"}
            </Button>
          </div>

          <Link href="#" className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Learn more <ExternalLink className="ml-1.5 w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-x-auto">
          <div className="p-6 border-b bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                {selectedYear} Work Plan
              </h2>
              <div className="text-sm font-medium text-slate-500 mt-1">
                {activePlan.items?.length || 0} items scheduled
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                id="csv-upload-active"
                type="file" 
                accept=".csv"
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Label 
                htmlFor="csv-upload-active" 
                className={`cursor-pointer h-9 px-4 border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-700 flex items-center text-sm font-medium transition-colors ${isUploading ? 'opacity-50' : ''}`}
              >
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />}
                Import CSV
              </Label>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Plan
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the {selectedYear} annual work plan and all of its items. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deletePlan.mutate(activePlan.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deletePlan.isPending ? "Deleting..." : "Delete Plan"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button onClick={() => setIsAddModalOpen(true)} className="bg-[#1e1b4b] hover:bg-[#2e2b5b] text-white h-9">
                + Add Item
              </Button>
            </div>
          </div>
          
          {activePlan.items?.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Month</th>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePlan.items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {new Date(selectedYear, item.month - 1).toLocaleString('default', { month: 'long' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{item.title}</div>
                      {item.description && <div className="text-slate-500 text-xs mt-1">{item.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        item.status === 'DONE' ? 'bg-green-100 text-green-700' :
                        item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-500">
              No items in this plan yet.
            </div>
          )}
        </div>
      )}
      
      {activePlan && orgId && (
        <AddItemModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          organisationId={orgId}
          year={selectedYear}
          planId={activePlan.id}
        />
      )}
    </div>
  );
}
