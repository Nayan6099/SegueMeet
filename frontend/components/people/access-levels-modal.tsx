"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Users, FileText, Star, Eye } from "lucide-react";

interface AccessLevelsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const roles = [
  {
    name: "Board Admin",
    icon: <Shield className="w-5 h-5 text-purple-600" />,
    color: "bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    permissions: [
      "Create, edit and delete meetings",
      "Manage all organisation members",
      "Publish and edit agendas",
      "Confirm and edit minutes",
      "Upload and delete documents",
      "View audit logs",
      "Manage organisation settings",
    ],
  },
  {
    name: "Chair",
    icon: <Star className="w-5 h-5 text-amber-600" />,
    color: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    permissions: [
      "Create and edit meetings",
      "Publish and edit agendas",
      "Confirm and edit minutes",
      "Upload documents",
      "View all meeting details",
    ],
  },
  {
    name: "Secretary",
    icon: <FileText className="w-5 h-5 text-blue-600" />,
    color: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    permissions: [
      "Create and edit meetings",
      "Edit agendas",
      "Draft and edit minutes",
      "Upload documents",
      "View all meeting details",
    ],
  },
  {
    name: "Board Member",
    icon: <Users className="w-5 h-5 text-green-600" />,
    color: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-700",
    permissions: [
      "View meeting details",
      "View agendas and minutes",
      "Download board pack documents",
      "RSVP to meetings",
    ],
  },
  {
    name: "Guest",
    icon: <Eye className="w-5 h-5 text-slate-500" />,
    color: "bg-slate-50 border-slate-200",
    badge: "bg-slate-100 text-slate-600",
    permissions: [
      "View meeting details (read-only)",
      "View agenda items assigned to them",
      "Download documents",
    ],
  },
];

export function AccessLevelsModal({ isOpen, onOpenChange }: AccessLevelsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Access Levels & Permissions
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Each role in SegueMeet has a defined set of permissions. Assign roles carefully to ensure the right level of access.
          </p>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {roles.map((role) => (
            <div
              key={role.name}
              className={`border rounded-xl p-4 ${role.color}`}
            >
              <div className="flex items-center gap-2 mb-3">
                {role.icon}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${role.badge}`}>
                  {role.name}
                </span>
              </div>
              <ul className="space-y-1">
                {role.permissions.map((perm) => (
                  <li key={perm} className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
