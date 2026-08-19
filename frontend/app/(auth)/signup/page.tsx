"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
];

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1 State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Step 2 State
  const [organisationName, setOrganisationName] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [country, setCountry] = useState("India");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill out all fields.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError("You must accept the Terms of Use and AI Terms.");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/register", { 
        name, 
        email, 
        password, 
        organisationName,
        physicalAddress,
        country
      });
      login(res.data.accessToken, res.data.user);
      router.push("/welcome");
    } catch (err: any) {
      if (!err.response) {
        setError("Unable to connect to the server. Please try again later.");
      } else {
        const msg = err.response?.data?.message;
        if (Array.isArray(msg)) {
          setError(msg.join(". "));
        } else {
          setError(msg || "Failed to register");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          {step === 1 ? "Create an account" : "Set up your organisation"}
        </h2>
        {step === 1 && (
          <p className="text-sm text-slate-500 mt-1">Get started with SegueMeet today.</p>
        )}
      </div>

      <form onSubmit={step === 1 ? handleNext : handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}
        
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <Button type="submit" className="w-full h-11 text-[15px] bg-[#333366] hover:bg-[#2a2a55] mt-2">
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="organisationName">Organisation name</Label>
              <Input 
                id="organisationName" 
                type="text" 
                placeholder="CEO" 
                value={organisationName}
                onChange={(e) => setOrganisationName(e.target.value)}
                className="bg-blue-50/50 border-blue-100"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="physicalAddress">Physical address</Label>
              <div className="relative">
                <Input 
                  id="physicalAddress" 
                  type="text" 
                  placeholder="Address..." 
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  className="pr-10"
                />
                {physicalAddress && (
                  <button 
                    type="button" 
                    onClick={() => setPhysicalAddress("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={(val) => setCountry(val || "")}>
                <SelectTrigger className="w-full h-10 border-slate-200">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-3 py-2">
              <input 
                type="checkbox" 
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" 
              />
              <Label htmlFor="terms" className="text-sm font-normal text-slate-700">
                I have read and accept the <Link href="#" className="text-blue-600 hover:underline">Terms of Use</Link> and <Link href="#" className="text-blue-600 hover:underline">AI Terms</Link>. *
              </Label>
            </div>

            <Button type="submit" className="w-full h-12 text-[15px] font-medium bg-[#31327c] hover:bg-[#282965] mt-4" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Trial...
                </>
              ) : (
                "Start Trial"
              )}
            </Button>
          </div>
        )}
      </form>

      {step === 1 && (
        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      )}
      
      {step === 2 && (
        <div className="mt-6 text-center text-sm">
          <button 
            type="button" 
            onClick={() => setStep(1)}
            className="text-slate-500 hover:text-slate-800"
          >
            ← Back to account details
          </button>
        </div>
      )}
    </div>
  );
}
