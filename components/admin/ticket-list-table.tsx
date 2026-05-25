import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import type { TicketResponse } from "@/lib/api";

interface TicketListTableProps {
  tickets: TicketResponse[];
  title: string;
}

export function TicketListTable({ tickets, title }: TicketListTableProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200/60">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800 truncate">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              {["ID", "Customer", "Status", "Priority", "Agent", "Created"].map((h) => (
                <th key={h} className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider first:sm:px-8">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {tickets.slice(0, 20).map((ticket) => (
              <tr key={ticket.id} className="transition-all duration-200 hover:bg-slate-50/50">
                <td className="px-4 sm:px-8 py-3 sm:py-5 text-sm font-semibold text-slate-700">#{ticket.id}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-5">
                  <div className="text-sm font-medium text-slate-800">{ticket.customer_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{ticket.customer_phone}</div>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-5"><StatusBadge status={ticket.status} /></td>
                <td className="px-4 sm:px-6 py-3 sm:py-5"><PriorityBadge priority={ticket.priority} /></td>
                <td className="px-4 sm:px-6 py-3 sm:py-5 text-sm text-slate-700 whitespace-nowrap">{ticket.agent_name || "-"}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-5 text-xs text-slate-500 whitespace-nowrap">
                  {new Date(ticket.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
