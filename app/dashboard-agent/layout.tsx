"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // proteksi role agent
  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "agent") {
      router.replace("/dashboard-admin");
    }
  }, [user, router]);

  if (!user || user.role !== "agent") return null;

  return <div className="h-screen w-full overflow-hidden">{children}</div>;
}
