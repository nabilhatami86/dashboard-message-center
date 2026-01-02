"use client";

import { useState, useRef } from "react";
import ChatList from "@/components/chat/chat-list";
import ChatWindowAgent from "@/components/chat/chat-window-agent";
import AdminChatWindow from "@/components/chat/admin-chat-window";
import CustomerDetail from "@/components/customer/customer-detail";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Chat, AdminChat } from "@/app/types/types";
import { MessageSquare, ShieldCheck, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import {
  getChats,
  sendMessage,
  getAdminChat,
  sendAdminMessage,
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
  const logout = useAuthStore((state) => state.logout);

  const isFirstLoadRef = useRef(true);

  // Load chats from backend
  const loadChats = async () => {
    if (!token) {
      setError("Please login first");
      setLoading(false);
      return;
    }

    try {
      // Only show loading on initial load, not on auto-refresh
      const isFirstLoad = isFirstLoadRef.current;
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
          isFirstLoadRef.current = false;
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
      if (isFirstLoadRef.current) {
        setError("Failed to load chats from backend");
      }
    } finally {
      if (isFirstLoadRef.current) {
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

  // Load admin chat with auto-refresh
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

  const activeChat = chats.find((c) => c.id === activeChatId);

  // Handle sending message to customer (via WhatsApp backend)
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
      console.log("Message sent successfully to backend");

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

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-lg font-semibold text-neutral-900">
            Loading...
          </div>
          <div className="text-sm text-neutral-500">Fetching your chats</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
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
    );
  }

  // No chats state
  // if (chats.length === 0) {
  //   return (
  //     <div className="flex h-full w-full items-center justify-center bg-slate-50">
  //       <div className="text-center">
  //         <div className="text-lg font-semibold text-neutral-900">No Chats</div>
  //         <div className="text-sm text-neutral-500">No chats assigned to you yet</div>
  //       </div>
  //     </div>
  //   );
  // }

  // // No active chat selected
  // if (!activeChat) {
  //   return null;
  // }

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50">
      {/* TAB SWITCHER */}
      <div className="w-16 bg-neutral-900 flex flex-col items-center py-4 gap-2">
        <button
          onClick={() => {
            setActiveTab("customer");
            setShowCustomer(true);
          }}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            activeTab === "customer"
              ? "bg-white text-neutral-900 shadow-lg"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
          title="Customer Chats"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            setActiveTab("admin");
            setShowCustomer(false);
          }}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            activeTab === "admin"
              ? "bg-white text-neutral-900 shadow-lg"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
          title="Admin Chat"
        >
          <ShieldCheck className="h-5 w-5" />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-neutral-800 text-neutral-400 hover:bg-red-600 hover:text-white"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

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
                <ChatWindowAgent
                  chat={activeChat}
                  onSendMessage={handleSendMessage}
                  onEndChat={(mode) => {
                    // Update chat mode to closed
                    setChats((prev) =>
                      prev.map((c) =>
                        c.id === activeChatId ? { ...c, mode } : c
                      )
                    );
                  }}
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
