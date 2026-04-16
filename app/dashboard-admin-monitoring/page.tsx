"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import SimpleSidebar from "@/components/ui/app-sidebar";
import EmptyState from "@/components/ui/empty-state";
import {
  getAgentList,
  getTicketStats,
  getAllTickets,
  AgentUser,
  TicketStatsResponse,
  TicketResponse,
} from "@/lib/api";
import {
  Activity,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Zap,
  LogOut,
  Menu,
} from "lucide-react";
import { useMobileSidebar } from "@/store/mobileSidebarStore";

export default function AdminMonitoringPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const initialize = useAuthStore((state) => state.initialize);
  const logout = useAuthStore((state) => state.logout);

  const toggleMobileSidebar = useMobileSidebar((s) => s.toggle);

  const [agents, setAgents] = useState<AgentUser[]>([]);
  const [stats, setStats] = useState<TicketStatsResponse | null>(null);
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!token || !user) {
      router.push("/login");
      return;
    }

    if (user.role !== "admin") {
      router.push("/dashboard-agent");
      return;
    }

    const loadData = async () => {
      if (!token) return;

      try {
        const [agentsData, statsData, ticketsData] = await Promise.all([
          getAgentList(token),
          getTicketStats(token),
          getAllTickets(token, undefined, undefined, 100),
        ]);

        setAgents(agentsData);
        setStats(statsData);
        setTickets(ticketsData);
      } catch (error: unknown) {
        const err = error as Error;
        console.error("Error loading monitoring data:", err);

        if (
          err.message?.includes("Failed to fetch") ||
          err.message?.includes("ticket")
        ) {
          logout();
          alert("⚠️ Your session has expired.\n\nPlease login again to continue.");
          router.push("/login");
          return;
        }
      } finally {
        setLoading(false);
        setTimeout(() => setIsVisible(true), 50);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [router, token, user, logout]);

  const getAgentTicketCount = (agentId: number, status?: string) => {
    if (status) {
      return tickets.filter(
        (t) => t.assigned_agent_id === agentId && t.status === status
      ).length;
    }
    return tickets.filter((t) => t.assigned_agent_id === agentId).length;
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const filteredTickets = selectedAgent
    ? tickets.filter((t) => t.assigned_agent_id === selectedAgent)
    : tickets;

  // Calculate total from all status counts (more accurate than tickets.length)
  const totalTickets =
    (stats?.total_pending || 0) +
    (stats?.total_in_progress || 0) +
    (stats?.total_waiting_customer || 0) +
    (stats?.total_resolved || 0) +
    (stats?.total_assigned || 0) || 1;

  const pendingPercent = ((stats?.total_pending || 0) / totalTickets) * 100;
  const inProgressPercent = ((stats?.total_in_progress || 0) / totalTickets) * 100;
  const resolvedPercent = ((stats?.total_resolved || 0) / totalTickets) * 100;
  const waitingPercent = ((stats?.total_waiting_customer || 0) / totalTickets) * 100;

  const { open: mobileSidebarOpen, close: closeMobileSidebar } = useMobileSidebar();

  if (loading) {
    return (
      <div className="flex h-screen w-full">
        <SimpleSidebar mobileOpen={mobileSidebarOpen} onMobileClose={closeMobileSidebar} />
        <div className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
            <p className="text-slate-600 font-medium text-sm">Memuat dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <SimpleSidebar mobileOpen={mobileSidebarOpen} onMobileClose={closeMobileSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex-shrink-0 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="px-4 sm:px-8 py-4 sm:py-5 flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={toggleMobileSidebar}
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Title */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25 shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-slate-800 truncate">
                  Agent Performance Monitor
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">
                  Real-time insights • Updates every 10s
                </p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => { logout(); router.push("/login"); }}
              className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-8 py-4 sm:py-8 max-w-[1600px] mx-auto space-y-4 sm:space-y-8">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Users, title: "Total Agents", value: agents.length, color: "blue", delay: 0 },
                { icon: Zap, title: "Pending Queue", value: stats?.total_pending || 0, color: "amber", delay: 100 },
                { icon: Activity, title: "In Progress", value: stats?.total_in_progress || 0, color: "purple", delay: 200 },
                { icon: CheckCircle, title: "Resolved", value: stats?.total_resolved || 0, color: "emerald", delay: 300 },
              ].map((card, idx) => (
                <StatCard key={idx} {...card} isVisible={isVisible} />
              ))}
            </div>

            {/* Performance Metrics */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <MetricCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Avg Response Time"
                value={formatTime(stats?.avg_wait_time_seconds)}
                subtitle="From creation to assignment"
                color="blue"
              />
              <MetricCard
                icon={<Clock className="w-5 h-5" />}
                title="Avg Resolution Time"
                value={formatTime(stats?.avg_resolution_time_seconds)}
                subtitle="From creation to resolution"
                color="emerald"
              />
            </div>

            {/* Progress Distribution */}
            <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-8 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h2 className="text-lg font-semibold text-slate-800 mb-6">Ticket Status Distribution</h2>
              <div className="space-y-5">
                <ProgressBar label="Pending" value={stats?.total_pending || 0} percent={pendingPercent} color="amber" />
                <ProgressBar label="In Progress" value={stats?.total_in_progress || 0} percent={inProgressPercent} color="blue" />
                <ProgressBar label="Waiting Customer" value={stats?.total_waiting_customer || 0} percent={waitingPercent} color="orange" />
                <ProgressBar label="Resolved" value={stats?.total_resolved || 0} percent={resolvedPercent} color="emerald" />
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200/60">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <SummaryItem label="Total Tickets" value={totalTickets} color="slate" />
                  <SummaryItem label="Active" value={stats?.total_in_progress || 0} color="blue" />
                  <SummaryItem label="Resolved" value={stats?.total_resolved || 0} color="emerald" />
                  <SummaryItem label="Pending" value={stats?.total_pending || 0} color="amber" />
                </div>
              </div>
            </div>

            {/* Agent Performance Table */}
            <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden transition-all duration-700 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200/60">
                <h2 className="text-base sm:text-lg font-semibold text-slate-800">Agent Performance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="px-4 sm:px-8 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Agent</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Active</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">In Progress</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Resolved</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    {agents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-12">
                          <EmptyState
                            icon="user"
                            title="No Agents Found"
                            description="There are no agents registered in the system yet. Agents will appear here once they register and start handling tickets."
                          />
                        </td>
                      </tr>
                    ) : agents.map((agent) => {
                      const activeCount = getAgentTicketCount(agent.id, "assigned") + getAgentTicketCount(agent.id, "in_progress");
                      const inProgress = getAgentTicketCount(agent.id, "in_progress");
                      const resolved = getAgentTicketCount(agent.id, "resolved");

                      return (
                        <tr
                          key={agent.id}
                          className={`transition-all duration-200 hover:bg-slate-50/50 ${selectedAgent === agent.id ? "bg-blue-50/50" : ""}`}
                        >
                          <td className="px-4 sm:px-8 py-3 sm:py-5">
                            <div>
                              <div className="text-sm font-semibold text-slate-800">{agent.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{agent.email}</div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              agent.online ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${agent.online ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                              {agent.online ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-5 text-sm font-semibold text-slate-700">{activeCount}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-5 text-sm font-semibold text-slate-700">{inProgress}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-5 text-sm font-semibold text-slate-700">{resolved}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-5">
                            <button
                              onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              {selectedAgent === agent.id ? "Show All" : "View Tickets"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ticket List */}
            <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200/60">
                <h2 className="text-base sm:text-lg font-semibold text-slate-800 truncate">
                  {selectedAgent ? `Tickets for ${agents.find((a) => a.id === selectedAgent)?.name}` : "All Tickets"}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="px-4 sm:px-8 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Priority</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Agent</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    {filteredTickets.slice(0, 20).map((ticket) => (
                      <tr key={ticket.id} className="transition-all duration-200 hover:bg-slate-50/50">
                        <td className="px-4 sm:px-8 py-3 sm:py-5 text-sm font-semibold text-slate-700">#{ticket.id}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-5">
                          <div className="text-sm font-medium text-slate-800">{ticket.customer_name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{ticket.customer_phone}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-5"><StatusBadge status={ticket.status} /></td>
                        <td className="px-4 sm:px-6 py-3 sm:py-5"><PriorityBadge priority={ticket.priority} /></td>
                        <td className="px-4 sm:px-6 py-3 sm:py-5 text-sm text-slate-700 whitespace-nowrap">{ticket.agent_name || "-"}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-5 text-xs text-slate-500 whitespace-nowrap">{new Date(ticket.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  color,
  delay,
  isVisible,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  color: string;
  delay: number;
  isVisible: boolean;
}) {
  const colors = {
    blue: { bg: "from-blue-500 to-blue-600", ring: "ring-blue-500/20", shadow: "shadow-blue-500/25", text: "text-blue-600" },
    amber: { bg: "from-amber-500 to-amber-600", ring: "ring-amber-500/20", shadow: "shadow-amber-500/25", text: "text-amber-600" },
    purple: { bg: "from-purple-500 to-purple-600", ring: "ring-purple-500/20", shadow: "shadow-purple-500/25", text: "text-purple-600" },
    emerald: { bg: "from-emerald-500 to-emerald-600", ring: "ring-emerald-500/20", shadow: "shadow-emerald-500/25", text: "text-emerald-600" },
  };

  const theme = colors[color as keyof typeof colors];

  return (
    <div
      className={`group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${theme.bg} ring-4 ${theme.ring} shadow-lg ${theme.shadow} mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
      <p className={`text-3xl font-bold ${theme.text} tracking-tight`}>{value}</p>
    </div>
  );
}

function MetricCard({ icon, title, value, subtitle, color }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  const colors = { blue: "text-blue-600", emerald: "text-emerald-600" };
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-3">
        <div className={colors[color as keyof typeof colors]}>{icon}</div>
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      <div className={`text-4xl font-bold ${colors[color as keyof typeof colors]} mb-2 tracking-tight`}>{value}</div>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function ProgressBar({ label, value, percent, color }: {
  label: string;
  value: number;
  percent: number;
  color: string;
}) {
  const colors = {
    amber: { bar: "bg-amber-500", bg: "bg-amber-100" },
    blue: { bar: "bg-blue-500", bg: "bg-blue-100" },
    orange: { bar: "bg-orange-500", bg: "bg-orange-100" },
    emerald: { bar: "bg-emerald-500", bg: "bg-emerald-100" },
  };
  const theme = colors[color as keyof typeof colors];

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm text-slate-600 font-semibold">
          {value} <span className="text-slate-400 font-normal">({Math.round(percent)}%)</span>
        </span>
      </div>
      <div className={`w-full ${theme.bg} rounded-full h-2.5 overflow-hidden`}>
        <div className={`${theme.bar} h-2.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = { slate: "text-slate-700", blue: "text-blue-600", emerald: "text-emerald-600", amber: "text-amber-600" };
  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${colors[color as keyof typeof colors]} tracking-tight`}>{value}</div>
      <div className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusMap = {
    pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
    assigned: { bg: "bg-blue-100", text: "text-blue-700", label: "Assigned" },
    in_progress: { bg: "bg-purple-100", text: "text-purple-700", label: "In Progress" },
    waiting_customer: { bg: "bg-orange-100", text: "text-orange-700", label: "Waiting" },
    resolved: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Resolved" },
    escalated: { bg: "bg-red-100", text: "text-red-700", label: "Escalated" },
    closed: { bg: "bg-slate-100", text: "text-slate-600", label: "Closed" },
  };
  const theme = statusMap[status as keyof typeof statusMap] || { bg: "bg-slate-100", text: "text-slate-600", label: status };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${theme.bg} ${theme.text}`}>
      {theme.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const priorityMap = {
    low: { bg: "bg-slate-100", text: "text-slate-600", label: "Low" },
    medium: { bg: "bg-blue-100", text: "text-blue-700", label: "Medium" },
    high: { bg: "bg-orange-100", text: "text-orange-700", label: "High" },
    urgent: { bg: "bg-red-100", text: "text-red-700", label: "Urgent" },
  };
  const theme = priorityMap[priority as keyof typeof priorityMap] || { bg: "bg-slate-100", text: "text-slate-600", label: priority };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${theme.bg} ${theme.text}`}>
      {theme.label}
    </span>
  );
}
