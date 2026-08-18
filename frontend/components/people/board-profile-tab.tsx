"use client";

import { Bell, Info, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BoardProfileTab() {
  return (
    <div className="space-y-6">
      {/* Email Confirmation Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-800">Confirm your email</p>
          <p className="text-slate-600 mt-1">
            Check inbox to confirm your email address. Didn't receive the email?{" "}
            <button className="font-semibold underline hover:text-slate-800">Resend</button>
          </p>
        </div>
      </div>

      {/* Tenure Notifications Panel */}
      <div className="border rounded-xl bg-white p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-800">
            <Bell className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Tenure Notifications</h3>
          </div>
          <Button 
            onClick={() => window.alert("Tenure Notifications feature is coming soon!")}
            className="bg-[#1a1130] hover:bg-[#110b20] text-white rounded-md px-4 py-1.5 h-9 font-medium text-sm"
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
      <div className="flex items-center justify-end gap-6 text-sm font-medium text-slate-600 mt-8 mb-2 px-4">
        <div className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          By Name
        </div>
        <div 
          onClick={() => window.alert("Tenure Notifications feature is coming soon!")}
          className="flex items-center gap-2 cursor-pointer hover:text-slate-900"
        >
          <Bell className="w-4 h-4" />
          Manage Notification
        </div>
      </div>

      {/* Empty State */}
      <div className="border rounded-xl bg-white p-24 flex flex-col items-center justify-center text-center shadow-sm mt-4">
        <div className="bg-gray-50 p-6 rounded-2xl mb-4">
          <User className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-600 text-sm">No board members added yet.</p>
      </div>
    </div>
  );
}
