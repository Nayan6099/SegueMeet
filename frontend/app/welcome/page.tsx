"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <div className="max-w-4xl w-full mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <p className="text-slate-500 font-medium">🎉 Congrats, Your organisation is ready!</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#2a3042] tracking-tight">
              Where to next?
            </h1>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Card 1 */}
            <div className="border border-slate-200 rounded-2xl p-8 flex flex-col transition-shadow hover:shadow-md bg-white">
              <div className="h-28 mb-4">
                {/* SVG Approximation of Agenda Icon */}
                <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="20" y="15" width="70" height="55" rx="8" fill="#e2e8f0" fillOpacity="0.5"/>
                  <rect x="35" y="30" width="40" height="6" rx="3" fill="#cbd5e1"/>
                  <rect x="35" y="45" width="40" height="20" rx="3" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3"/>
                  <rect x="10" y="55" width="65" height="25" rx="6" fill="#3b82f6"/>
                  <rect x="35" y="64" width="30" height="6" rx="3" fill="#bfdbfe"/>
                  <path d="M55 80 C 55 95, 80 95, 85 75" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M78 78 L 85 75 L 87 82" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <text x="18" y="70" fontSize="7" fill="#ffffff" fontWeight="bold">1.2</text>
                </svg>
              </div>
              <h3 className="text-[22px] font-bold text-[#0f172a] mb-2 leading-tight">Create your first agenda</h3>
              <p className="text-slate-500 mb-8 flex-1 text-[15px]">
                Prepare agenda and board pack for your board meeting.
              </p>
              <Link href="/my-home" className="w-full">
                <Button className="w-full bg-[#f4f7f9] hover:bg-[#e2e8f0] text-slate-900 font-medium h-12 rounded-xl border border-slate-100 shadow-none">
                  Start here
                </Button>
              </Link>
            </div>

            {/* Card 2 */}
            <div className="border border-slate-200 rounded-2xl p-8 flex flex-col transition-shadow hover:shadow-md bg-white">
              <div className="h-28 mb-4">
                {/* SVG Approximation of Invite Icon */}
                <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="15" y="15" width="80" height="60" rx="8" fill="#e2e8f0" fillOpacity="0.5"/>
                  <circle cx="40" cy="45" r="18" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3"/>
                  <circle cx="40" cy="38" r="6" stroke="#3b82f6" strokeWidth="2.5" fill="none"/>
                  <path d="M28 56 C 28 50, 52 50, 52 56" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <rect x="65" y="32" width="22" height="6" rx="3" fill="#cbd5e1"/>
                  <rect x="65" y="45" width="15" height="5" rx="2.5" fill="#cbd5e1"/>
                  <circle cx="82" cy="72" r="15" fill="#3b82f6"/>
                  <path d="M82 64 L 82 80 M 74 72 L 90 72" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-[22px] font-bold text-[#0f172a] mb-2 leading-tight">Invite others</h3>
              <p className="text-slate-500 mb-8 flex-1 text-[15px]">
                Invite your board and start collaborating.
              </p>
              <Link href="/my-home" className="w-full">
                <Button className="w-full bg-[#f4f7f9] hover:bg-[#e2e8f0] text-slate-900 font-medium h-12 rounded-xl border border-slate-100 shadow-none">
                  Invite
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </AuthGuard>
  );
}
