const statusStyles: Record<string, string> = {
  online:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  offline: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  busy:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  break:   "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export function AgentStatusBadge({ status }: { status?: string }) {
  const s = status ?? "offline";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusStyles[s] ?? statusStyles.offline}`}>
      {s}
    </span>
  );
}
