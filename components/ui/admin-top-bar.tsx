"use client";

import { useRouter } from "next/navigation";
import { Menu, LogOut, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useMobileSidebar } from "@/store/mobileSidebarStore";

interface AdminTopBarProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  showBack?: boolean;
  backHref?: string;
  children?: React.ReactNode; // slot untuk tombol tambahan di kanan
}

export default function AdminTopBar({
  title,
  subtitle,
  icon,
  showBack = false,
  backHref,
  children,
}: AdminTopBarProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const toggleMobileSidebar = useMobileSidebar((s) => s.toggle);

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  return (
    <header className="flex items-center gap-2 px-3 sm:px-5 h-14 bg-white border-b border-neutral-200 shadow-sm shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={toggleMobileSidebar}
        className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors shrink-0"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Optional back button */}
      {showBack && (
        <button
          onClick={handleBack}
          className="hidden md:flex items-center justify-center h-8 w-8 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors shrink-0"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}

      {/* Icon + Title */}
      {(icon || title) && (
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {icon && (
            <div className="h-8 w-8 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
              <span className="text-white">{icon}</span>
            </div>
          )}
          <div className="min-w-0">
            {title && (
              <p className="text-sm font-semibold text-neutral-900 truncate">{title}</p>
            )}
            {subtitle && (
              <p className="text-xs text-neutral-400 truncate hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>
      )}

      {/* Right slot (custom actions) */}
      {children && <div className="flex items-center gap-1.5 shrink-0">{children}</div>}

      {/* Spacer jika tidak ada title/children kiri */}
      {!icon && !title && !children && <div className="flex-1" />}

      {/* Logout — selalu tampil */}
      <button
        onClick={() => { logout(); router.replace("/login"); }}
        className="flex items-center justify-center h-8 w-8 rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0 ml-auto"
        title="Logout"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </header>
  );
}
