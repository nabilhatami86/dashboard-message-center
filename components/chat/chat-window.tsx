"use client";

import { useState, useEffect, useRef, memo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Paperclip,
  MoreVertical,
  UserPlus,
  Check,
  CheckCheck,
  ChevronDown,
  Reply,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { Chat, Message, ChatMode } from "@/app/types/types";

interface ChatWindowProps {
  chat: Chat;
  onSendMessage: (text: string) => void;
  onAssignAgent: () => void;
  onPauseChat: (nextMode: ChatMode) => void;
  onCustomerMessage: (text: string) => void;
  onOpenCustomer?: () => void;
}

function ChatWindow({
  chat,
  onSendMessage,
  onAssignAgent,
  onPauseChat,
  onCustomerMessage,
  onOpenCustomer,
}: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /** mode aman (fallback) */
  const mode: ChatMode = chat.mode ?? "bot";

  const isPaused = mode === "paused";
  const isClosed = mode === "closed";
  const isAgent = mode === "agent";
  const disabled = isPaused || isClosed;

  const handleSend = () => {
    if (!message.trim() || !isAgent) return;

    if (editingMessage) {
      // TODO: Implement edit message API
      console.log("Edit message:", editingMessage.id, message);
      setEditingMessage(null);
    } else if (replyTo) {
      // Send with reply context
      const replyMessage = `[Reply to: ${replyTo.text}]\n${message}`;
      onSendMessage(replyMessage);
      setReplyTo(null);
    } else {
      onSendMessage(message.trim());
    }

    setMessage("");
  };

  const handleReply = (msg: Message) => {
    setReplyTo(msg);
    setEditingMessage(null);
  };

  const handleEdit = (msg: Message) => {
    setMessage(msg.text);
    setEditingMessage(msg);
    setReplyTo(null);
  };

  const handleDelete = (msg: Message) => {
    if (window.confirm("Hapus pesan ini?")) {
      // TODO: Implement delete message API
      console.log("Delete message:", msg.id);
    }
  };

  const cancelReplyOrEdit = () => {
    setReplyTo(null);
    setEditingMessage(null);
    setMessage("");
  };

  const handleEndChat = () => {
    if (window.confirm("Akhiri sesi chat ini? Customer akan kembali ke bot jika chat lagi.")) {
      // Set ke closed untuk mengakhiri chat
      onPauseChat("closed");
    }
  };

  const systemInfoText = (() => {
    if (mode === "closed") {
      return "✅ Sesi chat sudah selesai. Chat baru dari customer akan ditangani bot terlebih dahulu.";
    }

    if (mode === "paused") {
      return "⏸️ Chat sedang dijeda sementara.";
    }

    if (mode === "agent") {
      return "💬 Bot dinonaktifkan. Semua pesan ditangani oleh agent.";
    }

    if (mode === "bot") {
      return "🤖 Chat sedang ditangani oleh bot. Klik Assign untuk mengambil alih percakapan.";
    }

    return null;
  })();

  /** auto scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      {/* HEADER */}
      <div className="border-b p-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenCustomer}
          className="flex items-center gap-3"
        >
          <Avatar>
            <AvatarFallback>
              {chat.name
                ?.split(" ")
                .map((w) => w[0])
                .join("") ?? "?"}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="font-semibold">{chat.name ?? "Unknown"}</p>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary">{chat.channel}</Badge>
              <Badge
                variant={
                  mode === "bot"
                    ? "default"
                    : mode === "agent"
                    ? "outline"
                    : "destructive"
                }
              >
                {mode.toUpperCase()}
              </Badge>
            </div>
          </div>
        </button>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onAssignAgent}
            disabled={mode !== "bot"}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Assign
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleEndChat}
            disabled={isClosed || mode === "bot"}
            className={isClosed ? "opacity-50" : ""}
          >
            <X className="h-4 w-4 mr-1" />
            {isClosed ? "Selesai" : "End Chat"}
          </Button>

          {/* SIMULASI CUSTOMER */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Simulasi Customer</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                "Halo",
                "Saya mau tanya harga",
                "Pesanan saya sudah dikirim?",
                "Saya ingin komplain",
                "Terima kasih",
              ].map((text) => (
                <DropdownMenuItem
                  key={text}
                  onClick={() => onCustomerMessage(text)}
                >
                  {text}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="icon" variant="ghost">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* MESSAGES */}
      {/* MESSAGES */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6 space-y-4">
          {/* SYSTEM INFO */}
          {systemInfoText && (
            <div className="flex justify-center">
              <div className="text-xs text-slate-600 bg-slate-100 border rounded-full px-4 py-1">
                {systemInfoText}
              </div>
            </div>
          )}

          {/* NOTIFIKASI SESI SELESAI (jika chat closed) */}
          {isClosed && (
            <div className="flex justify-center my-6">
              <div className="max-w-md text-center bg-green-50 border border-green-200 rounded-xl px-6 py-4">
                <div className="text-green-800 font-semibold mb-2">
                  ✅ Sesi Chat Berakhir
                </div>
                <p className="text-sm text-green-700">
                  Terima kasih atas waktunya. Sesi chat telah selesai. Jika customer chat lagi, percakapan akan dimulai dari bot.
                </p>
              </div>
            </div>
          )}

          {chat.messages.map((msg: Message) => {
            const fromAgent = msg.sender === "agent";

            return (
              <div
                key={msg.id}
                className={`group flex ${
                  fromAgent ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex items-end gap-2 max-w-[70%]">
                  {/* Message actions - show on hover (left side for agent, right side for customer) */}
                  {fromAgent && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mb-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-slate-200"
                        onClick={() => handleReply(msg)}
                        title="Reply"
                      >
                        <Reply className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-slate-200"
                        onClick={() => handleEdit(msg)}
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-red-100 hover:text-red-600"
                        onClick={() => handleDelete(msg)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`rounded-xl px-4 py-2 ${
                      fromAgent ? "bg-blue-500 text-white" : "bg-slate-100"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 text-xs mt-1 opacity-70">
                      <span>{msg.time}</span>
                      {fromAgent &&
                        (msg.status === "read" ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        ))}
                    </div>
                  </div>

                  {/* Message actions for customer messages */}
                  {!fromAgent && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mb-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-slate-200"
                        onClick={() => handleReply(msg)}
                        title="Reply"
                      >
                        <Reply className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* INPUT */}
      <div className="border-t">
        {/* Reply/Edit indicator */}
        {(replyTo || editingMessage) && (
          <div className="px-4 pt-3 pb-2 bg-slate-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {editingMessage ? (
                <>
                  <Edit2 className="h-4 w-4 text-blue-600" />
                  <span className="text-slate-700">
                    Editing message: <span className="font-medium">{editingMessage.text.substring(0, 30)}...</span>
                  </span>
                </>
              ) : replyTo ? (
                <>
                  <Reply className="h-4 w-4 text-blue-600" />
                  <span className="text-slate-700">
                    Replying to: <span className="font-medium">{replyTo.text.substring(0, 30)}...</span>
                  </span>
                </>
              ) : null}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={cancelReplyOrEdit}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="p-4 flex gap-2">
          <textarea
            value={message}
            disabled={disabled || !isAgent}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
              if (e.key === "Escape") {
                cancelReplyOrEdit();
              }
            }}
            placeholder={
              isClosed
                ? "Sesi chat sudah selesai. Chat baru dari customer akan mulai dari bot."
                : isPaused
                ? "Chat sedang dijeda sementara."
                : !isAgent
                ? "Assign ke agent untuk membalas"
                : editingMessage
                ? "Edit your message..."
                : replyTo
                ? "Type your reply..."
                : "Tulis pesan..."
            }
            className="flex-1 resize-none rounded-lg border px-3 py-2"
            rows={3}
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || !isAgent || disabled}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Memo untuk mencegah re-render jika chat tidak berubah
export default memo(ChatWindow, (prevProps, nextProps) => {
  return prevProps.chat === nextProps.chat;
});
