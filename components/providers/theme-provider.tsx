"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    // Apply theme on mount and when it changes
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return <>{children}</>;
}
