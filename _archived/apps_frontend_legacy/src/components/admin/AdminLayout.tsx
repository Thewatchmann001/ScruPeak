"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { Loader } from "lucide-react";

// Environment variable for Super Admin identity
const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for auth state to resolve
    if (isLoading) return;

    // 1. Unauthenticated users go to login
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // 2. Authenticated but not an admin goes home
    if (user.role !== "admin") {
      router.push("/");
      return;
    }

    // 3. Authorization for Super Admin pages
    const isManagePage = pathname.startsWith("/admin/manage");
    if (isManagePage && user.email !== SUPER_ADMIN_EMAIL) {
      router.push("/admin");
    }
  }, [user, isLoading, router, pathname]);

  // Show loading state while checking permissions
  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Verifying credentials...</p>
      </div>
    );
  }

  return <>{children}</>;
}