"use client";

import { useState } from "react";
import { useThemeStore, ThemeType } from "@/store/themeStore";
import { themes } from "@/lib/themes";
import { Palette, Check } from "lucide-react";
import { Button } from "./button";

interface ThemeSwitcherProps {
  compact?: boolean; // icon-only mode untuk sidebar collapsed
}

export default function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center gap-2 ${compact ? "h-8 w-8 p-0 justify-center" : ""}`}
        title={compact ? "Ganti tema" : undefined}
      >
        <Palette className="h-4 w-4 shrink-0" />
        {!compact && <span className="hidden sm:inline">Theme</span>}
      </Button>

      {isOpen && (
        <>
          {/* overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* dropdown — saat compact buka ke kanan, normal buka ke kiri */}
          <div
            className={`absolute bottom-full mb-2 z-50 w-60 rounded-xl border bg-white shadow-2xl overflow-hidden ${
              compact ? "left-full ml-3 bottom-auto top-0" : "right-0"
            }`}
          >
            <div className="px-3 py-2.5 border-b bg-neutral-50">
              <p className="text-sm font-semibold text-neutral-900">Pilih Tema</p>
              <p className="text-xs text-neutral-500">Sesuaikan tampilan dashboard</p>
            </div>

            <div className="max-h-64 overflow-y-auto p-2 space-y-0.5">
              {Object.values(themes).map((themeOption) => {
                const isActive = theme === themeOption.type;

                return (
                  <button
                    key={themeOption.type}
                    onClick={() => handleThemeChange(themeOption.type)}
                    className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{themeOption.icon}</span>
                      <span className="text-sm font-medium">{themeOption.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex gap-0.5">
                        <div
                          className="w-3 h-3 rounded-full border border-black/10"
                          style={{ backgroundColor: themeOption.colors.primary }}
                        />
                        <div
                          className="w-3 h-3 rounded-full border border-black/10"
                          style={{ backgroundColor: themeOption.colors.secondary }}
                        />
                        <div
                          className="w-3 h-3 rounded-full border border-black/10"
                          style={{ backgroundColor: themeOption.colors.accent }}
                        />
                      </div>
                      {isActive && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
