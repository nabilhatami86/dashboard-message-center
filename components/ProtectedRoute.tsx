"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  role,
  children,
}: {
  role: "admin" | "agent";
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== role) {
      router.push("/login");
    }
  }, [user, role, router]);

  if (!user || user.role !== role) return null;

  return <>{children}</>;
}
