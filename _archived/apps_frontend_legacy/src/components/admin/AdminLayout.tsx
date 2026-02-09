"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

const SUPER_ADMIN_EMAIL = "josephemsamah@gmail.com";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user is admin
      if (user.role !== "admin") {
        router.push("/");
        return;
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only allow super admin to access full admin panel
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 p-6 bg-red-500/5 border border-red-500/20 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h1 className="font-bold text-red-700">Access Denied</h1>
              <p className="text-sm text-red-600 mt-1">
                You do not have permission to access the admin panel.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export { SUPER_ADMIN_EMAIL };
