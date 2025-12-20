"use client";

import { useState, useEffect, useRef } from "react";
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
  Pause,
  Play,
  Check,
  CheckCheck,
  ChevronDown,
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

export default function ChatWindow({
  chat,
  onSendMessage,
  onAssignAgent,
  onPauseChat,
  onCustomerMessage,
  onOpenCustomer,
}: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastModeRef = useRef<ChatMode>("bot");

  /** mode aman (fallback) */
  const mode: ChatMode = chat.mode ?? "bot";

  const isPaused = mode === "paused";
  const isClosed = mode === "closed";
  const isAgent = mode === "agent";
  const disabled = isPaused || isClosed;

  const handleSend = () => {
    if (!message.trim() || !isAgent) return;
    onSendMessage(message.trim());
    setMessage("");
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      onPauseChat(lastModeRef.current);
    } else {
      lastModeRef.current = mode;
      onPauseChat("paused");
    }
  };
  const systemInfoText = (() => {
    if (mode === "paused") {
      return "Percakapan sedang dijeda. Pesan dari customer tetap masuk dan akan dibalas setelah chat dilanjutkan.";
    }

    if (mode === "agent") {
      return "Percakapan ini telah terhubung dengan admin.";
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
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="font-semibold">{chat.name}</p>
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
            onClick={handlePauseToggle}
            disabled={isClosed}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-1" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </>
            )}
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

          {chat.messages.map((msg: Message) => {
            const fromAgent = msg.sender === "agent";

            return (
              <div
                key={msg.id}
                className={`flex ${
                  fromAgent ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[65%] rounded-xl px-4 py-2 ${
                    fromAgent ? "bg-blue-500 text-white" : "bg-slate-100"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
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
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* INPUT */}
      <div className="border-t p-4 flex gap-2">
        <textarea
          value={message}
          disabled={disabled || !isAgent}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={
            isPaused
              ? "Chat sedang di-pause"
              : !isAgent
              ? "Assign ke agent untuk membalas"
              : "Tulis pesan..."
          }
          className="flex-1 resize-none rounded-lg border px-3 py-2"
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
  );
}
