"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function SettingsPage() {
  // Phase 1/2: local state only, no backend yet.
  // This is where GET/PATCH /organisations/:id plugs in later.
  const [orgName, setOrgName] = useState("Acme Co.");
  const [meetingReminders, setMeetingReminders] = useState(true);
  const [actionReminders, setActionReminders] = useState(true);
  const [allowDownloadPrint, setAllowDownloadPrint] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // NOTE: no backend yet — simulate save.
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Organisation details and notification preferences.
      </p>

      <Tabs defaultValue="general" className="mt-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <div className="rounded-md border border-border bg-card p-6">
            <h2 className="text-sm font-medium">Organisation</h2>
            <div className="mt-4 space-y-2">
              <Label htmlFor="orgName">Organisation name</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <div className="rounded-md border border-border bg-card p-6 space-y-5">
            <h2 className="text-sm font-medium">Reminders</h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Meeting reminders</p>
                <p className="text-sm text-muted-foreground">
                  Email attendees before an upcoming meeting.
                </p>
              </div>
              <Switch
                checked={meetingReminders}
                onCheckedChange={setMeetingReminders}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Action due-date reminders</p>
                <p className="text-sm text-muted-foreground">
                  Notify owners as an action&apos;s due date approaches.
                </p>
              </div>
              <Switch
                checked={actionReminders}
                onCheckedChange={setActionReminders}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Note: publishing an agenda or confirming minutes never sends
              email automatically — sending is always a separate, explicit
              step, regardless of these settings.
            </p>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <div className="rounded-md border border-border bg-card p-6 space-y-5">
            <h2 className="text-sm font-medium">Document access</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Allow download &amp; print
                </p>
                <p className="text-sm text-muted-foreground">
                  Let board members download or print board packs and
                  documents.
                </p>
              </div>
              <Switch
                checked={allowDownloadPrint}
                onCheckedChange={setAllowDownloadPrint}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              MFA and per-person access levels are managed once
              Authentication (Phase 5) is built — this section will grow
              here.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Save changes
        </button>
        {saved && (
          <span className="text-sm text-muted-foreground">Saved</span>
        )}
      </div>
    </div>
  );
}