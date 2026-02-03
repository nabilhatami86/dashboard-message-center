"use client";

import { useState, useRef, useEffect } from "react";
import ChatList from "@/components/chat/chat-list";
import AdminChatWindow from "@/components/chat/admin-chat-window";
import CustomerDetail from "@/components/customer/customer-detail";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ChatWindow from "@/components/chat/chat-window";
import { Chat, AdminChat } from "@/app/types/types";
import { useAuthStore } from "@/store/authStore";
import AgentSidebar from "@/components/ui/agent-sidebar";
import {
  getChats,
  sendMessage,
  getAdminChat,
  sendAdminMessage,
  updateChatMode,
} from "@/lib/api";
import {
  transformChatResponse,
  transformAdminChatResponse,
} from "@/lib/transform";
import { useSmartRefresh } from "@/hooks/useSmartRefresh";

function DashboardAgentContent() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [showCustomer, setShowCustomer] = useState(true);
  const [activeTab, setActiveTab] = useState<"customer" | "admin">("customer");
  const [adminChat, setAdminChat] = useState<AdminChat>({
    id: 0,
    mode: "bot",
    messages: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

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

    // Check if we need to refresh after claiming ticket
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('refresh') === 'true') {
      // Remove the refresh parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Re-load when token changes

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
  const handleSendMessage = async (text: string) => {
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
    if (!activeChat || !token) return;

    // Optimistic update
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId ? { ...c, mode: "agent" as const } : c
      )
    );

    // TODO: Call backend API to update chat mode
    // await updateChatMode(activeChatId, "agent", token);
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
        <div
          className={`grid flex-1 min-w-0 h-full ${
            activeTab === "customer" && showCustomer
              ? "grid-cols-[280px_1fr_320px]"
              : activeTab === "customer"
              ? "grid-cols-[280px_1fr]"
              : "grid-cols-[1fr]"
          }`}
        >
          {activeTab === "customer" ? (
            <>
              {/* CHAT LIST */}
              <ChatList
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={(chat) => {
                  setActiveChatId(chat.id);
                  setShowCustomer(true);
                }}
              />

              {/* CHAT WINDOW & CUSTOMER DETAIL */}
              {activeChat ? (
              <>
                <ChatWindow
                  chat={activeChat}
                  onSendMessage={handleSendMessage}
                  onAssignAgent={assignToAgent}
                  onPauseChat={handlePauseChat}
                  onCustomerMessage={(text) =>
                    handleCustomerMessage(activeChatId!, text)
                  }
                  onOpenCustomer={() => setShowCustomer(true)}
                />

                {/* CUSTOMER DETAIL */}
                {showCustomer && (
                  <CustomerDetail
                    chat={activeChat}
                    onClose={() => setShowCustomer(false)}
                  />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center col-span-2">
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
          </>
        ) : (
          /* ADMIN CHAT WINDOW */
          <AdminChatWindow
            adminChat={adminChat}
            onSendMessage={handleSendAdminMessage}
          />
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
