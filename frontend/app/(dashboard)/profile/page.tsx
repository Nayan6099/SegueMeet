"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "account";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [title, setTitle] = useState("");
  const [suffix, setSuffix] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      const parts = (profile.name || "").split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setMobileNumber(profile.mobileNumber || "");
      setTitle(profile.title || "");
      setSuffix(profile.suffix || "");
      setAvatarUrl(profile.avatarUrl || null);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/auth/me", {
        name: `${firstName} ${lastName}`.trim(),
        mobileNumber,
        title,
        suffix,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully!");
      window.location.reload(); // Refresh to update user context in topbar globally
    },
    onError: () => {
      toast.error("Failed to update profile.");
    }
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/auth/me/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setAvatarUrl(data.avatarUrl);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile picture updated!");
    },
    onError: () => {
      toast.error("Failed to upload profile picture.");
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1024 * 1024) {
        toast.error("File is too large. Max 1MB.");
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold flex items-baseline gap-2 text-slate-800">
            My Account
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Manage your account details
            </span>
          </h1>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="flex items-center justify-between border-b pb-0 mb-6">
          <TabsList className="bg-transparent h-auto p-0 rounded-none border-none flex-nowrap overflow-x-auto w-full justify-start space-x-4 md:space-x-6 scrollbar-hide">
            <TabsTrigger
              value="account"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-semibold text-slate-700 hover:text-slate-900"
            >
              My Account
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-500 hover:text-slate-700"
            >
              Login & Security
            </TabsTrigger>
            <TabsTrigger
              value="organisations"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium text-slate-500 hover:text-slate-700"
            >
              Organisations
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="account" className="mt-0">
          <div className="flex justify-end mb-6">
            <Button 
              onClick={() => updateMutation.mutate()} 
              disabled={updateMutation.isPending}
              className="bg-[#d4cae5] hover:bg-[#c4b5db] text-[#581c87] font-medium px-6 h-9 rounded-md transition-colors"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
          <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-lg p-4 md:p-8 shadow-sm">
            
            {/* First Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6 first:pt-0">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">First Name</h3>
                <p className="text-xs text-slate-500 mt-1">Max 50 characters</p>
              </div>
              <div className="col-span-2">
                <Input 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  className="max-w-2xl text-slate-700 h-10 border-slate-200" 
                  maxLength={50}
                />
              </div>
            </div>

            {/* Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Last Name</h3>
                <p className="text-xs text-slate-500 mt-1">Max 50 characters</p>
              </div>
              <div className="col-span-2">
                <Input 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  className="max-w-2xl h-10 border-slate-200 text-slate-700" 
                  maxLength={50}
                />
              </div>
            </div>

            {/* Profile Picture */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6 items-center">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Profile Picture</h3>
              </div>
              <div className="col-span-2 flex items-center gap-4">
                <Avatar className="h-12 w-12 bg-blue-100 text-blue-700">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                  <AvatarFallback className="font-semibold text-sm">
                    {firstName.charAt(0).toUpperCase()}{lastName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.gif" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                />
                <Button 
                  variant="secondary" 
                  className="h-8 text-xs font-medium"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAvatarMutation.isPending}
                >
                  {uploadAvatarMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                  Choose
                </Button>
                <span className="text-xs text-slate-500">JPG, GIF or PNG. 1MB Max.</span>
              </div>
            </div>

            {/* Mobile Number */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Mobile Number</h3>
                <p className="text-xs text-slate-500 mt-1">Max 16 characters</p>
              </div>
              <div className="col-span-2">
                <Input 
                  value={mobileNumber} 
                  onChange={(e) => setMobileNumber(e.target.value)} 
                  className="max-w-2xl h-10 border-slate-200 text-slate-700" 
                  maxLength={16}
                />
              </div>
            </div>

            {/* Title */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Title</h3>
                <p className="text-xs text-slate-500 mt-1">Max 30 characters</p>
              </div>
              <div className="col-span-2">
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="max-w-2xl h-10 border-slate-200 text-slate-700" 
                  maxLength={30}
                />
              </div>
            </div>
            
            {/* Suffix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 py-6 pb-2">
              <div className="col-span-1">
                <h3 className="text-sm font-medium text-slate-800">Suffix</h3>
                <p className="text-xs text-slate-500 mt-1">Max 30 characters</p>
              </div>
              <div className="col-span-2">
                <Input 
                  value={suffix} 
                  onChange={(e) => setSuffix(e.target.value)} 
                  className="max-w-2xl h-10 border-slate-200 text-slate-700" 
                  maxLength={30}
                />
              </div>
            </div>

          </div>
        </TabsContent>
        
        <TabsContent value="security">
          <div className="p-8 text-center text-slate-500 border rounded-lg bg-white mt-4 shadow-sm">
            Login & Security settings coming soon.
          </div>
        </TabsContent>
        
        <TabsContent value="organisations" className="mt-4">
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden p-6">
            
            {profile?.memberships?.map((membership: any) => (
              <div key={membership.organisationId} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-slate-200 shrink-0"></div>
                  <span className="font-semibold text-slate-800">{membership.organisation.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500">Free trial: 30 days left</span>
                  <Button className="h-8 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm rounded-md px-4">Buy Now</Button>
                </div>
              </div>
            ))}
            
            {(!profile?.memberships || profile.memberships.length === 0) && (
              <div className="text-center text-slate-500 py-8">No active organisations.</div>
            )}
            
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
