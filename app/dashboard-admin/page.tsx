"use client";

import { useState, useEffect, useRef } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { CustomerChatsView } from "@/components/admin/customer-chats-view";
import { AgentChatsView } from "@/components/admin/agent-chats-view";
import { LoadingState, ErrorState } from "@/components/ui/page-state";
import { Chat, AdminChat, ChatMode } from "@/app/types/types";
import { useMobileSidebar } from "@/store/mobileSidebarStore";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  getChats, sendMessage, deleteChat, getAgentList, AgentUser,
  getAdminChat, sendAdminMessage, updateChatMode,
} from "@/lib/api";
import { transformChatResponse, transformAdminChatResponse } from "@/lib/transform";
import { useSmartRefresh } from "@/hooks/useSmartRefresh";

function DashboardContent() {
  const router = useRouter();

  const [chats, setChats]               = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [showCustomer, setShowCustomer] = useState(true);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<number>>(new Set());

  const [activeTab, setActiveTab]         = useState<"customer" | "agent">("customer");
  const [agents, setAgents]               = useState<AgentUser[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<number | null>(null);
  const [adminChat, setAdminChat]         = useState<AdminChat>({ id: 0, mode: "bot", messages: [] });

  const user                = useAuthStore((state) => state.user);
  const token               = useAuthStore((state) => state.token);
  const logout              = useAuthStore((state) => state.logout);
  const toggleMobileSidebar = useMobileSidebar((s) => s.toggle);
  const isFirstLoadRef      = useRef(true);

  const loadChats = async () => {
    if (!token) { setError("Please login first"); setLoading(false); return; }
    try {
      if (isFirstLoadRef.current) setLoading(true);
      const transformedChats = (await getChats(token)).map(transformChatResponse);
      setChats(() => {
        if (isFirstLoadRef.current && transformedChats.length > 0) {
          setActiveChatId(transformedChats[0].id);
          isFirstLoadRef.current = false;
        }
        return transformedChats;
      });
      setError(null);
    } catch {
      if (isFirstLoadRef.current) setError("Failed to load chats from backend");
    } finally {
      if (isFirstLoadRef.current) setLoading(false);
    }
  };

  // Smart polling: lebih cepat waktu ada aktivitas, melambat saat idle
  const { markActivity: markChatActivity } = useSmartRefresh({
    onRefresh: loadChats,
    minInterval: 15000,
    maxInterval: 60000,
    enabled: !!token && activeTab === "customer",
  });

  useEffect(() => {
    if (!token) return;
    getAgentList(token).then(setAgents).catch(console.error);
  }, [token]);

  const loadAdminChat = async () => {
    if (!activeAgentId || activeTab !== "agent") return;
    try {
      setAdminChat(transformAdminChatResponse(await getAdminChat(activeAgentId)));
    } catch { /* silent */ }
  };

  const { markActivity: markAdminChatActivity } = useSmartRefresh({
    onRefresh: loadAdminChat,
    minInterval: 10000,
    maxInterval: 45000,
    enabled: !!activeAgentId && activeTab === "agent",
  });

  const handleCustomerMessage = async (chatId: number, text: string) => {
    if (!token || !user) return;
    // Optimistic update — tampilkan pesan langsung sebelum konfirmasi dari server
    const optimistic = { id: Date.now(), text, sender: "customer" as const, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), status: "read" as const };
    setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, messages: [...c.messages, optimistic] } : c));
    try {
      await sendMessage({ chat_id: chatId, text, sender: "customer" }, token);
    } catch {
      setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, messages: c.messages.filter((m) => m.id !== optimistic.id) } : c));
    }
  };

  const assignToAgent = async () => {
    if (!activeChat || !token || !activeChatId) return;
    setChats((prev) => prev.map((c) => c.id === activeChatId ? { ...c, mode: "agent" as const } : c));
    try { await updateChatMode(activeChatId, "agent", token, user?.id); } catch { /* silent */ }
  };

  const handlePauseChat = async (nextMode: ChatMode) => {
    if (!activeChat || !token || !activeChatId) return;
    if (nextMode === "closed") {
      setChats((prev) => prev.filter((c) => c.id !== activeChatId));
      setActiveChatId(null);
    } else {
      setChats((prev) => prev.map((c) => c.id === activeChatId ? { ...c, mode: nextMode } : c));
    }
    try {
      await updateChatMode(activeChatId, nextMode, token);
      if (nextMode !== "closed") await loadChats();
    } catch {
      if (nextMode !== "closed") {
        setChats((prev) => prev.map((c) => c.id === activeChatId ? { ...c, mode: activeChat.mode } : c));
        alert("Failed to update chat status. Please try again.");
      }
    }
  };

  const handleSendMessage = async (text: string, media?: { media_url: string; media_type: string; media_filename: string }) => {
    if (!activeChat || activeChat.mode !== "agent" || !token || !user || !activeChatId) return;
    const optimistic = { id: Date.now(), text, sender: "agent" as const, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), status: "sent" as const, media_url: media?.media_url || null, media_type: media?.media_type || null, media_filename: media?.media_filename || null };
    setChats((prev) => prev.map((c) => c.id === activeChatId ? { ...c, messages: [...c.messages, optimistic] } : c));
    try {
      await sendMessage({ chat_id: activeChatId, text, sender: "agent", agent_id: user.id, media_url: media?.media_url || null, media_type: media?.media_type || null, media_filename: media?.media_filename || null }, token);
      markChatActivity();
    } catch {
      setChats((prev) => prev.map((c) => c.id === activeChatId ? { ...c, messages: c.messages.filter((m) => m.id !== optimistic.id) } : c));
      alert("Failed to send message. Please try again.");
    }
  };

  const handleDeleteChat = async (chatId: number) => {
    if (!token) return;
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      const remaining = chats.filter((c) => c.id !== chatId);
      setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
    }
    try { await deleteChat(chatId, token); }
    catch { alert("Failed to delete chat. Please try again."); window.location.reload(); }
  };

  const handleToggleSelectMode    = () => { setIsSelectMode(!isSelectMode); setSelectedChats(new Set()); };
  const handleToggleChatSelection = (chatId: number) => setSelectedChats((prev) => { const s = new Set(prev); s.has(chatId) ? s.delete(chatId) : s.add(chatId); return s; });
  const handleSelectAll           = () => setSelectedChats(selectedChats.size === chats.length ? new Set() : new Set(chats.map((c) => c.id)));

  const handleBulkDelete = async () => {
    if (selectedChats.size === 0 || !token) return;
    if (!window.confirm(`Hapus ${selectedChats.size} chat yang dipilih?`)) return;
    const ids = Array.from(selectedChats);
    setChats((prev) => prev.filter((c) => !selectedChats.has(c.id)));
    if (activeChatId && selectedChats.has(activeChatId)) {
      const remaining = chats.filter((c) => !selectedChats.has(c.id));
      setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
    }
    setSelectedChats(new Set());
    setIsSelectMode(false);
    try { await Promise.all(ids.map((id) => deleteChat(id, token))); }
    catch { alert("Gagal menghapus beberapa chat. Halaman akan di-reload."); window.location.reload(); }
  };

  const handleModeChange       = async (mode: "bot" | "manual") => setAdminChat((prev) => ({ ...prev, mode }));
  const handleSendAdminMessage = async (text: string) => {
    if (!user || !activeAgentId) return;
    try {
      const msg = await sendAdminMessage(activeAgentId, text, user.name, "admin", adminChat.mode);
      setAdminChat((prev) => ({ ...prev, messages: [...prev.messages, { id: msg.id, text: msg.text, sender: msg.sender, time: msg.time, status: msg.status }] }));
      markAdminChatActivity();
    } catch { alert("Failed to send message to agent"); }
  };

  const activeChat  = chats.find((c) => c.id === activeChatId);
  const activeAgent = agents.find((a) => a.id === activeAgentId);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50">
      <AdminDashboardHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onMenuClick={toggleMobileSidebar}
        onMonitoring={() => router.push("/dashboard-admin-monitoring")}
        onLogout={() => { logout(); router.replace("/login"); }}
      />

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <LoadingState message="Memuat chat..." submessage="Mohon tunggu sebentar" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : activeTab === "customer" ? (
          <CustomerChatsView
            chats={chats}
            activeChatId={activeChatId}
            activeChat={activeChat}
            showCustomer={showCustomer}
            isSelectMode={isSelectMode}
            selectedChats={selectedChats}
            onSelectChat={(chat) => { setActiveChatId(chat.id); setShowCustomer(true); }}
            onDeleteChat={handleDeleteChat}
            onToggleSelectMode={handleToggleSelectMode}
            onToggleChatSelection={handleToggleChatSelection}
            onBulkDelete={handleBulkDelete}
            onSelectAll={handleSelectAll}
            onSendMessage={handleSendMessage}
            onAssignAgent={assignToAgent}
            onPauseChat={handlePauseChat}
            onCustomerMessage={(text) => handleCustomerMessage(activeChatId!, text)}
            onLoadChats={loadChats}
            onToggleCustomer={() => setShowCustomer((v) => !v)}
            onCloseCustomer={() => setShowCustomer(false)}
            onBack={() => setActiveChatId(null)}
          />
        ) : (
          <AgentChatsView
            agents={agents}
            activeAgentId={activeAgentId}
            activeAgent={activeAgent}
            adminChat={adminChat}
            onSelectAgent={(agent) => setActiveAgentId(agent.id)}
            onSendMessage={handleSendAdminMessage}
            onModeChange={handleModeChange}
          />
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardContent />
    </ProtectedRoute>
  );
}
