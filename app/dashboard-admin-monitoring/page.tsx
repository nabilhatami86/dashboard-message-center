"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import SimpleSidebar from "@/components/ui/app-sidebar";
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
} from "lucide-react";

export default function AdminMonitoringPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const initialize = useAuthStore((state) => state.initialize);
  const logout = useAuthStore((state) => state.logout);

  const [agents, setAgents] = useState<AgentUser[]>([]);
  const [stats, setStats] = useState<TicketStatsResponse | null>(null);
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);

  // Initialize auth from localStorage on mount
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
      if (!token) {
        return;
      }

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

        // If 401 Unauthorized, token is invalid/expired - logout and redirect
        if (
          err.message?.includes("Failed to fetch") ||
          err.message?.includes("ticket")
        ) {
          // Clear auth state
          logout();

          // Show alert and redirect
          alert(
            "⚠️ Your session has expired.\n\nPlease login again to continue."
          );
          router.push("/login");
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s

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

  // Calculate percentages for progress visualization
  const totalTickets = tickets.length || 1;
  const pendingPercent = ((stats?.total_pending || 0) / totalTickets) * 100;
  const inProgressPercent = ((stats?.total_in_progress || 0) / totalTickets) * 100;
  const resolvedPercent = ((stats?.total_resolved_today || 0) / totalTickets) * 100;
  const waitingPercent = ((stats?.total_waiting_customer || 0) / totalTickets) * 100;

  if (loading) {
    return (
      <div className="flex h-screen w-full">
        <SimpleSidebar />
        <div className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <SimpleSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow flex-shrink-0">
          <div className="px-6 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Agent Monitoring Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Real-time agent performance and ticket overview
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="Total Agents"
            value={agents.length}
            color="blue"
          />
          <StatCard
            icon={<Activity className="w-6 h-6" />}
            title="Pending in Queue"
            value={stats?.total_pending || 0}
            color="yellow"
          />
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            title="In Progress"
            value={stats?.total_in_progress || 0}
            color="orange"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            title="Resolved Today"
            value={stats?.total_resolved_today || 0}
            color="green"
          />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Average Response Time
            </h2>
            <div className="text-3xl font-bold text-blue-600">
              {formatTime(stats?.avg_wait_time_seconds)}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Time from ticket creation to assignment
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Average Resolution Time
            </h2>
            <div className="text-3xl font-bold text-green-600">
              {formatTime(stats?.avg_resolution_time_seconds)}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Time from creation to resolution
            </p>
          </div>
        </div>

        {/* Ticket Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-6">Ticket Status Distribution</h2>
          <div className="space-y-4">
            {/* Pending */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Pending</span>
                <span className="text-sm text-gray-600">
                  {stats?.total_pending || 0} ({Math.round(pendingPercent)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${pendingPercent}%` }}
                ></div>
              </div>
            </div>

            {/* In Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">In Progress</span>
                <span className="text-sm text-gray-600">
                  {stats?.total_in_progress || 0} ({Math.round(inProgressPercent)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${inProgressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Waiting Customer */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Waiting Customer</span>
                <span className="text-sm text-gray-600">
                  {stats?.total_waiting_customer || 0} ({Math.round(waitingPercent)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${waitingPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Resolved Today */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Resolved Today</span>
                <span className="text-sm text-gray-600">
                  {stats?.total_resolved_today || 0} ({Math.round(resolvedPercent)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${resolvedPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{totalTickets}</div>
                <div className="text-xs text-gray-500">Total Tickets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.total_in_progress || 0}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.total_resolved_today || 0}</div>
                <div className="text-xs text-gray-500">Resolved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats?.total_pending || 0}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent List with Metrics */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Agent Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Active Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    In Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Resolved Today
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent) => {
                  const activeCount =
                    getAgentTicketCount(agent.id, "assigned") +
                    getAgentTicketCount(agent.id, "in_progress");
                  const inProgress = getAgentTicketCount(
                    agent.id,
                    "in_progress"
                  );
                  const resolved = getAgentTicketCount(agent.id, "resolved");

                  return (
                    <tr
                      key={agent.id}
                      className={selectedAgent === agent.id ? "bg-blue-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {agent.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {agent.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            agent.online
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {agent.online ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activeCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inProgress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {resolved}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() =>
                            setSelectedAgent(
                              selectedAgent === agent.id ? null : agent.id
                            )
                          }
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {selectedAgent === agent.id
                            ? "Show All"
                            : "View Tickets"}
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
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">
              {selectedAgent
                ? `Tickets for ${
                    agents.find((a) => a.id === selectedAgent)?.name
                  }`
                : "All Tickets"}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.slice(0, 20).map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{ticket.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ticket.customer_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ticket.customer_phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.agent_name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ticket.created_at).toLocaleString()}
                    </td>
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
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    orange: "bg-orange-100 text-orange-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
          colorClasses[color as keyof typeof colorClasses]
        }`}
      >
        {icon}
      </div>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    assigned: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    waiting_customer: "bg-orange-100 text-orange-800",
    resolved: "bg-green-100 text-green-800",
    escalated: "bg-red-100 text-red-800",
    closed: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${
        colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${
        colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800"
      }`}
    >
      {priority}
    </span>
  );
}
