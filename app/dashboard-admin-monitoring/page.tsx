"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useMobileSidebar } from "@/store/mobileSidebarStore";
import SimpleSidebar from "@/components/ui/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard, StatCardSkeleton } from "@/components/ui/stat-card";
import { ProgressBar, MetricCard, SummaryItem } from "@/components/ui/progress-bar";
import { getAgentList, getTicketStats, getAllTickets, AgentUser, TicketStatsResponse, TicketResponse } from "@/lib/api";
import { AgentPerformanceTable } from "@/components/admin/agent-performance-table";
import { TicketListTable } from "@/components/admin/ticket-list-table";
import { Activity, Users, Clock, CheckCircle, TrendingUp, Zap, LogOut, Menu } from "lucide-react";

export default function AdminMonitoringPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const initialize = useAuthStore((state) => state.initialize);
  const logout = useAuthStore((state) => state.logout);
  const { open: mobileSidebarOpen, close: closeMobileSidebar, toggle: toggleMobileSidebar } = useMobileSidebar();

  const [agents, setAgents] = useState<AgentUser[]>([]);
  const [stats, setStats] = useState<TicketStatsResponse | null>(null);
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    if (!token || !user) { router.push("/login"); return; }
    if (user.role !== "admin") { router.push("/dashboard-agent"); return; }

    const loadData = async () => {
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
        if (err.message?.includes("Failed to fetch") || err.message?.includes("ticket")) {
          logout();
          alert("⚠️ Your session has expired.\n\nPlease login again to continue.");
          router.push("/login");
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

  const getAgentTicketCount = (agentId: number, status?: string) =>
    tickets.filter((t) => t.assigned_agent_id === agentId && (!status || t.status === status)).length;

  const formatTime = (seconds?: number) => {
    if (!seconds) return "N/A";
    return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  };

  const filteredTickets = selectedAgent
    ? tickets.filter((t) => t.assigned_agent_id === selectedAgent)
    : tickets;

  const totalTickets =
    (stats?.total_pending || 0) + (stats?.total_in_progress || 0) +
    (stats?.total_waiting_customer || 0) + (stats?.total_resolved || 0) +
    (stats?.total_assigned || 0) || 1;

  if (loading) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <SimpleSidebar mobileOpen={mobileSidebarOpen} onMobileClose={closeMobileSidebar} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-8 py-4 sm:py-5 flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-52 mb-1" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-8 max-w-[1600px] mx-auto w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </div>
            <div className="bg-white/80 rounded-2xl border border-slate-200/60 p-8 space-y-5">
              <Skeleton className="h-5 w-48 mb-6" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
              ))}
            </div>
            <div className="bg-white/80 rounded-2xl border border-slate-200/60 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-200/60">
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="divide-y divide-slate-200/60">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-8 py-5 flex gap-6">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </div>
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
        <div className={`bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex-shrink-0 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <div className="px-4 sm:px-8 py-4 sm:py-5 flex items-center gap-3">
            <button
              onClick={toggleMobileSidebar}
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25 shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-slate-800 truncate">Agent Performance Monitor</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">Real-time insights • Updates every 10s</p>
              </div>
            </div>
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
                { icon: Users,        title: "Total Agents",  value: agents.length,                  color: "blue"    as const, delay: 0 },
                { icon: Zap,          title: "Pending Queue", value: stats?.total_pending || 0,       color: "amber"   as const, delay: 100 },
                { icon: Activity,     title: "In Progress",   value: stats?.total_in_progress || 0,   color: "purple"  as const, delay: 200 },
                { icon: CheckCircle,  title: "Resolved",      value: stats?.total_resolved || 0,      color: "emerald" as const, delay: 300 },
              ].map((card, idx) => (
                <StatCard key={idx} {...card} isVisible={isVisible} />
              ))}
            </div>

            {/* Performance Metrics */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-700 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
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

            {/* Ticket Status Distribution */}
            <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-8 transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <h2 className="text-lg font-semibold text-slate-800 mb-6">Ticket Status Distribution</h2>
              <div className="space-y-5">
                <ProgressBar label="Pending"          value={stats?.total_pending || 0}           percent={((stats?.total_pending || 0) / totalTickets) * 100}           color="amber" />
                <ProgressBar label="In Progress"      value={stats?.total_in_progress || 0}       percent={((stats?.total_in_progress || 0) / totalTickets) * 100}       color="blue" />
                <ProgressBar label="Waiting Customer" value={stats?.total_waiting_customer || 0}  percent={((stats?.total_waiting_customer || 0) / totalTickets) * 100}  color="orange" />
                <ProgressBar label="Resolved"         value={stats?.total_resolved || 0}          percent={((stats?.total_resolved || 0) / totalTickets) * 100}          color="emerald" />
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200/60 grid grid-cols-2 md:grid-cols-4 gap-6">
                <SummaryItem label="Total Tickets" value={totalTickets}              color="slate" />
                <SummaryItem label="Active"        value={stats?.total_in_progress || 0} color="blue" />
                <SummaryItem label="Resolved"      value={stats?.total_resolved || 0}    color="emerald" />
                <SummaryItem label="Pending"       value={stats?.total_pending || 0}     color="amber" />
              </div>
            </div>

            {/* Agent Performance Table */}
            <div className={`transition-all duration-700 delay-600 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <AgentPerformanceTable
                agents={agents}
                tickets={tickets}
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgent}
              />
            </div>

            {/* Ticket List */}
            <div className={`transition-all duration-700 delay-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <TicketListTable
                tickets={filteredTickets}
                title={selectedAgent ? `Tickets for ${agents.find((a) => a.id === selectedAgent)?.name}` : "All Tickets"}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-10 w-24 mb-2" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}
