"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function AuthInitializer() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Initialize auth from localStorage on mount
    initialize();
  }, [initialize]);

  return null;
}
