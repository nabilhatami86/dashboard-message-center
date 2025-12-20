"use client";

import { useState } from "react";
import ChatList from "@/components/chat/chat-list";
import ChatWindowAgent from "@/components/chat/chat-window-agent";
import CustomerDetail from "@/components/customer/customer-detail";
import { Chat } from "@/app/types/types";

const initialChats: Chat[] = [
  {
    id: 1,
    name: "Test Customer",
    channel: "WhatsApp",
    online: true,
    unread: 1,
    profile: {
      phone: "+62 812-3456-7890",
      email: "test@email.com",
      address: "Jakarta",
      lastActive: "Online",
    },
    messages: [
      {
        id: 1,
        text: "Halo, saya butuh bantuan!",
        time: "13:00",
        sender: "customer",
        status: "read",
      },
    ],
  },
];

export default function DashboardAgentPage() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<number>(initialChats[0].id);
  const [showCustomer, setShowCustomer] = useState(true);

  const activeChat = chats.find((c) => c.id === activeChatId)!;

  const handleSendMessage = (text: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: Date.now(),
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
    <div className="flex h-full w-full overflow-hidden bg-slate-50">
      <div
        className={`grid flex-1 min-w-0 h-full ${
          showCustomer ? "grid-cols-[280px_1fr_320px]" : "grid-cols-[280px_1fr]"
        }`}
      >
        {/* CHAT LIST */}
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={(chat) => {
            setActiveChatId(chat.id);
            setShowCustomer(true);
          }}
        />

        {/* CHAT WINDOW */}
        <ChatWindowAgent
          chat={activeChat}
          onSendMessage={handleSendMessage}
          onOpenCustomer={() => setShowCustomer(true)}
        />

        {/* CUSTOMER DETAIL */}
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
