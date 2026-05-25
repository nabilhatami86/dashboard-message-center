import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { AgentUser } from "@/lib/api";

interface DeleteConfirmProps {
  agent: AgentUser;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirm({ agent, onClose, onConfirm }: DeleteConfirmProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6">
        <h2 className="font-semibold text-neutral-900 dark:text-white text-lg mb-2">Hapus Agent</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Yakin ingin menghapus agent{" "}
          <span className="font-semibold text-neutral-800 dark:text-white">{agent.name}</span>?
          Tindakan ini tidak bisa dibatalkan.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
