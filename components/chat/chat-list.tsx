"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MoreVertical } from "lucide-react";
import { Button } from "../ui/button";
import { Chat, Message } from "@/app/types/types";

interface ChatListProps {
  chats?: Chat[];
  activeChatId?: number;
  onSelectChat?: (chat: Chat) => void;
}

export default function ChatList({
  chats = [],
  activeChatId,
  onSelectChat,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="h-full min-w-0 border-r bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b">
        <div className="flex items-center gap-2">
          <p className="font-semibold">Inbox</p>
          <Badge>{chats.length}</Badge>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost">
            <Filter className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari chat..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredChats.map((chat) => {
            const lastMessage = chat.messages.at(-1);

            const unreadCount = chat.messages.filter(
              (msg: Message) =>
                msg.sender === "customer" && msg.status !== "read"
            ).length;

            const showUnread = unreadCount > 0 && activeChatId !== chat.id;

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat?.(chat)}
                className={`flex gap-3 p-3 rounded-lg cursor-pointer transition ${
                  activeChatId === chat.id
                    ? "bg-blue-100"
                    : "hover:bg-slate-200"
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm font-semibold">
                    {chat.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{chat.name}</p>
                  <p className="text-xs truncate opacity-80">
                    {lastMessage?.text ?? "Belum ada pesan"}
                  </p>
                </div>

                {showUnread && (
                  <span className="h-5 min-w-[20px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1">
                    {unreadCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
