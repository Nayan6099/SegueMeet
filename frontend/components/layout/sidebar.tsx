"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Calendar,
  CheckSquare,
  ListChecks,
  Send,
  Library,
  User,
  GitBranch,
  Tent,
  ClipboardList,
  Settings2,
  ChevronDown,
  Gem,
  PanelLeftClose
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNav = [
  { label: "Search", href: "/search", icon: Search },
  { label: "Meetings", href: "/meetings", icon: Calendar },
  { label: "Actions", href: "/actions", icon: CheckSquare },
  { label: "Decisions", href: "/decisions", icon: ListChecks },
  { label: "Between Meetings", href: "/between-meetings", icon: Send },
  { label: "Documents", href: "/documents", icon: Library },
  { label: "People", href: "/people", icon: User },
  { label: "Interests", href: "/interests", icon: GitBranch },
  { label: "Committees", href: "/committees", icon: Tent },
  { label: "Annual Work Plan", href: "/annual-work-plan", icon: ClipboardList },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-slate-200 bg-[#f4f7f9] relative">
      {/* Top Header */}
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
           <span className="text-xl font-bold tracking-tight text-slate-900">
             SegueMeet
           </span>
        </div>
        <button className="text-slate-400 hover:text-slate-600">
           <PanelLeftClose className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6">
        
        {/* Dashboard Link (Above Boards) */}
        <div>
          <Link
            href="/my-home"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-[15px] transition-colors",
              pathname === "/my-home"
                ? "bg-slate-200/60 font-medium text-slate-800"
                : "font-medium text-slate-700 hover:bg-slate-200/40"
            )}
          >
            <LayoutDashboard className={cn("h-5 w-5", pathname === "/my-home" ? "text-blue-600" : "text-slate-600")} />
            Dashboard
          </Link>
        </div>

        {/* Boards Section */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Boards</h3>
          
          <button className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2 shadow-sm mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
              <span className="font-semibold text-slate-800 text-[15px]">Kartikey Tech</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 mr-1" />
          </button>

          <nav className="space-y-1">
            {mainNav.map((item) => {
              const active = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors",
                    active
                      ? "bg-slate-200/70 font-medium text-slate-900"
                      : "font-medium text-slate-700 hover:bg-slate-200/40"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-blue-600" : "text-slate-600")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Buy Now Button */}
      <div className="p-4 mt-auto">
        <button className="w-full flex items-center justify-center gap-2 bg-[#e0f0ff] hover:bg-[#d0e8ff] text-blue-900 font-medium py-3 rounded-xl transition-colors text-[15px]">
          <Gem className="w-5 h-5 text-blue-600" />
          Buy Now
        </button>
      </div>
    </aside>
  );
}