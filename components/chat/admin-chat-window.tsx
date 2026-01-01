"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, CheckCheck, Check, ShieldCheck } from "lucide-react";
import { AdminChat, Message } from "@/app/types/types";

interface Props {
  adminChat: AdminChat;
  onSendMessage: (text: string) => void;
}

export default function AdminChatWindow({
  adminChat,
  onSendMessage,
}: Props) {
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [adminChat.messages.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage("");
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-neutral-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-600 text-white font-semibold">
              <ShieldCheck className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="text-sm font-semibold text-neutral-900 leading-tight">
              Admin Support
            </p>
            <Badge className="mt-0.5 bg-blue-100 text-blue-700 text-[11px] border-blue-200">
              Internal Chat
            </Badge>
          </div>
        </div>
      </header>

      {/* MESSAGES */}
      <ScrollArea className="flex-1 min-h-0 bg-neutral-50">
        <div className="px-6 py-6 space-y-5">
          {adminChat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ShieldCheck className="h-12 w-12 text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-500">
                Belum ada pesan dengan admin
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Kirim pesan untuk memulai percakapan
              </p>
            </div>
          ) : (
            adminChat.messages.map((msg: Message) => {
              const fromAgent = msg.sender === "agent";
              const fromAdmin = msg.sender === "admin";

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    fromAgent ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`relative max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      fromAgent
                        ? "bg-neutral-900 text-white rounded-br-md"
                        : fromAdmin
                        ? "bg-blue-600 text-white rounded-bl-md"
                        : "bg-white text-neutral-900 border rounded-bl-md"
                    }`}
                  >
                    {fromAdmin && (
                      <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-90">
                        Admin
                      </p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>

                    <div
                      className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
                        fromAgent || fromAdmin
                          ? "text-white/70"
                          : "text-neutral-400"
                      }`}
                    >
                      <span>{msg.time}</span>
                      {fromAgent &&
                        (msg.status === "read" ? (
                          <CheckCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* INPUT */}
      <footer className="border-t border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Tulis pesan ke admin…"
            rows={1}
            className="
              flex-1 resize-none rounded-xl
              bg-neutral-100 px-4 py-3
              text-sm text-neutral-900
              placeholder:text-neutral-500
              focus:outline-none focus:ring-2 focus:ring-blue-300
            "
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim()}
            className="
              rounded-xl bg-blue-600 text-white
              hover:bg-blue-700
              disabled:opacity-40
            "
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </section>
  );
}
