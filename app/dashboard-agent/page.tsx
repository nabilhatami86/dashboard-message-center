"use client";

import { useState, useRef, useEffect } from "react";
import ChatList from "@/components/chat/chat-list";
import AdminChatWindow from "@/components/chat/admin-chat-window";
import CustomerDetail from "@/components/customer/customer-detail";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ChatWindow from "@/components/chat/chat-window";
import ShortcutManager from "@/components/chat/shortcut-manager";
import { Chat, AdminChat } from "@/app/types/types";
import { useAuthStore } from "@/store/authStore";
import AgentSidebar from "@/components/ui/agent-sidebar";
import {
  getChats,
  sendMessage,
  getAdminChat,
  sendAdminMessage,
  updateChatMode,
  getOnlineAgents,
  transferTicketByChat,
  sendAgentHeartbeat,
  setAgentOfflineBeacon,
  updateChatPriority,
  OnlineAgent,
} from "@/lib/api";
import {
  transformChatResponse,
  transformAdminChatResponse,
} from "@/lib/transform";
import { useSmartRefresh } from "@/hooks/useSmartRefresh";
import { useAgentStatusWebSocket } from "@/hooks/useAgentStatusWebSocket";

function DashboardAgentContent() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [showCustomer, setShowCustomer] = useState(true);
  const [activeTab, setActiveTab] = useState<"customer" | "admin" | "shortcuts">("customer");
  const [adminChat, setAdminChat] = useState<AdminChat>({
    id: 0,
    mode: "bot",
    messages: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialAgentList, setInitialAgentList] = useState<OnlineAgent[]>([]);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  // Ref wrapper agar loadChats bisa dipakai sebelum didefinisikan (avoid hoisting error)
  const loadChatsRef = useRef<() => void>(() => {});

  // Real-time online agents list via WebSocket (dipakai untuk dropdown transfer)
  // onChatTransferred: reload chat saat ada ticket yang ditransfer ke agent ini
  const agentList = useAgentStatusWebSocket(initialAgentList, user?.id, () => loadChatsRef.current());

  // Re-fetch daftar agent online (dipanggil saat modal transfer dibuka)
  const refreshOnlineAgents = () => {
    if (token) {
      console.log("[DEBUG] refreshOnlineAgents called");
      getOnlineAgents(token).then((list) => {
        console.log("[DEBUG] refreshOnlineAgents result:", list);
        setInitialAgentList(list);
      }).catch((e) => console.error("[DEBUG] refreshOnlineAgents error:", e));
    }
  };

  const isFirstLoadRef = useRef(true);

  // Load chats from backend
  const loadChats = async () => {
    if (!token) {
      setError("Please login first");
      setLoading(false);
      return;
    }

    // CRITICAL FIX: Capture isFirstLoad BEFORE any state changes
    const isFirstLoad = isFirstLoadRef.current;

    try {
      // Only show loading on initial load, not on auto-refresh
      if (isFirstLoad) {
        setLoading(true);
      }

      const chatData = await getChats(token);
      const transformedChats = chatData.map(transformChatResponse);

      // Update chats with smart comparison to avoid unnecessary re-renders
      setChats((prevChats) => {
        // On first load, set active chat
        if (isFirstLoad && transformedChats.length > 0 && !activeChatId) {
          setActiveChatId(transformedChats[0].id);
        }

        // Optimize: only update if there are actual changes
        if (
          prevChats.length === transformedChats.length &&
          prevChats.length > 0
        ) {
          const hasChanges = transformedChats.some((newChat, idx) => {
            const oldChat = prevChats[idx];
            if (!oldChat) return true;
            if (newChat.id !== oldChat.id) return true;
            if (newChat.unread !== oldChat.unread) return true;
            if (newChat.online !== oldChat.online) return true;
            if (newChat.mode !== oldChat.mode) return true;
            if (newChat.messages.length !== oldChat.messages.length)
              return true;
            return false;
          });

          if (!hasChanges) {
            return prevChats; // No changes, keep same reference
          }
        }

        return transformedChats;
      });

      setError(null);
    } catch (err) {
      console.error("Failed to load chats:", err);
      if (isFirstLoad) {
        setError("Failed to load chats from backend");
      }
    } finally {
      if (isFirstLoad) {
        setLoading(false);
        isFirstLoadRef.current = false;
      }
    }
  };
  // Selalu update ref agar WebSocket hook punya versi terbaru
  loadChatsRef.current = loadChats;

  // Smart refresh - mirip WhatsApp
  const { markActivity: markChatActivity } = useSmartRefresh({
    onRefresh: loadChats,
    minInterval: 15000, // 15s saat aktif
    maxInterval: 60000, // 60s saat idle
    enabled: !!token && activeTab === "customer",
  });

  // ================= LOAD ADMIN CHAT =================
  const loadAdminChat = async () => {
    // Skip jika tidak ada user atau sedang di tab admin chat
    if (!user || activeTab !== "admin") return;

    try {
      const adminChatData = await getAdminChat(user.id);
      setAdminChat(transformAdminChatResponse(adminChatData));
    } catch (err) {
      console.error("Failed to load admin chat:", err);
    }
  };

  // Smart refresh untuk admin chat
  const { markActivity: markAdminChatActivity } = useSmartRefresh({
    onRefresh: loadAdminChat,
    minInterval: 10000, // 10s saat aktif
    maxInterval: 45000, // 45s saat idle
    enabled: !!user && activeTab === "admin",
  });

  // ================= INITIAL LOAD =================
  // Load chats on component mount and when URL params change
  useEffect(() => {
    loadChats();

    // Load snapshot agent online untuk fitur transfer (update selanjutnya via WebSocket)
    if (token) {
      getOnlineAgents(token).then(setInitialAgentList).catch(() => {});
    }


    // Check if we need to refresh after claiming ticket
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('refresh') === 'true') {
      // Remove the refresh parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Re-load when token changes

  // ================= AGENT HEARTBEAT =================
  // Kirim heartbeat berkala agar backend tahu agent masih aktif (safety net)
  // Status online/offline utamanya dikontrol oleh login/logout di backend
  useEffect(() => {
    if (!token) return;

    // Heartbeat setiap 90 detik
    const heartbeatInterval = setInterval(() => {
      sendAgentHeartbeat(token);
    }, 90000);

    // Safety net: saat tab ditutup paksa (bukan logout normal),
    // kirim offline via keepalive fetch agar status tersync
    const handleBeforeUnload = () => {
      setAgentOfflineBeacon(token);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ================= REFRESH ON PAGE FOCUS =================
  // Refresh chats when user returns to the page (e.g., after claiming ticket)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeTab === "customer") {
        // Page became visible again - refresh chats
        loadChats();
      }
    };

    const handleFocus = () => {
      if (activeTab === "customer") {
        // Window got focus - refresh chats
        loadChats();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token]);

  const activeChat = chats.find((c) => c.id === activeChatId);

  // ================= SEND MESSAGE TO CUSTOMER =================
  const handleSendMessage = async (text: string, media?: { media_url: string; media_type: string; media_filename: string }) => {
    if (!token || !user || !activeChatId) return;

    // Optimistic update - add message to UI immediately
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
      // Backend akan kirim pesan ke WhatsApp

      // Mark activity untuk trigger fast refresh
      markChatActivity();
    } catch (err) {
      console.error("Failed to send message:", err);
      // Revert optimistic update if failed
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
    if (!activeChat || !token || !activeChatId || !nextMode) return;

    // SPECIAL: When closing chat, remove it from list immediately
    if (nextMode === "closed") {
      // Optimistic: remove chat from list
      setChats((prev) => prev.filter((c) => c.id !== activeChatId));
      // Deselect active chat
      setActiveChatId(null);
    } else {
      // Optimistic update - update UI immediately
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
        markChatActivity();
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
  // ================= TRANSFER TICKET =================
  const handleTransferTicket = async (toAgentId: number, reason: string) => {
    if (!token || !activeChatId) return;

    await transferTicketByChat(activeChatId, toAgentId, token, reason);

    // Setelah transfer, chat ini bukan milik agent ini lagi — hapus dari list
    setChats((prev) => prev.filter((c) => c.id !== activeChatId));
    setActiveChatId(null);
  };

  // ================= UPDATE PRIORITY =================
  const handleUpdatePriority = async (priority: "low" | "medium" | "high") => {
    if (!token || !activeChatId) return;

    // Optimistic update
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, priority } : c))
    );

    try {
      await updateChatPriority(activeChatId, priority, token);
    } catch (err) {
      console.error("Failed to update priority:", err);
      // Revert on error
      await loadChats();
    }
  };

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

  // Handle sending message to admin (internal chat)
  const handleSendAdminMessage = async (text: string) => {
    if (!user) return;

    try {
      // Pass "agent" as the sender parameter and adminChat.mode
      const newMessage = await sendAdminMessage(
        user.id,
        text,
        user.name,
        "agent",
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
      alert("Failed to send message to admin");
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50">
      {/* SIDEBAR */}
      <AgentSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setShowCustomer(tab === "customer");
        }}
      />

      {/* CONTENT AREA - with conditional loading/error states */}
      {loading ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold text-neutral-900">
              Loading...
            </div>
            <div className="text-sm text-neutral-500">Fetching your chats</div>
          </div>
        </div>
      ) : error ? (
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
      ) : (
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          {activeTab === "customer" ? (
            <div className={`grid h-full ${
              activeTab === "customer" && showCustomer && activeChat
                ? "grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr_300px]"
                : activeChat
                ? "grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr]"
                : "grid-cols-1 md:grid-cols-[260px_1fr]"
            }`}>
              {/* CHAT LIST — hidden on mobile when chat is open */}
              <div className={`${activeChat ? "hidden md:block" : "block"} border-r overflow-hidden`}>
                <ChatList
                  chats={chats}
                  activeChatId={activeChatId}
                  onSelectChat={(chat) => {
                    setActiveChatId(chat.id);
                    setShowCustomer(false);
                  }}
                />
              </div>

              {/* CHAT WINDOW & CUSTOMER DETAIL */}
              {activeChat ? (
              <>
                <div className="flex flex-col min-w-0 overflow-hidden">
                  {/* Back button on mobile */}
                  <div className="md:hidden px-3 py-1.5 border-b bg-slate-50">
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
                      onTransferTicket={handleTransferTicket}
                      onOpenTransfer={refreshOnlineAgents}
                      availableAgents={agentList}
                      onNewMessage={loadChats}
                    />
                  </div>
                </div>

                {/* CUSTOMER DETAIL — slide panel on mobile, column on lg */}
                {showCustomer && (
                  <div className="fixed inset-0 z-40 bg-black/30 lg:static lg:bg-transparent lg:z-auto"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowCustomer(false); }}>
                    <div className="absolute right-0 top-0 h-full w-[300px] sm:w-[320px] bg-white shadow-xl lg:static lg:shadow-none lg:w-auto overflow-y-auto">
                      <CustomerDetail
                        chat={activeChat}
                        onClose={() => setShowCustomer(false)}
                        onUpdatePriority={handleUpdatePriority}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="hidden md:flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-semibold text-neutral-900">
                    No Chat Selected
                  </div>
                  <div className="text-sm text-neutral-500 mt-2">
                    Select a chat from the list to start
                  </div>
                </div>
              </div>
            )}
            </div>
          ) : activeTab === "admin" ? (
          /* ADMIN CHAT WINDOW */
          <AdminChatWindow
            adminChat={adminChat}
            onSendMessage={handleSendAdminMessage}
          />
        ) : (
          /* SHORTCUT MANAGER */
          <ShortcutManager />
        )}
        </div>
      )}
    </div>
  );
}

export default function DashboardAgentPage() {
  return (
    <ProtectedRoute requiredRole="agent">
      <DashboardAgentContent />
    </ProtectedRoute>
  );
}
