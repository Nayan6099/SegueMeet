import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sparkles, Search } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
      <div className="flex-1 flex items-center">
        {/* Can put breadcrumbs or global search here if needed */}
      </div>

      <div className="flex items-center space-x-6 text-sm font-medium text-slate-600">
        <button className="hover:text-slate-900 transition-colors flex items-center gap-2">
          <Search className="w-4 h-4" />
        </button>
        <Link href="#" className="hover:text-slate-900 transition-colors">
          Feedback
        </Link>
        <Link href="#" className="hover:text-slate-900 transition-colors">
          Support
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="h-8 w-8 bg-blue-100 text-blue-700 hover:opacity-80 transition-opacity">
              <AvatarFallback className="font-semibold text-xs">KA</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button className="bg-[#6b21a8] hover:bg-[#581c87] text-white rounded-md px-4 h-9 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Ask AI
        </Button>
      </div>
    </header>
  );
}