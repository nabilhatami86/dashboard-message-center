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
    <aside className="h-full min-w-0 border-r border-neutral-200 bg-white flex flex-col text-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <p className="font-semibold tracking-wide">Inbox</p>
          <Badge className="bg-neutral-100 text-neutral-700">
            {chats.length}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="hover:bg-neutral-100">
            <Filter className="h-4 w-4 text-neutral-600" />
          </Button>
          <Button size="icon" variant="ghost" className="hover:bg-neutral-100">
            <MoreVertical className="h-4 w-4 text-neutral-600" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-neutral-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari chat..."
            className="
              w-full pl-9 pr-3 py-2 text-sm rounded-lg
              bg-neutral-100 text-neutral-900
              placeholder:text-neutral-500
              focus:outline-none focus:ring-2 focus:ring-neutral-300
            "
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
                className={`
                  group flex gap-3 p-3 rounded-xl cursor-pointer transition-all
                  ${
                    activeChatId === chat.id
                      ? "bg-neutral-200 ring-1 ring-neutral-300"
                      : "hover:bg-neutral-100"
                  }
                `}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-neutral-300 text-sm font-semibold text-neutral-800">
                    {chat.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-neutral-900">
                    {chat.name}
                  </p>
                  <p className="text-xs truncate text-neutral-500">
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
