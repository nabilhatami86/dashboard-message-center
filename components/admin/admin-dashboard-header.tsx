import { MessageSquare, Users, BarChart3, LogOut, Menu } from "lucide-react";

type Tab = "customer" | "agent";

interface AdminDashboardHeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onMenuClick: () => void;
  onMonitoring: () => void;
  onLogout: () => void;
}

export function AdminDashboardHeader({
  activeTab,
  onTabChange,
  onMenuClick,
  onMonitoring,
  onLogout,
}: AdminDashboardHeaderProps) {
  return (
    <header className="flex items-center gap-2 px-3 sm:px-4 h-14 bg-white border-b border-neutral-200 flex-shrink-0 shadow-sm">
      <button
        onClick={onMenuClick}
        className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors shrink-0"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Tabs */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-0.5 bg-neutral-100 rounded-xl p-1">
          {(["customer", "agent"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {tab === "customer" ? (
                <MessageSquare className="h-4 w-4 shrink-0" />
              ) : (
                <Users className="h-4 w-4 shrink-0" />
              )}
              <span className="hidden xs:inline sm:inline">
                {tab === "customer" ? "Agent Chats" : "Internal Chat"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onMonitoring}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all"
          title="Agent Monitoring"
        >
          <BarChart3 className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Monitoring</span>
        </button>
        <button
          onClick={onLogout}
          className="flex items-center justify-center h-8 w-8 rounded-lg text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
