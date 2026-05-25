import { useState } from "react";
import { Loader2, X } from "lucide-react";
import type { AgentUser } from "@/lib/api";

export interface AgentFormData {
  name: string;
  email: string;
  username: string;
  password: string;
  phone: string;
  display_name: string;
}

export const emptyAgentForm: AgentFormData = {
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
  onSave: (data: AgentFormData) => Promise<void>;
}

const fields: {
  label: string;
  key: keyof AgentFormData;
  type?: string;
  required?: boolean | "create";
  placeholder?: string;
}[] = [
  { label: "Nama Lengkap",               key: "name",         required: true },
  { label: "Email",                       key: "email",        required: true, type: "email" },
  { label: "Username",                    key: "username",     required: true },
  { label: "Password",                    key: "password",     required: "create", type: "password" },
  { label: "No. Telepon",                 key: "phone" },
  { label: "Tag (~ Nama di pesan)",       key: "display_name", placeholder: "contoh: Agent John" },
];

export function AgentModal({ mode, initial, onClose, onSave }: AgentModalProps) {
  const [form, setForm] = useState<AgentFormData>({
    name:         initial?.name         ?? "",
    email:        initial?.email        ?? "",
    username:     initial?.username     ?? "",
    password:     "",
    phone:        initial?.phone        ?? "",
    display_name: initial?.display_name ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k: keyof AgentFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
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

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {fields.map(({ label, key, required, type, placeholder }) => {
            const isRequired = required === true || (required === "create" && mode === "create");
            const fieldLabel = key === "password" && mode === "edit"
              ? "Password Baru (kosongkan jika tidak diubah)"
              : label;
            return (
              <div key={key}>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  {fieldLabel} {isRequired && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={type ?? "text"}
                  value={form[key]}
                  onChange={set(key)}
                  required={isRequired}
                  placeholder={placeholder ?? ""}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            );
          })}

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
