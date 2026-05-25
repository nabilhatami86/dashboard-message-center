import { CheckCircle } from "lucide-react";

interface ToastNotificationProps {
  message: string;
}

export function ToastNotification({ message }: ToastNotificationProps) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-3 rounded-xl shadow-xl text-sm font-medium">
      <CheckCircle className="h-4 w-4 text-green-400 dark:text-green-600" />
      {message}
    </div>
  );
}
