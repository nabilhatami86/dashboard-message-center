"use client";

import { useState, useEffect } from "react";
import ChatList from "@/components/chat/chat-list";
import ChatWindow from "@/components/chat/chat-window";
import CustomerDetail from "@/components/customer/customer-detail";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Chat } from "@/app/types/types";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getChats, sendMessage } from "@/lib/api";
import { transformChatResponse } from "@/lib/transform";

function DashboardContent() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [showCustomer, setShowCustomer] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  // Load all chats from backend (Admin sees all chats)
  useEffect(() => {
    async function loadChats() {
      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const chatData = await getChats(token);
        const transformedChats = chatData.map(transformChatResponse);
        setChats(transformedChats);

        if (transformedChats.length > 0 && !activeChatId) {
          setActiveChatId(transformedChats[0].id);
        }

        setError(null);
      } catch (err) {
        console.error("Failed to load chats:", err);
        setError("Failed to load chats from backend");
      } finally {
        setLoading(false);
      }
    }

    loadChats();
    // Refresh chats every 5 seconds for real-time updates
    const interval = setInterval(loadChats, 5000);
    return () => clearInterval(interval);
  }, [token]);

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
      console.log("Customer message sent successfully");
    } catch (err) {
      console.error("Failed to send customer message:", err);
      // Revert on error
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: chat.messages.filter((m) => m.id !== optimisticMessage.id),
              }
            : chat
        )
      );
    }
  };

  // ================= ASSIGN AGENT =================
  const assignToAgent = async () => {
    if (!activeChat || !token) return;

    // Optimistic update
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, mode: "agent" as const } : c))
    );

    // TODO: Call backend API to update chat mode
    // await updateChatMode(activeChatId, "agent", token);
  };

  // ================= PAUSE / RESUME =================
  const handlePauseChat = async (nextMode: Chat["mode"]) => {
    if (!activeChat || !token) return;

    // Optimistic update
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, mode: nextMode } : c))
    );

    // TODO: Call backend API to update chat mode
    // await updateChatMode(activeChatId, nextMode, token);
  };

  // ================= AGENT/ADMIN SEND MESSAGE =================
  const handleSendMessage = async (text: string) => {
    if (!activeChat || activeChat.mode !== "agent" || !token || !user || !activeChatId) return;

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
      console.log("Message sent successfully to backend");
    } catch (err) {
      console.error("Failed to send message:", err);
      // Revert on error
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: chat.messages.filter((m) => m.id !== optimisticMessage.id),
              }
            : chat
        )
      );
      alert("Failed to send message. Please try again.");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-lg font-semibold text-neutral-900">Loading...</div>
          <div className="text-sm text-neutral-500">Fetching all chats</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
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
  if (chats.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-lg font-semibold text-neutral-900">No Chats</div>
          <div className="text-sm text-neutral-500">No chats available yet</div>
        </div>
      </div>
    );
  }

  // No active chat selected
  if (!activeChat) {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Logout Button - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-red-600 transition-all shadow-lg"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>

      <div
        className={`grid flex-1 min-w-0 h-full transition-all duration-300 ${
          showCustomer
            ? "grid-cols-[minmax(240px,320px)_1fr_minmax(280px,360px)]"
            : "grid-cols-[minmax(240px,320px)_1fr]"
        }`}
      >
        {/* Chat List */}
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={(chat) => {
            setActiveChatId(chat.id);
            setShowCustomer(true);
          }}
        />

        {/* Chat Window */}
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

        {/* Customer Detail */}
        {showCustomer && (
          <CustomerDetail
            chat={activeChat}
            onClose={() => setShowCustomer(false)}
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
