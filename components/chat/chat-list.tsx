"use client";

import { useState, memo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Trash2, CheckSquare, X } from "lucide-react";
import { Button } from "../ui/button";
import { Chat, Message } from "@/app/types/types";

interface ChatListProps {
  chats?: Chat[];
  activeChatId?: number | null;
  onSelectChat?: (chat: Chat) => void;
  onDeleteChat?: (chatId: number) => void;
  isSelectMode?: boolean;
  selectedChats?: Set<number>;
  onToggleSelectMode?: () => void;
  onToggleChatSelection?: (chatId: number) => void;
  onBulkDelete?: () => void;
  onSelectAll?: () => void;
}

function ChatList({
  chats = [],
  activeChatId,
  onSelectChat,
  onDeleteChat,
  isSelectMode = false,
  selectedChats = new Set(),
  onToggleSelectMode,
  onToggleChatSelection,
  onBulkDelete,
  onSelectAll,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter((chat) =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="h-full min-w-0 border-r border-neutral-200 bg-white flex flex-col text-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-neutral-200">
        {isSelectMode ? (
          <>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggleSelectMode}
                className="hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </Button>
              <p className="font-semibold tracking-wide">
                {selectedChats.size} dipilih
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={onSelectAll}
                className="hover:bg-neutral-100"
              >
                Pilih Semua
              </Button>
              {selectedChats.size > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onBulkDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Hapus
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
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
              <Button
                size="icon"
                variant="ghost"
                className="hover:bg-neutral-100"
                onClick={onToggleSelectMode}
                title="Pilih untuk hapus"
              >
                <CheckSquare className="h-4 w-4 text-neutral-600" />
              </Button>
            </div>
          </>
        )}
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

            const isSelected = selectedChats.has(chat.id);

            return (
              <div
                key={chat.id}
                className={`
                  group flex gap-3 p-3 rounded-xl cursor-pointer transition-all relative
                  ${
                    activeChatId === chat.id && !isSelectMode
                      ? "bg-neutral-200 ring-1 ring-neutral-300"
                      : isSelected
                      ? "bg-blue-50 ring-1 ring-blue-300"
                      : "hover:bg-neutral-100"
                  }
                `}
              >
                {/* Checkbox untuk Select Mode */}
                {isSelectMode && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleChatSelection?.(chat.id);
                      }}
                      className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                )}

                <div
                  onClick={() => {
                    if (isSelectMode) {
                      onToggleChatSelection?.(chat.id);
                    } else {
                      onSelectChat?.(chat);
                    }
                  }}
                  className="flex gap-3 flex-1 min-w-0"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-neutral-300 text-sm font-semibold text-neutral-800">
                      {chat.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") ?? "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-neutral-900">
                      {chat.name ?? "Unknown"}
                    </p>
                    <p className="text-xs truncate text-neutral-500">
                      {lastMessage?.text ?? "Belum ada pesan"}
                    </p>
                  </div>

                  {!isSelectMode && showUnread && (
                    <span className="h-5 min-w-[20px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {/* Delete Button - Muncul saat hover (hanya di mode normal) */}
                {!isSelectMode && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Hapus chat dengan ${chat.name ?? "Unknown"}?`)) {
                        onDeleteChat?.(chat.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-red-100 hover:text-red-600"
                    title="Hapus chat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}

// Memo untuk mencegah re-render jika props tidak berubah
export default memo(ChatList, (prevProps, nextProps) => {
  // Return true jika props SAMA (skip re-render)
  // Return false jika props BERBEDA (lakukan re-render)

  return (
    prevProps.chats === nextProps.chats &&
    prevProps.activeChatId === nextProps.activeChatId &&
    prevProps.isSelectMode === nextProps.isSelectMode &&
    prevProps.selectedChats === nextProps.selectedChats
  );
});
