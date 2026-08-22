"use client";

import { Bell, Info, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BoardProfileTabProps {
  onManageTenure: () => void;
  person: any;
}

export function BoardProfileTab({ onManageTenure, person }: BoardProfileTabProps) {
  return (
    <div className="space-y-6">
      <div className="border rounded-xl p-6 bg-white shadow-sm flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
          {person.user?.name?.charAt(0) || "U"}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{person.user?.name || "Unknown User"}</h2>
          <p className="text-slate-500">{person.user?.email || "No email provided"}</p>
        </div>
      </div>

      {/* Tenure Notifications Panel */}
      <div className="border rounded-xl bg-white p-4 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-slate-800">
            <Bell className="w-5 h-5" />
            <h3 className="font-semibold text-base sm:text-lg">Tenure Notifications</h3>
          </div>
          <Button 
            onClick={onManageTenure}
            className="bg-[#1a1130] hover:bg-[#110b20] text-white rounded-md px-4 py-1.5 h-9 font-medium text-sm w-full sm:w-auto"
          >
            Manage Notifications
          </Button>
        </div>
        <p className="text-sm text-slate-600">
          The nominated administrator will receive two reminders for members with tenure end dates:
        </p>
        <ul className="list-disc list-inside text-sm text-slate-600 ml-2">
          <li>8 weeks before the end date</li>
          <li>1 day before the end date</li>
        </ul>
      </div>

      {/* Table Headers / Filters Mock */}
      <div className="flex flex-wrap items-center justify-start sm:justify-end gap-4 sm:gap-6 text-sm font-medium text-slate-600 mt-6 md:mt-8 mb-2 px-2 sm:px-4">
        <div className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          By Name
        </div>
        <div 
          onClick={onManageTenure}
          className="flex items-center gap-2 cursor-pointer hover:text-slate-900"
        >
          <Bell className="w-4 h-4" />
          Manage Notification
        </div>
      </div>

      {/* Empty State */}
      <div className="border rounded-xl bg-white p-8 sm:p-16 md:p-24 flex flex-col items-center justify-center text-center shadow-sm mt-4">
        <div className="bg-gray-50 p-6 rounded-2xl mb-4">
          <User className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-600 text-sm">No board members added yet.</p>
      </div>
    </div>
  );
}
