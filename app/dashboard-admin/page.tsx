"use client";

import { useState } from "react";
import ChatList from "@/components/chat/chat-list";
import ChatWindow from "@/components/chat/chat-window";
import CustomerDetail from "@/components/customer/customer-detail";
import { Chat } from "@/app/types/types";

const initialChats: Chat[] = [
  {
    id: 1,
    name: "Test Customer",
    channel: "WhatsApp",
    online: true,
    unread: 2,
    mode: "bot",
    profile: {
      phone: "+62 812-3456-7890",
      email: "test.customer@email.com",
      address: "Jakarta Selatan",
      lastActive: "Just now",
    },
    messages: [
      {
        id: 1,
        text: "Halo, saya butuh bantuan!",
        time: "13:00",
        sender: "customer",
        status: "sent",
      },
    ],
  },
  {
    id: 2,
    name: "Maria Lopez",
    channel: "WhatsApp",
    online: false,
    unread: 0,
    mode: "bot",
    profile: {
      phone: "+34 612-998-221",
      email: "maria@email.com",
      address: "Madrid",
      lastActive: "2 hours ago",
    },
    messages: [
      {
        id: 1,
        text: "Apakah pesanan saya sudah dikirim?",
        time: "08:45",
        sender: "customer",
        status: "read",
      },
    ],
  },
];

export default function Dashboard() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<number>(initialChats[0].id);
  const [showCustomer, setShowCustomer] = useState(true);

  const activeChat = chats.find((c) => c.id === activeChatId)!;

  const sendBotReply = (chatId: number, customerText: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: Date.now() + 1,
                  text: botReply(customerText),
                  sender: "agent",
                  time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  status: "sent",
                },
              ],
            }
          : chat
      )
    );
  };

  // ================= BOT =================
  function botReply(text: string) {
    const t = text.toLowerCase();
    if (t.includes("harga"))
      return "Untuk informasi harga, mohon sebutkan produknya ya.";
    if (t.includes("pesanan"))
      return "Baik, kami bantu cek status pesanan Anda.";
    if (t.includes("halo")) return "Halo 👋 ada yang bisa kami bantu?";
    return "Terima kasih pesannya, mohon tunggu sebentar ya.";
  }

  // ================= CUSTOMER MESSAGE =================
  const handleCustomerMessage = (chatId: number, text: string) => {
    // 1. tambah pesan customer
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: Date.now(),
                  text,
                  sender: "customer",
                  time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  status: "read",
                },
              ],
            }
          : chat
      )
    );

    // 2. cek mode dari snapshot terakhir
    const currentChat = chats.find((c) => c.id === chatId);
    if (currentChat?.mode === "bot") {
      setTimeout(() => {
        sendBotReply(chatId, text);
      }, 800);
    }
  };

  // ================= ASSIGN =================
  const assignToAgent = () => {
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, mode: "agent" } : c))
    );
  };

  // ================= PAUSE / RESUME =================
  const handlePauseChat = (nextMode: Chat["mode"]) => {
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, mode: nextMode } : c))
    );
  };

  // ================= AGENT SEND =================
  const handleSendMessage = (text: string) => {
    if (activeChat.mode !== "agent") return;

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: chat.messages.length + 1,
                  text,
                  sender: "agent",
                  time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  status: "sent",
                },
              ],
            }
          : chat
      )
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
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
            handleCustomerMessage(activeChatId, text)
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
