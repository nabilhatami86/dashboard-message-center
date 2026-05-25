import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  submessage?: string;
}

export function LoadingState({ message = "Memuat...", submessage }: LoadingStateProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 text-neutral-400 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-semibold text-neutral-700">{message}</p>
          {submessage && <p className="text-xs text-neutral-400 mt-0.5">{submessage}</p>}
        </div>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
        <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <p className="text-base font-semibold text-neutral-900">Gagal memuat data</p>
          <p className="text-sm text-neutral-500 mt-1">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 active:scale-95 transition-all"
          >
            Coba lagi
          </button>
        )}
      </div>
    </div>
  );
}
