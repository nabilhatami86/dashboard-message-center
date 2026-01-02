"use client";

import { useState, useEffect, useRef } from "react";
import ChatList from "@/components/chat/chat-list";
import ChatWindow from "@/components/chat/chat-window";
import CustomerDetail from "@/components/customer/customer-detail";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Chat } from "@/app/types/types";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getChats, sendMessage, deleteChat } from "@/lib/api";
import { transformChatResponse } from "@/lib/transform";

function DashboardContent() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [showCustomer, setShowCustomer] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Select mode state - pindah ke parent agar tidak reset saat refresh
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<number>>(new Set());

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  // Use ref to track first load - tidak trigger re-render
  const isFirstLoadRef = useRef(true);
  const isSelectModeRef = useRef(false);

  // Update ref when isSelectMode changes
  useEffect(() => {
    isSelectModeRef.current = isSelectMode;
  }, [isSelectMode]);

  // Load all chats from backend (Admin sees all chats)
  useEffect(() => {
    async function loadChats() {
      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      try {
        // Jangan tampilkan loading spinner saat background refresh
        const isFirstLoad = isFirstLoadRef.current;
        if (isFirstLoad) {
          setLoading(true);
        }

        const chatData = await getChats(token);
        const transformedChats = chatData.map(transformChatResponse);

        setChats((prevChats) => {
          // PERBAIKAN: HANYA auto-select chat pertama pada first load
          if (isFirstLoad && transformedChats.length > 0) {
            setActiveChatId(transformedChats[0].id);
            isFirstLoadRef.current = false;
          }

          // OPTIMASI: Deep comparison untuk menghindari unnecessary re-render
          if (prevChats.length === transformedChats.length && prevChats.length > 0) {
            // Check apakah ada perubahan di setiap chat
            const hasChanges = transformedChats.some((newChat, idx) => {
              const oldChat = prevChats[idx];

              if (!oldChat) return true;

              // Compare chat properties
              if (newChat.id !== oldChat.id) return true;
              if (newChat.name !== oldChat.name) return true;
              if (newChat.online !== oldChat.online) return true;
              if (newChat.unread !== oldChat.unread) return true;
              if (newChat.mode !== oldChat.mode) return true;

              // Compare messages
              if (newChat.messages.length !== oldChat.messages.length) return true;

              // Compare last message only (optimization)
              const newLastMsg = newChat.messages.at(-1);
              const oldLastMsg = oldChat.messages.at(-1);

              if (newLastMsg?.id !== oldLastMsg?.id) return true;
              if (newLastMsg?.text !== oldLastMsg?.text) return true;
              if (newLastMsg?.status !== oldLastMsg?.status) return true;

              return false;
            });

            if (!hasChanges) {
              return prevChats; // Tidak ada perubahan, skip update
            }
          }

          return transformedChats;
        });

        setError(null);

        // Set loading false setelah first load berhasil
        if (isFirstLoad) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load chats:", err);
        setError("Failed to load chats from backend");
        setLoading(false); // PENTING: Set loading false saat error
      }
    }

    loadChats();
    // Refresh chats every 15 seconds (lebih lambat untuk UI yang smooth)
    // Skip refresh jika dalam select mode
    const interval = setInterval(() => {
      if (!isSelectModeRef.current) {
        loadChats();
      }
    }, 15000);

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
      console.log("Chat deleted successfully");
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
      console.log(`Successfully deleted ${chatIdsToDelete.length} chats`);
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
          onDeleteChat={handleDeleteChat}
          isSelectMode={isSelectMode}
          selectedChats={selectedChats}
          onToggleSelectMode={handleToggleSelectMode}
          onToggleChatSelection={handleToggleChatSelection}
          onBulkDelete={handleBulkDelete}
          onSelectAll={handleSelectAll}
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
