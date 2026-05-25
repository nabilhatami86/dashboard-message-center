const statusMap: Record<string, { bg: string; text: string; label: string }> = {
  pending:          { bg: "bg-amber-100",   text: "text-amber-700",   label: "Pending" },
  assigned:         { bg: "bg-blue-100",    text: "text-blue-700",    label: "Assigned" },
  in_progress:      { bg: "bg-purple-100",  text: "text-purple-700",  label: "In Progress" },
  waiting_customer: { bg: "bg-orange-100",  text: "text-orange-700",  label: "Waiting" },
  resolved:         { bg: "bg-emerald-100", text: "text-emerald-700", label: "Resolved" },
  escalated:        { bg: "bg-red-100",     text: "text-red-700",     label: "Escalated" },
  closed:           { bg: "bg-slate-100",   text: "text-slate-600",   label: "Closed" },
};

const priorityMap: Record<string, { bg: string; text: string; label: string }> = {
  low:    { bg: "bg-slate-100",   text: "text-slate-600",   label: "Low" },
  medium: { bg: "bg-blue-100",    text: "text-blue-700",    label: "Medium" },
  high:   { bg: "bg-orange-100",  text: "text-orange-700",  label: "High" },
  urgent: { bg: "bg-red-100",     text: "text-red-700",     label: "Urgent" },
};

export function StatusBadge({ status }: { status: string }) {
  const theme = statusMap[status] ?? { bg: "bg-slate-100", text: "text-slate-600", label: status };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${theme.bg} ${theme.text}`}>
      {theme.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const theme = priorityMap[priority] ?? { bg: "bg-slate-100", text: "text-slate-600", label: priority };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${theme.bg} ${theme.text}`}>
      {theme.label}
    </span>
  );
}
