import EmptyState from "@/components/ui/empty-state";
import type { AgentUser, TicketResponse } from "@/lib/api";

interface AgentPerformanceTableProps {
  agents: AgentUser[];
  tickets: TicketResponse[];
  selectedAgent: number | null;
  onSelectAgent: (agentId: number | null) => void;
}

function getCount(tickets: TicketResponse[], agentId: number, status?: string) {
  return tickets.filter((t) => t.assigned_agent_id === agentId && (!status || t.status === status)).length;
}

export function AgentPerformanceTable({ agents, tickets, selectedAgent, onSelectAgent }: AgentPerformanceTableProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200/60">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800">Agent Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              {["Agent", "Status", "Active", "In Progress", "Resolved", "Actions"].map((h) => (
                <th key={h} className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider first:sm:px-8">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {agents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-12">
                  <EmptyState icon="user" title="No Agents Found" description="There are no agents registered in the system yet." />
                </td>
              </tr>
            ) : agents.map((agent) => {
              const active  = getCount(tickets, agent.id, "assigned") + getCount(tickets, agent.id, "in_progress");
              return (
                <tr key={agent.id} className={`transition-all duration-200 hover:bg-slate-50/50 ${selectedAgent === agent.id ? "bg-blue-50/50" : ""}`}>
                  <td className="px-4 sm:px-8 py-3 sm:py-5">
                    <div className="text-sm font-semibold text-slate-800">{agent.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{agent.email}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${agent.online ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${agent.online ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {agent.online ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-5 text-sm font-semibold text-slate-700">{active}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-5 text-sm font-semibold text-slate-700">{getCount(tickets, agent.id, "in_progress")}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-5 text-sm font-semibold text-slate-700">{getCount(tickets, agent.id, "resolved")}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-5">
                    <button
                      onClick={() => onSelectAgent(selectedAgent === agent.id ? null : agent.id)}
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
  );
}
