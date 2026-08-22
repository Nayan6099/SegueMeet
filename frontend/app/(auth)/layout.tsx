import { GuestGuard } from "@/components/auth/guest-guard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-3 sm:p-4 py-6 sm:py-12">
        <div className="w-full max-w-md">
          {/* Branding placeholder */}
          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">SegueMeet</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Board management, simplified.</p>
          </div>
          
          {/* Card Container */}
          <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
