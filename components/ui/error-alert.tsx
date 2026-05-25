import { AlertCircle, X } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({ message, onDismiss, className = "" }: ErrorAlertProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 ${className}`}>
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-800">Error</p>
        <p className="text-sm text-red-700">{message}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-600 hover:text-red-800 shrink-0">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
