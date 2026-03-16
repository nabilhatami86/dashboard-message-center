"use client";

import { useState, useEffect, useRef } from "react";
import ChatList from "@/components/chat/chat-list";
import ChatWindow from "@/components/chat/chat-window";
import CustomerDetail from "@/components/customer/customer-detail";
import AgentList from "@/components/chat/agent-list";
import AdminAgentChatWindow from "@/components/chat/admin-agent-chat-window";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Chat, AdminChat } from "@/app/types/types";
import { LogOut, MessageSquare, Users, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  getChats,
  sendMessage,
  deleteChat,
  getAgentList,
  AgentUser,
  getAdminChat,
  sendAdminMessage,
  updateChatMode,
} from "@/lib/api";
import {
  transformChatResponse,
  transformAdminChatResponse,
} from "@/lib/transform";
import { useSmartRefresh } from "@/hooks/useSmartRefresh";

function DashboardContent() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [showCustomer, setShowCustomer] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Select mode state - pindah ke parent agar tidak reset saat refresh
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<number>>(new Set());

  // Tab state
  const [activeTab, setActiveTab] = useState<"customer" | "agent">("customer");

  // Agent chat state
  const [agents, setAgents] = useState<AgentUser[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<number | null>(null);
  const [adminChat, setAdminChat] = useState<AdminChat>({
    id: 0,
    mode: "bot",
    messages: [],
  });

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  // Use ref to track first load - tidak trigger re-render
  const isFirstLoadRef = useRef(true);

  // Load all chats from backend (Admin sees all chats)
  const loadChats = async () => {
    if (!token) {
      setError("Please login first");
      setLoading(false);
      return;
    }

    try {
      // Only show loading on first load
      if (isFirstLoadRef.current) {
        setLoading(true);
      }

      const chatData = await getChats(token);
      const transformedChats = chatData.map(transformChatResponse);

      setChats(() => {
        // PERBAIKAN: HANYA auto-select chat pertama pada first load
        // Dan JANGAN ubah activeChatId saat refresh berikutnya
        if (isFirstLoadRef.current && transformedChats.length > 0) {
          setActiveChatId(transformedChats[0].id);
          isFirstLoadRef.current = false;
        }

        return transformedChats;
      });

      setError(null);
    } catch (err) {
      console.error("Failed to load chats:", err);
      if (isFirstLoadRef.current) {
        setError("Failed to load chats from backend");
      }
    } finally {
      if (isFirstLoadRef.current) {
        setLoading(false);
      }
    }
  };

  // Smart refresh - mirip WhatsApp (adaptive polling)
  const { markActivity: markChatActivity } = useSmartRefresh({
    onRefresh: loadChats,
    minInterval: 15000, // 15s saat aktif
    maxInterval: 60000, // 60s saat idle
    enabled: !!token && activeTab === "customer",
  });

  const activeChat = chats.find((c) => c.id === activeChatId);

  // ================= CUSTOMER MESSAGE (Simulate) =================
  const handleCustomerMessage = async (chatId: number, text: string) => {
    if (!token || !user) return;

    // Optimistic update
    const optimisticMessage = {
      id: Date.now(),
      text,
      sender: "customer" as const,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "read" as const,
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, optimisticMessage],
            }
          : chat
      )
    );

    // Send to backend
    try {
      await sendMessage(
        {
          chat_id: chatId,
          text,
          sender: "customer",
        },
        token
      );
    } catch (err) {
      console.error("Failed to send customer message:", err);
      // Revert on error
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: chat.messages.filter(
                  (m) => m.id !== optimisticMessage.id
                ),
              }
            : chat
        )
      );
    }
  };

  // ================= ASSIGN AGENT =================
  const assignToAgent = async () => {
    if (!activeChat || !token || !activeChatId) return;

    // Optimistic update
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId ? { ...c, mode: "agent" as const } : c
      )
    );

    try {
      await updateChatMode(activeChatId, "agent", token, user?.id);
    } catch (err) {
      console.error("Failed to assign agent:", err);
    }
  };

  // ================= PAUSE / RESUME =================
  const handlePauseChat = async (nextMode: Chat["mode"]) => {
    if (!activeChat || !token || !activeChatId) return;

    // SPECIAL: When closing chat, remove it from list immediately
    if (nextMode === "closed") {
      // Optimistic: remove chat from list
      setChats((prev) => prev.filter((c) => c.id !== activeChatId));
      // Deselect active chat
      setActiveChatId(null);
    } else {
      // Optimistic update
      setChats((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, mode: nextMode } : c))
      );
    }

    try {
      // Call backend API to update chat mode
      await updateChatMode(activeChatId, nextMode, token);

      // Only refresh chats if NOT closing (closed chat is already removed from list)
      if (nextMode !== "closed") {
        await loadChats();
      }
    } catch (err) {
      console.error("Failed to update chat mode:", err);

      // Revert optimistic update if failed (only for non-closed modes)
      if (nextMode !== "closed") {
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId ? { ...c, mode: activeChat.mode } : c
          )
        );
        alert("Failed to update chat status. Please try again.");
      }
    }
  };

  // ================= AGENT/ADMIN SEND MESSAGE =================
  const handleSendMessage = async (text: string, media?: { media_url: string; media_type: string; media_filename: string }) => {
    if (
      !activeChat ||
      activeChat.mode !== "agent" ||
      !token ||
      !user ||
      !activeChatId
    )
      return;

    // Optimistic update
    const optimisticMessage = {
      id: Date.now(),
      text,
      sender: "agent" as const,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sent" as const,
      media_url: media?.media_url || null,
      media_type: media?.media_type || null,
      media_filename: media?.media_filename || null,
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [...chat.messages, optimisticMessage],
            }
          : chat
      )
    );

    // Send to backend
    try {
      await sendMessage(
        {
          chat_id: activeChatId,
          text,
          sender: "agent",
          agent_id: user.id,
          media_url: media?.media_url || null,
          media_type: media?.media_type || null,
          media_filename: media?.media_filename || null,
        },
        token
      );

      // Mark activity untuk trigger fast refresh
      markChatActivity();
    } catch (err) {
      console.error("Failed to send message:", err);
      // Revert on error
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: chat.messages.filter(
                  (m) => m.id !== optimisticMessage.id
                ),
              }
            : chat
        )
      );
      alert("Failed to send message. Please try again.");
    }
  };

  // ================= DELETE CHAT =================
  const handleDeleteChat = async (chatId: number) => {
    if (!token) return;

    // Optimistic update - hapus dari UI dulu
    setChats((prev) => prev.filter((c) => c.id !== chatId));

    // Jika chat yang di-delete adalah chat aktif, reset ke null atau chat pertama
    if (activeChatId === chatId) {
      const remainingChats = chats.filter((c) => c.id !== chatId);
      if (remainingChats.length > 0) {
        setActiveChatId(remainingChats[0].id);
      } else {
        setActiveChatId(null);
      }
    }

    // Delete dari backend
    try {
      await deleteChat(chatId, token);
    } catch (err) {
      console.error("Failed to delete chat:", err);
      alert("Failed to delete chat. Please try again.");
      // Reload chats untuk restore data jika delete gagal
      window.location.reload();
    }
  };

  // ================= SELECT MODE HANDLERS =================
  const handleToggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedChats(new Set()); // Clear selections when toggling mode
  };

  const handleToggleChatSelection = (chatId: number) => {
    setSelectedChats((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(chatId)) {
        newSelected.delete(chatId);
      } else {
        newSelected.add(chatId);
      }
      return newSelected;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedChats.size === 0 || !token) return;

    const confirmMessage = `Hapus ${selectedChats.size} chat yang dipilih?`;
    if (!window.confirm(confirmMessage)) return;

    // Simpan ID yang akan dihapus
    const chatIdsToDelete = Array.from(selectedChats);

    // Optimistic update - hapus semua sekaligus dari UI
    setChats((prev) => prev.filter((c) => !selectedChats.has(c.id)));

    // Reset active chat jika termasuk yang dihapus
    if (activeChatId && selectedChats.has(activeChatId)) {
      const remainingChats = chats.filter((c) => !selectedChats.has(c.id));
      if (remainingChats.length > 0) {
        setActiveChatId(remainingChats[0].id);
      } else {
        setActiveChatId(null);
      }
    }

    // Clear selection dan exit select mode
    setSelectedChats(new Set());
    setIsSelectMode(false);

    // Delete dari backend - parallel requests
    try {
      await Promise.all(
        chatIdsToDelete.map((chatId) => deleteChat(chatId, token))
      );
    } catch (err) {
      console.error("Failed to delete chats:", err);
      alert("Gagal menghapus beberapa chat. Halaman akan di-reload.");
      // Reload untuk restore data jika ada yang gagal
      window.location.reload();
    }
  };

  const handleSelectAll = () => {
    if (selectedChats.size === chats.length) {
      setSelectedChats(new Set()); // Deselect all
    } else {
      setSelectedChats(new Set(chats.map((chat) => chat.id))); // Select all
    }
  };

  // ================= LOAD AGENTS =================
  useEffect(() => {
    async function loadAgents() {
      if (!token) return;
      try {
        const agentData = await getAgentList(token);
        setAgents(agentData);
      } catch (err) {
        console.error("Failed to load agents:", err);
      }
    }
    loadAgents();
  }, [token]);

  // ================= LOAD ADMIN CHAT =================
  const loadAdminChat = async () => {
    // Skip jika tab tidak aktif atau tidak ada agent yang dipilih
    if (!activeAgentId || activeTab !== "agent") return;

    try {
      const adminChatData = await getAdminChat(activeAgentId);
      setAdminChat(transformAdminChatResponse(adminChatData));
    } catch (err) {
      console.error("Failed to load admin chat:", err);
    }
  };

  // Smart refresh untuk admin chat - mirip WhatsApp
  const { markActivity: markAdminChatActivity } = useSmartRefresh({
    onRefresh: loadAdminChat,
    minInterval: 10000, // 10s saat aktif (lebih cepat karena chat internal)
    maxInterval: 45000, // 45s saat idle
    enabled: !!activeAgentId && activeTab === "agent",
  });

  // ================= HANDLE MODE CHANGE =================
  const handleModeChange = async (mode: "bot" | "manual") => {
    if (!activeAgentId) return;

    // Update local state immediately
    setAdminChat((prev) => ({
      ...prev,
      mode,
    }));
  };

  // ================= SEND ADMIN MESSAGE =================
  const handleSendAdminMessage = async (text: string) => {
    if (!user || !activeAgentId) return;

    try {
      const newMessage = await sendAdminMessage(
        activeAgentId,
        text,
        user.name,
        "admin",
        adminChat.mode
      );

      setAdminChat((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: newMessage.id,
            text: newMessage.text,
            sender: newMessage.sender,
            time: newMessage.time,
            status: newMessage.status,
          },
        ],
      }));

      // Mark activity untuk trigger fast refresh
      markAdminChatActivity();
    } catch (err) {
      console.error("Failed to send admin message:", err);
      alert("Failed to send message to agent");
    }
  };

  const activeAgent = agents.find((a) => a.id === activeAgentId);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50">
      {/* Top Bar with Tab Switcher - ALWAYS VISIBLE */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-white border-b border-neutral-200 flex-shrink-0 gap-2">
        {/* Tab Switcher */}
        <div className="flex gap-0.5 sm:gap-1 bg-neutral-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("customer")}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md transition-all ${
              activeTab === "customer"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm font-medium hidden xs:inline sm:inline">Agent Chats</span>
          </button>
          <button
            onClick={() => setActiveTab("agent")}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md transition-all ${
              activeTab === "agent"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm font-medium hidden xs:inline sm:inline">Internal Chat</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={() => router.push("/dashboard-admin-monitoring")}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
            title="Agent Monitoring"
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Monitoring</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-neutral-900 text-white hover:bg-red-600 transition-all"
            title="Logout"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Content Area - Loading/Error/Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold text-neutral-900">
              Loading...
            </div>
            <div className="text-sm text-neutral-500">Fetching all chats</div>
          </div>
        </div>
      ) : error ? (
        /* Error state - show in content area only */
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">Error</div>
            <div className="text-sm text-neutral-500 mt-2">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
            >
              Retry
            </button>
          </div>
        </div>
      ) : activeTab === "customer" ? (
        /* Customer Chats View */
        <div className="flex flex-col md:grid flex-1 min-w-0 h-full transition-all duration-300"
          style={{ gridTemplateColumns: showCustomer ? "minmax(240px,280px) 1fr minmax(260px,300px)" : "minmax(240px,280px) 1fr" }}
        >
          {/* Chat List — hidden on mobile when chat is open */}
          <div className={`${activeChat ? "hidden md:flex md:flex-col" : "flex flex-col"} border-r overflow-hidden`}>
            <ChatList
              chats={chats}
              activeChatId={activeChatId}
              onSelectChat={(chat) => {
                setActiveChatId(chat.id);
                setShowCustomer(true);
              }}
              onDeleteChat={handleDeleteChat}
              isSelectMode={isSelectMode}
              selectedChats={selectedChats}
              onToggleSelectMode={handleToggleSelectMode}
              onToggleChatSelection={handleToggleChatSelection}
              onBulkDelete={handleBulkDelete}
              onSelectAll={handleSelectAll}
            />
          </div>

          {activeChat ? (
            <>
              {/* Chat Window */}
              <div className="flex flex-col min-w-0 overflow-hidden">
                {/* Back button on mobile */}
                <div className="md:hidden px-3 py-1.5 border-b bg-slate-50 flex-shrink-0">
                  <button
                    onClick={() => setActiveChatId(null)}
                    className="text-xs text-blue-600 flex items-center gap-1"
                  >
                    ← Kembali ke daftar
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <ChatWindow
                    chat={activeChat}
                    onSendMessage={handleSendMessage}
                    onAssignAgent={assignToAgent}
                    onPauseChat={handlePauseChat}
                    onCustomerMessage={(text) =>
                      handleCustomerMessage(activeChatId!, text)
                    }
                    onOpenCustomer={() => setShowCustomer((v) => !v)}
                    onNewMessage={loadChats}
                  />
                </div>
              </div>

              {/* Customer Detail — slide panel on mobile */}
              {showCustomer && (
                <div
                  className="fixed inset-0 z-40 bg-black/30 md:static md:bg-transparent md:z-auto"
                  onClick={(e) => { if (e.target === e.currentTarget) setShowCustomer(false); }}
                >
                  <div className="absolute right-0 top-0 h-full w-[300px] sm:w-[320px] bg-white shadow-xl md:static md:shadow-none md:w-auto overflow-y-auto">
                    <CustomerDetail
                      chat={activeChat}
                      onClose={() => setShowCustomer(false)}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="hidden md:flex items-center justify-center col-span-2">
              <div className="text-center">
                <div className="text-lg font-semibold text-neutral-900">No Chat Selected</div>
                <div className="text-sm text-neutral-500 mt-2">
                  {chats.length === 0 ? "No chats available yet" : "Select a chat from the list"}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Agent Chats View */
        <div className="grid flex-1 min-w-0 h-full grid-cols-1 md:grid-cols-[minmax(220px,280px)_1fr]">
          {/* Agent List */}
          <AgentList
            agents={agents}
            activeAgentId={activeAgentId}
            onSelectAgent={(agent) => setActiveAgentId(agent.id)}
          />

          {activeAgent ? (
            <AdminAgentChatWindow
              agent={activeAgent}
              adminChat={adminChat}
              onSendMessage={handleSendAdminMessage}
              onModeChange={handleModeChange}
            />
          ) : (
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-semibold text-neutral-900">
                  No Agent Selected
                </div>
                <div className="text-sm text-neutral-500 mt-2">
                  {agents.length === 0
                    ? "No agents available"
                    : "Select an agent to start chatting"}
                </div>
              </div>
            </div>
          )}
        </div>
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
