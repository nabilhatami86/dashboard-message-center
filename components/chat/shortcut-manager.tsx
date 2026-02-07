"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Zap,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Search,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import {
  getShortcuts,
  createShortcut,
  updateShortcut,
  deleteShortcut,
  ShortcutMessageResponse,
} from "@/lib/api";

export default function ShortcutManager() {
  const [shortcuts, setShortcuts] = useState<ShortcutMessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formKey, setFormKey] = useState("");
  const [formValues, setFormValues] = useState("");
  const [formError, setFormError] = useState("");

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const loadShortcuts = async () => {
    if (!token) return;
    try {
      const data = await getShortcuts(token);
      setShortcuts(data);
    } catch (err) {
      console.error("Failed to load shortcuts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShortcuts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormKey("");
    setFormValues("");
    setFormError("");
  };

  const handleCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (sc: ShortcutMessageResponse) => {
    setEditingId(sc.id);
    setFormKey(sc.key);
    setFormValues(sc.values);
    setFormError("");
    setShowForm(true);
  };

  const handleDelete = async (sc: ShortcutMessageResponse) => {
    if (!token) return;
    if (!window.confirm(`Hapus shortcut "${sc.key}"?`)) return;

    try {
      await deleteShortcut(sc.id, token);
      setShortcuts((prev) => prev.filter((s) => s.id !== sc.id));
    } catch (err) {
      console.error("Failed to delete shortcut:", err);
      alert("Gagal menghapus shortcut");
    }
  };

  const handleSave = async () => {
    if (!token) return;

    if (!formKey.trim() || !formValues.trim()) {
      setFormError("Key dan Values wajib diisi");
      return;
    }

    // Ensure key starts with /
    const key = formKey.startsWith("/") ? formKey.trim() : `/${formKey.trim()}`;

    try {
      if (editingId) {
        const updated = await updateShortcut(editingId, { key, values: formValues.trim() }, token);
        setShortcuts((prev) =>
          prev.map((s) => (s.id === editingId ? updated : s))
        );
      } else {
        const created = await createShortcut({ key, values: formValues.trim() }, token);
        setShortcuts((prev) => [...prev, created]);
      }
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan shortcut";
      setFormError(message);
    }
  };

  // Filter shortcuts by search
  const filtered = shortcuts.filter(
    (sc) =>
      sc.key.toLowerCase().includes(search.toLowerCase()) ||
      sc.values.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-slate-500">Loading shortcuts...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Shortcut Messages</h2>
          <span className="text-sm text-slate-400">({shortcuts.length})</span>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Buat Baru
        </Button>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari shortcut..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="px-6 py-4 border-b bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              {editingId ? "Edit Shortcut" : "Buat Shortcut Baru"}
            </h3>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Key (contoh: /sukses)
              </label>
              <input
                type="text"
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                placeholder="/namaShortcut"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Isi Pesan
              </label>
              <textarea
                value={formValues}
                onChange={(e) => setFormValues(e.target.value)}
                placeholder="Tulis template pesan di sini..."
                rows={3}
                className="w-full px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {formError && (
              <p className="text-xs text-red-500">{formError}</p>
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                {editingId ? "Update" : "Simpan"}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm}>
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Shortcut List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="divide-y">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              {search
                ? "Tidak ada shortcut yang cocok"
                : "Belum ada shortcut. Klik \"Buat Baru\" untuk mulai."}
            </div>
          ) : (
            filtered.map((sc) => (
              <div
                key={sc.id}
                className="px-6 py-3 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-semibold text-blue-600 text-sm">
                        {sc.key}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {sc.values}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Dibuat oleh:{" "}
                      <span className="font-medium text-slate-500">
                        {sc.creator_name || `User #${sc.created_by}`}
                      </span>
                      {sc.created_by === user?.id && (
                        <span className="ml-1 text-blue-500">(Kamu)</span>
                      )}
                    </p>
                  </div>

                  {/* Actions - only show for own shortcuts */}
                  {sc.created_by === user?.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-blue-100 hover:text-blue-600"
                        onClick={() => handleEdit(sc)}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-red-100 hover:text-red-600"
                        onClick={() => handleDelete(sc)}
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Hint */}
      <div className="border-t px-6 py-3 bg-slate-50">
        <p className="text-xs text-slate-400 text-center">
          Ketik <span className="font-mono font-semibold text-blue-500">/</span> di chat untuk menggunakan shortcut
        </p>
      </div>
    </div>
  );
}
