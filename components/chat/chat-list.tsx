"use client";

import { useState, memo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Trash2, CheckSquare, X, MessageSquare } from "lucide-react";
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

  const allSelected = chats.length > 0 && selectedChats.size === chats.length;

  return (
    <aside className="h-full min-w-0 border-r border-neutral-200 bg-white flex flex-col text-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 h-14 border-b border-neutral-200 flex-shrink-0">
        {isSelectMode ? (
          <>
            <div className="flex items-center gap-1.5 min-w-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={onToggleSelectMode}
                className="h-8 w-8 shrink-0 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </Button>
              <p className="font-semibold text-sm truncate">
                {selectedChats.size > 0 ? `${selectedChats.size} dipilih` : "Pilih chat"}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={onSelectAll}
                className="text-xs px-2 hover:bg-neutral-100"
              >
                {allSelected ? "Batal semua" : "Semua"}
              </Button>
              {selectedChats.size > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onBulkDelete}
                  className="text-xs px-2 bg-red-500 hover:bg-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Hapus</span>
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-semibold tracking-wide">Inbox</p>
              <Badge className="bg-neutral-100 text-neutral-600 text-xs font-medium border-0 px-1.5">
                {chats.length}
              </Badge>
            </div>
            <div className="flex gap-0.5 shrink-0">
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-neutral-100">
                <Filter className="h-4 w-4 text-neutral-500" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-neutral-100"
                onClick={onToggleSelectMode}
                title="Pilih untuk hapus"
              >
                <CheckSquare className="h-4 w-4 text-neutral-500" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-neutral-200 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari chat..."
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-neutral-100 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                <MessageSquare className="h-5 w-5 text-neutral-400" />
              </div>
              <p className="text-sm font-medium text-neutral-600">
                {searchQuery ? "Tidak ditemukan" : "Belum ada chat"}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {searchQuery
                  ? `Tidak ada chat dengan nama "${searchQuery}"`
                  : "Chat akan muncul di sini"}
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const lastMessage = chat.messages.at(-1);

              const unreadCount = chat.messages.filter(
                (msg: Message) =>
                  msg.sender === "customer" && msg.status !== "read"
              ).length;

              const showUnread = unreadCount > 0 && activeChatId !== chat.id;
              const isActive = activeChatId === chat.id && !isSelectMode;
              const isSelected = selectedChats.has(chat.id);

              return (
                <div
                  key={chat.id}
                  className={`
                    group flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all relative
                    ${
                      isActive
                        ? "bg-neutral-100 ring-1 ring-neutral-200"
                        : isSelected
                        ? "bg-blue-50 ring-1 ring-blue-200"
                        : "hover:bg-neutral-50"
                    }
                  `}
                  onClick={() => {
                    if (isSelectMode) {
                      onToggleChatSelection?.(chat.id);
                    } else {
                      onSelectChat?.(chat);
                    }
                  }}
                >
                  {/* Checkbox untuk Select Mode */}
                  {isSelectMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleChatSelection?.(chat.id);
                      }}
                      className="h-4 w-4 shrink-0 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  )}

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`text-sm font-semibold ${
                        chat.group_id
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {chat.name
                          ?.split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    {showUnread && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center px-1 leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-sm truncate ${showUnread ? "font-semibold text-neutral-900" : "font-medium text-neutral-800"}`}>
                        {chat.name || "Unknown"}
                      </p>
                      {lastMessage?.time && (
                        <span className="text-[10px] text-neutral-400 shrink-0">
                          {lastMessage.time}
                        </span>
                      )}
                    </div>

                    {/* Badges row */}
                    <div className="flex items-center gap-1 mb-0.5">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1 py-0 h-3.5 border-0 shrink-0 ${
                          chat.group_id
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {chat.group_id ? "Grup" : "Pribadi"}
                      </Badge>
                      {chat.assignedAgent && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1 py-0 h-3.5 bg-purple-100 text-purple-700 border-0 truncate max-w-[80px]"
                        >
                          {chat.assignedAgent.name}
                        </Badge>
                      )}
                      {chat.group_id && chat.group_name && (
                        <span className="text-[10px] text-green-600 truncate">
                          {chat.group_name}
                        </span>
                      )}
                    </div>

                    <p className={`text-xs truncate ${showUnread ? "text-neutral-700" : "text-neutral-400"}`}>
                      {lastMessage
                        ? lastMessage.media_type
                          ? `[${lastMessage.media_type === "image" ? "Foto" : "File"}] ${lastMessage.text || ""}`
                          : lastMessage.text
                        : "Belum ada pesan"}
                    </p>
                  </div>

                  {/* Delete Button */}
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
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 shrink-0 hover:bg-red-100 hover:text-red-600"
                      title="Hapus chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })
          )}
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
