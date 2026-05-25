"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SimpleSidebar from "@/components/ui/app-sidebar";
import { ToastNotification } from "@/components/ui/toast-notification";
import { AgentModal, type AgentFormData } from "@/components/agents/agent-modal";
import { DeleteConfirm } from "@/components/agents/delete-confirm";
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";
import { getAgentList, createAgent, updateAgentFull, deleteAgentById, AgentUser } from "@/lib/api";
import { Plus, Pencil, Trash2, UserCircle, Loader2, Menu } from "lucide-react";

function AgentsPage() {
  const token = useAuthStore((s) => s.token) ?? "";

  const [agents, setAgents]           = useState<AgentUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget]   = useState<AgentUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentUser | null>(null);
  const [toast, setToast]             = useState("");
  const [mobileOpen, setMobileOpen]   = useState(false);

  const fetchAgents = useCallback(async () => {
    try {
      setAgents(await getAgentList(token));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleCreate = async (data: AgentFormData) => {
    await createAgent(token, data);
    await fetchAgents();
    showToast("Agent berhasil dibuat");
  };

  const handleEdit = async (data: AgentFormData) => {
    if (!editTarget) return;
    await updateAgentFull(token, editTarget.id, data);
    await fetchAgents();
    showToast("Agent berhasil diperbarui");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteAgentById(token, deleteTarget.id);
    setDeleteTarget(null);
    await fetchAgents();
    showToast("Agent berhasil dihapus");
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Menu className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Manajemen Agent</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{agents.length} agent terdaftar</p>
          </div>
          <button
            onClick={() => setModal("create")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Tambah Agent</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-neutral-400 gap-2">
              <UserCircle className="h-10 w-10" />
              <p className="text-sm">Belum ada agent</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">Nama</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Username</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Email</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Tag</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                              {agent.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">{agent.name}</p>
                            <p className="text-xs text-neutral-400 md:hidden">@{agent.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 hidden md:table-cell">@{agent.username}</td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 hidden lg:table-cell">{agent.email}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-neutral-500 dark:text-neutral-400">~ {agent.display_name ?? agent.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <AgentStatusBadge status={agent.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditTarget(agent); setModal("edit"); }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(agent)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal === "create" && (
        <AgentModal mode="create" onClose={() => setModal(null)} onSave={handleCreate} />
      )}
      {modal === "edit" && editTarget && (
        <AgentModal
          mode="edit"
          initial={editTarget}
          onClose={() => { setModal(null); setEditTarget(null); }}
          onSave={handleEdit}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm agent={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}

      <ToastNotification message={toast} />
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute requiredRole={["admin"]}>
      <AgentsPage />
    </ProtectedRoute>
  );
}
