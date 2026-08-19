import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreatePlanItem } from "@/hooks/use-annual-plan";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisationId: string;
  year: number;
  planId: string;
}

export function AddItemModal({ open, onOpenChange, organisationId, year, planId }: AddItemModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [month, setMonth] = useState("1");
  
  const createItem = useCreatePlanItem(organisationId, year, planId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      await createItem.mutateAsync({
        title,
        description,
        month: parseInt(month, 10),
      });
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setMonth("1");
    } catch (error) {
      console.error("Failed to create plan item", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Plan Item</DialogTitle>
          <DialogDescription>
            Schedule a new item for your {year} work plan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Budget Review"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Month</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {new Date(year, m - 1).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this item..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createItem.isPending || !title}>
              {createItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
