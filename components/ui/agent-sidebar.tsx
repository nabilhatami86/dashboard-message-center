"use client";

import { useState } from "react";
import {
  MessageSquare,
  ShieldCheck,
  LogOut,
  Ticket,
  Zap,
  Menu,
  X,
  UserCog,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { updateMyTag } from "@/lib/api";
import ThemeSwitcher from "./theme-switcher";

interface AgentSidebarProps {
  activeTab: "customer" | "admin" | "shortcuts";
  onTabChange: (tab: "customer" | "admin" | "shortcuts") => void;
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ onClose }: { onClose: () => void }) {
  const token = useAuthStore((s) => s.token) ?? "";
  const user = useAuthStore((s) => s.user);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError("Tag tidak boleh kosong"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await updateMyTag(token, displayName);
      setSuccess(`Tag berhasil diubah: ~ ${res.display_name}`);
      setTimeout(onClose, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="font-semibold text-neutral-900 dark:text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3 space-y-1">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Login sebagai</p>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-neutral-400">@{user?.username}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Tag di Pesan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="contoh: Agent John"
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-neutral-400 mt-1">
              Muncul sebagai <span className="font-medium">~ {displayName || "..."}</span> di setiap pesanmu
            </p>
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
              <CheckCircle className="h-4 w-4" /> {success}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AgentSidebar({
  activeTab,
  onTabChange,
}: AgentSidebarProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

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
      id: "shortcuts" as const,
      icon: Zap,
      label: "Shortcuts",
      onClick: () => {
        onTabChange("shortcuts");
        setIsOpen(false);
      },
      isActive: activeTab === "shortcuts",
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
          {/* Edit Profile */}
          <button
            onClick={() => setShowProfile(true)}
            className={`
              group relative w-full rounded-xl
              flex items-center gap-3
              transition-all duration-200
              bg-neutral-800 text-neutral-400
              hover:bg-neutral-700 hover:text-white
              ${isOpen ? "px-4 py-3 justify-start" : "px-0 py-3 justify-center"}
            `}
            title={!isOpen ? "Edit Profile" : undefined}
          >
            <UserCog className={`h-5 w-5 flex-shrink-0 ${isOpen ? "" : "mx-auto"}`} />
            {isOpen && <span className="text-sm font-medium">Edit Profile</span>}
            {!isOpen && (
              <div className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Edit Profile
              </div>
            )}
          </button>

          {/* Row: Logout (left) - Theme (right) */}
          <div className="flex items-center justify-between">
            {/* Logout */}
            <button
              onClick={async () => {
                await logout();
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

      {/* Edit Profile Modal */}
      {showProfile && <EditProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
}
