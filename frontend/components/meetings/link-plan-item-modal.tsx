"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, Link as LinkIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LinkPlanItemModalProps {
  organisationId: string;
  onSelect: (planItem: { id: string; title: string }) => void;
  disabled?: boolean;
}

export function LinkPlanItemModal({ organisationId, onSelect, disabled }: LinkPlanItemModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const { data: plans, isLoading } = useQuery({
    queryKey: ["annual-plans", organisationId, selectedYear],
    queryFn: async () => {
      const res = await api.get(`/annual-plans?organisationId=${organisationId}&year=${selectedYear}`);
      return res.data;
    },
    enabled: !!organisationId && open,
  });

  const handleSelect = (item: any) => {
    onSelect({ id: item.id, title: item.title });
    setOpen(false);
  };

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="text-xs">
          <LinkIcon className="mr-2 h-3 w-3" />
          Add from Annual Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Link to Annual Plan</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm font-medium">Plan Year:</span>
            <Select value={selectedYear} onValueChange={(val) => val && setSelectedYear(val)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : plans && plans.length > 0 && plans[0].items.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {plans[0].items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Month: {item.month} • Status: {item.status.replace("_", " ")}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => handleSelect(item)}>
                    Link
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md border-dashed">
              <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No plan items found</p>
              <p className="text-xs text-muted-foreground mt-1">There is no Annual Work Plan set up for {selectedYear}.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
