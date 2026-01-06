"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Inbox,
  UserCheck,
  Clock,
  BarChart3,
  // LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "./button";
import { Chat } from "@/app/dashboard-admin/types";
import { useAuthStore } from "@/store/authStore";
import { getChats } from "@/lib/api";
import { transformChatResponse } from "@/lib/transform";

interface SidebarProps {
  chats?: Chat[];
  onSelectFilter?: (filter: "all" | "assigned" | "unassigned") => void;
}

type MenuKey = "all" | "assigned" | "unassigned" | "dashboard";

export default function SimpleSidebar({
  onSelectFilter,
}: SidebarProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const [active, setActive] = useState<MenuKey>("all");
  const [open, setOpen] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);

  // Fetch chats dari backend
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
    // Refresh setiap 15 detik
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
      icon: <BarChart3 className="h-5 w-5" />,
      isLink: true,
      href: "/dashboard-admin-monitoring",
    },
    {
      key: "all" as const,
      label: "All Tickets",
      icon: <Inbox className="h-5 w-5" />,
      count: countAll,
    },
    {
      key: "assigned" as const,
      label: "Assigned",
      icon: <UserCheck className="h-5 w-5" />,
      count: countAssigned,
    },
    {
      key: "unassigned" as const,
      label: "Unassigned",
      icon: <Clock className="h-5 w-5" />,
      count: countUnassigned,
    },
  ];

  const handleClick = (key: MenuKey) => {
    setActive(key);
    // Only call onSelectFilter for filter keys (not dashboard)
    if (key !== "dashboard") {
      onSelectFilter?.(key as "all" | "assigned" | "unassigned");
    }
  };

  // const handleLogout = () => {
  //   logout();
  //   router.replace("/login");
  // };

  return (
    <aside
      className={`flex h-full flex-col bg-[#0F1320] border-r border-white/10 transition-all duration-300 ${
        open ? "w-72" : "w-20"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
        {open && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Inbox className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white">Inbox</h2>
              <p className="text-xs text-white/50">Manage tickets</p>
            </div>
          </div>
        )}

        <Button
          onClick={() => setOpen(!open)}
          className="h-9 w-9 p-0 rounded-lg bg-white/5 hover:bg-white/10 text-white"
        >
          {open ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Menu */}
      <div className="flex flex-1 flex-col gap-1 px-3 py-4">
        {menuItems.map((item) => {
          const isActive = active === item.key;

          return (
            <button
              key={item.key}
              onClick={() => {
                if ("isLink" in item && item.isLink && "href" in item) {
                  router.push(item.href as string);
                } else {
                  handleClick(item.key as MenuKey);
                }
              }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/5"
              }`}
            >
              {item.icon}

              {open && (
                <>
                  <span className="flex-1 text-sm font-medium">
                    {item.label}
                  </span>
                  {"count" in item && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Logout */}
      {/* <div className="border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-white/70 hover:bg-white/5 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {open && <span className="text-sm">Logout</span>}
        </button>
      </div> */}
    </aside>
  );
}
