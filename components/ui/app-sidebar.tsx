"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Inbox,
  UserCheck,
  Clock,
  BarChart3,
  Smartphone,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "./button";
import { Chat } from "@/app/dashboard-admin/types";
import { useAuthStore } from "@/store/authStore";
import { getChats } from "@/lib/api";
import { transformChatResponse } from "@/lib/transform";
import ThemeSwitcher from "./theme-switcher";

interface SidebarProps {
  chats?: Chat[];
  onSelectFilter?: (filter: "all" | "assigned" | "unassigned") => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

type MenuKey = "all" | "assigned" | "unassigned" | "dashboard" | "whatsapp" | "agents";

export default function SimpleSidebar({
  onSelectFilter,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const initialActive = useMemo((): MenuKey => {
    if (pathname === "/dashboard-admin-monitoring") return "dashboard";
    if (pathname === "/dashboard-admin/whatsapp") return "whatsapp";
    if (pathname === "/dashboard-admin/agents") return "agents";
    return "all";
  }, [pathname]);

  const [active, setActive] = useState<MenuKey>(initialActive);
  const [open, setOpen] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    setActive(initialActive);
  }, [initialActive]);

  useEffect(() => {
    async function fetchChats() {
      if (!token) return;
      try {
        const chatData = await getChats(token);
        const transformedChats = chatData.map(transformChatResponse) as Chat[];
        setChats(transformedChats);
      } catch (err) {
        console.error("Failed to load chats in sidebar:", err);
      }
    }
    fetchChats();
    const interval = setInterval(fetchChats, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const countAll = chats.length;
  const countAssigned = chats.filter((c) => c.mode === "agent").length;
  const countUnassigned = chats.filter((c) => c.mode === "bot").length;

  const menuItems = [
    {
      key: "dashboard" as const,
      label: "Dashboard",
      icon: <BarChart3 className="h-5 w-5 shrink-0" />,
      href: "/dashboard-admin-monitoring",
    },
    {
      key: "all" as const,
      label: "All Tickets",
      icon: <Inbox className="h-5 w-5 shrink-0" />,
      count: countAll,
      href: "/dashboard-admin",
    },
    {
      key: "assigned" as const,
      label: "Assigned",
      icon: <UserCheck className="h-5 w-5 shrink-0" />,
      count: countAssigned,
      href: "/dashboard-admin",
    },
    {
      key: "unassigned" as const,
      label: "Unassigned",
      icon: <Clock className="h-5 w-5 shrink-0" />,
      count: countUnassigned,
      href: "/dashboard-admin",
    },
    {
      key: "whatsapp" as const,
      label: "WhatsApp",
      icon: <Smartphone className="h-5 w-5 shrink-0" />,
      href: "/dashboard-admin/whatsapp",
    },
    {
      key: "agents" as const,
      label: "Agents",
      icon: <Users className="h-5 w-5 shrink-0" />,
      href: "/dashboard-admin/agents",
    },
  ];

  const handleClick = (key: MenuKey, href?: string) => {
    setActive(key);
    if (href) router.push(href);
    if (key !== "dashboard" && !href) {
      onSelectFilter?.(key as "all" | "assigned" | "unassigned");
    }
    onMobileClose?.();
  };

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Inbox className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white leading-tight">Inbox</h2>
              <p className="text-xs text-white/40 truncate">Manage tickets</p>
            </div>
          </div>
        )}

        {/* Desktop collapse button */}
        <Button
          onClick={() => setOpen(!open)}
          className="h-8 w-8 p-0 rounded-lg bg-white/5 hover:bg-white/15 text-white shrink-0 hidden md:flex items-center justify-center border-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        {/* Mobile close button */}
        <Button
          onClick={onMobileClose}
          className="h-8 w-8 p-0 rounded-lg bg-white/5 hover:bg-white/15 text-white shrink-0 md:hidden flex items-center justify-center border-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Menu */}
      <div className="flex flex-1 flex-col gap-0.5 px-3 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleClick(item.key, item.href)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 group relative ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/8 hover:text-white/90"
              }`}
            >
              <span className={`shrink-0 ${isActive ? "text-white" : "text-white/60 group-hover:text-white/80"}`}>
                {item.icon}
              </span>

              {!collapsed && (
                <>
                  <span className="flex-1 text-left text-sm font-medium truncate">
                    {item.label}
                  </span>
                  {"count" in item && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 tabular-nums ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-white/8 text-white/50"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </>
              )}

              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 hidden group-hover:flex items-center z-50 pointer-events-none">
                  <div className="bg-neutral-800 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-white/10">
                    {item.label}
                    {"count" in item && (
                      <span className="ml-1.5 opacity-60">({item.count})</span>
                    )}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer: Theme + Logout */}
      <div className="border-t border-white/10 px-3 py-4 shrink-0 space-y-1">
        {/* Theme */}
        {collapsed ? (
          <div className="flex justify-center">
            <ThemeSwitcher compact />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-xs text-white/40 font-medium">Theme</span>
            <ThemeSwitcher />
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => { logout(); router.replace("/login"); onMobileClose?.(); }}
          title={collapsed ? "Logout" : undefined}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-white/50 hover:bg-red-500/15 hover:text-red-400 transition-all duration-150 group relative"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
          {collapsed && (
            <div className="absolute left-full ml-3 hidden group-hover:flex items-center z-50 pointer-events-none">
              <div className="bg-neutral-800 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-white/10">
                Logout
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full bg-[#0F1320] border-r border-white/10 transition-all duration-300 shrink-0 ${
          open ? "w-64" : "w-18"
        }`}
      >
        <SidebarContent collapsed={!open} />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={onMobileClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Drawer */}
          <aside
            className="absolute left-0 top-0 h-full w-72 bg-[#0F1320] border-r border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent collapsed={false} />
          </aside>
        </div>
      )}
    </>
  );
}
