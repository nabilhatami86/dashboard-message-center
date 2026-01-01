"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Role } from "@/store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role | Role[];
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.replace("/login");
      return;
    }

    // Check role if specified
    if (requiredRole) {
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

      if (!allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        if (user.role === "admin") {
          router.replace("/dashboard-admin");
        } else if (user.role === "agent") {
          router.replace("/dashboard-agent");
        } else {
          router.replace("/login");
        }
      }
    }
  }, [user, requiredRole, router]);

  // Show loading or nothing while checking auth
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-lg font-semibold text-neutral-900">Loading...</div>
          <div className="text-sm text-neutral-500">Checking authentication</div>
        </div>
      </div>
    );
  }

  // Check role access
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(user.role)) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">Access Denied</div>
            <div className="text-sm text-neutral-500">Redirecting...</div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
