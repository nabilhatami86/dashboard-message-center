"use client";

import { useState } from "react";
import {
  MessageSquare,
  ShieldCheck,
  LogOut,
  Ticket,
  Menu,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import ThemeSwitcher from "./theme-switcher";

interface AgentSidebarProps {
  activeTab: "customer" | "admin";
  onTabChange: (tab: "customer" | "admin") => void;
}

export default function AgentSidebar({
  activeTab,
  onTabChange,
}: AgentSidebarProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    {
      id: "customer" as const,
      icon: MessageSquare,
      label: "Customer Chats",
      onClick: () => {
        onTabChange("customer");
        setIsOpen(false);
      },
      isActive: activeTab === "customer",
    },
    {
      id: "admin" as const,
      icon: ShieldCheck,
      label: "Admin Chat",
      onClick: () => {
        onTabChange("admin");
        setIsOpen(false);
      },
      isActive: activeTab === "admin",
    },
    {
      id: "queue",
      icon: Ticket,
      label: "Ticket Queue",
      onClick: () => {
        router.push("/dashboard-agent-queue");
        setIsOpen(false);
      },
      isActive: false,
      highlight: true,
    },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center shadow-lg"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-40
          h-full bg-gradient-to-b from-neutral-900 to-neutral-800
          flex flex-col py-4 gap-2
          transition-all duration-300 ease-in-out
          shadow-xl md:shadow-none
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isOpen ? "w-64" : "w-64 md:w-20"}
        `}
      >
        {/* Header - Mobile only */}
        <div className={`px-4 mb-4 md:hidden ${isOpen ? "block" : "hidden"}`}>
          <h2 className="text-white font-semibold text-lg">Agent Dashboard</h2>
          <p className="text-neutral-400 text-xs">
            Kelola chat customer & admin
          </p>
        </div>

        {/* Menu Items */}
        <div className="flex-1 px-2 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`
                  group relative w-full rounded-xl
                  flex items-center gap-3
                  transition-all duration-200
                  ${
                    isOpen
                      ? "px-4 py-3 justify-start"
                      : "px-0 py-3 justify-center md:px-0"
                  }
                  ${
                    item.isActive
                      ? "bg-white text-neutral-900 shadow-lg"
                      : item.highlight
                      ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white"
                      : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                  }
                `}
                title={!isOpen ? item.label : undefined}
              >
                <Icon
                  className={`h-5 w-5 flex-shrink-0 ${isOpen ? "" : "mx-auto"}`}
                />
                {isOpen && (
                  <span className="text-sm font-medium truncate">
                    {item.label}
                  </span>
                )}

                {/* Tooltip for desktop closed state */}
                {!isOpen && (
                  <div className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="px-2">
          <div className="border-t border-neutral-700" />
        </div>

        {/* Bottom Actions */}
        <div className="px-2 space-y-2 flex flex-col">
          {/* Row: Logout (left) - Theme (right) */}
          <div className="flex items-center justify-between">
            {/* Logout */}
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className={`
        group relative rounded-xl
        flex items-center gap-3
        transition-all duration-200
        bg-neutral-800 text-neutral-400
        hover:bg-red-600 hover:text-white
        ${isOpen ? "px-4 py-3 justify-start" : "px-3 py-3 justify-center"}
      `}
              title={!isOpen ? "Logout" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span className="text-sm font-medium">Logout</span>}

              {/* Tooltip desktop closed */}
              {!isOpen && (
                <div className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Logout
                </div>
              )}
            </button>

            {/* Theme Switcher (right) */}
            <div className="ml-auto">
              <ThemeSwitcher />
            </div>
          </div>
        </div>

        {/* Toggle Button - Desktop only */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden md:flex mx-2 mt-2 px-0 py-2 rounded-lg bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-all items-center justify-center"
          title={isOpen ? "Tutup sidebar" : "Buka sidebar"}
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </aside>
    </>
  );
}
