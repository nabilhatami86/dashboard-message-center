"use client";

import { useState } from "react";
import { useThemeStore, ThemeType } from "@/store/themeStore";
import { themes } from "@/lib/themes";
import { Palette, Check } from "lucide-react";
import { Button } from "./button";

export default function ThemeSwitcher() {
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
        className="flex items-center gap-2"
      >
        <Palette className="h-4 w-4" />
        <span className="hidden sm:inline">Theme</span>
      </Button>

      {isOpen && (
        <>
          {/* overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* dropdown */}
          <div className="absolute right-0 bottom-full mb-2 z-50 w-60 rounded-lg border bg-white shadow-xl">
            <div className="px-3 py-2 border-b">
              <p className="text-sm font-semibold text-gray-900">
                Choose Theme
              </p>
              <p className="text-xs text-gray-500">
                Select your preferred color scheme
              </p>
            </div>

            {/* scrollable list */}
            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
              {Object.values(themes).map((themeOption) => {
                const isActive = theme === themeOption.type;

                return (
                  <button
                    key={themeOption.type}
                    onClick={() => handleThemeChange(themeOption.type)}
                    className={`
                      w-full flex items-center justify-between gap-3
                      rounded-md px-3 py-2 text-left transition
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-100"
                      }
                    `}
                  >
                    {/* left */}
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{themeOption.icon}</span>
                      <span className="text-sm font-medium">
                        {themeOption.name}
                      </span>
                    </div>

                    {/* right */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{
                            backgroundColor: themeOption.colors.primary,
                          }}
                        />
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{
                            backgroundColor: themeOption.colors.secondary,
                          }}
                        />
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: themeOption.colors.accent }}
                        />
                      </div>

                      {isActive && <Check className="h-4 w-4 text-blue-600" />}
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
