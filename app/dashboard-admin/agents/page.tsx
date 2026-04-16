"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SimpleSidebar from "@/components/ui/app-sidebar";
import {
  getAgentList,
  createAgent,
  updateAgentFull,
  deleteAgentById,
  AgentUser,
} from "@/lib/api";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  UserCircle,
  Loader2,
  CheckCircle,
  Menu,
} from "lucide-react";

// ─── Modal Form ────────────────────────────────────────────────────────────────
interface FormData {
  name: string;
  email: string;
  username: string;
  password: string;
  phone: string;
  display_name: string;
}

const emptyForm: FormData = {
  name: "",
  email: "",
  username: "",
  password: "",
  phone: "",
  display_name: "",
};

interface AgentModalProps {
  mode: "create" | "edit";
  initial?: AgentUser;
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
}

function AgentModal({ mode, initial, onClose, onSave }: AgentModalProps) {
  const [form, setForm] = useState<FormData>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    username: initial?.username ?? "",
    password: "",
    phone: initial?.phone ?? "",
    display_name: initial?.display_name ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="font-semibold text-neutral-900 dark:text-white text-lg">
            {mode === "create" ? "Tambah Agent" : "Edit Agent"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {[
            { label: "Nama Lengkap", key: "name" as const, required: true },
            { label: "Email", key: "email" as const, required: true, type: "email" },
            { label: "Username", key: "username" as const, required: true },
            {
              label: mode === "create" ? "Password" : "Password Baru (kosongkan jika tidak diubah)",
              key: "password" as const,
              required: mode === "create",
              type: "password",
            },
            { label: "No. Telepon", key: "phone" as const },
            { label: "Tag (~ Nama di pesan)", key: "display_name" as const },
          ].map(({ label, key, required, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={type ?? "text"}
                value={form[key]}
                onChange={set(key)}
                required={required}
                placeholder={key === "display_name" ? "contoh: Agent John" : ""}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Buat Agent" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ agent, onClose, onConfirm }: { agent: AgentUser; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6">
        <h2 className="font-semibold text-neutral-900 dark:text-white text-lg mb-2">Hapus Agent</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Yakin ingin menghapus agent <span className="font-semibold text-neutral-800 dark:text-white">{agent.name}</span>? Tindakan ini tidak bisa dibatalkan.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">
            Batal
          </button>
          <button
            onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }}
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

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    online: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    offline: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
    busy: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    break: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };
  const s = status ?? "offline";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${map[s] ?? map.offline}`}>
      {s}
    </span>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function AgentsPage() {
  const token = useAuthStore((s) => s.token) ?? "";
  const [agents, setAgents] = useState<AgentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<AgentUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentUser | null>(null);
  const [toast, setToast] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchAgents = async () => {
    try {
      const list = await getAgentList(token);
      setAgents(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleCreate = async (data: FormData) => {
    await createAgent(token, data);
    await fetchAgents();
    showToast("Agent berhasil dibuat");
  };

  const handleEdit = async (data: FormData) => {
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
      <SimpleSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

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
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 hidden md:table-cell">
                        @{agent.username}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 hidden lg:table-cell">
                        {agent.email}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-neutral-500 dark:text-neutral-400">
                          ~ {agent.display_name ?? agent.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={agent.status} />
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
        <AgentModal mode="edit" initial={editTarget} onClose={() => { setModal(null); setEditTarget(null); }} onSave={handleEdit} />
      )}
      {deleteTarget && (
        <DeleteConfirm agent={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-3 rounded-xl shadow-xl text-sm font-medium">
          <CheckCircle className="h-4 w-4 text-green-400 dark:text-green-600" />
          {toast}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AgentsPage />
    </ProtectedRoute>
  );
}
