/**
 * EmptyState Component
 * Reusable component for displaying empty states across the application
 */

import { ReactNode } from "react";
import { MessageCircle, Inbox, UserX, AlertCircle } from "lucide-react";

interface EmptyStateProps {
  icon?: "message" | "inbox" | "user" | "alert";
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const iconMap = {
  message: MessageCircle,
  inbox: Inbox,
  user: UserX,
  alert: AlertCircle,
};

export default function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
